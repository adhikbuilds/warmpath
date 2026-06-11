import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

// Personal / free email providers — never treat their domain as a company.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "yahoo.co.in",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "msn.com",
  "rediffmail.com",
  "zoho.com",
  "ymail.com",
]);

// Derive a human company name from a business email domain.
// "jane@acme-corp.com" -> "Acme Corp"; free providers -> null.
function deriveCompanyFromEmail(email: string): string | undefined {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain || FREE_EMAIL_DOMAINS.has(domain)) return undefined;
  const label = domain.split(".")[0];
  if (!label) return undefined;
  return label
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

type GooglePerson = {
  names?: Array<{ displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
};

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId();

    // Fetch the Google OAuth account to get the access token
    const oauthAccount = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
    });

    if (!oauthAccount?.access_token) {
      return NextResponse.json(
        { error: "Google not connected — please sign in with Google first" },
        { status: 400 },
      );
    }

    // Call Google People API
    const res = await fetch(
      "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers&pageSize=200",
      { headers: { Authorization: `Bearer ${oauthAccount.access_token}` } },
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Google API error: ${res.status} ${text}` },
        { status: 400 },
      );
    }

    const data = await res.json();
    const connections: GooglePerson[] = data.connections ?? [];

    let imported = 0;
    let skipped = 0;
    let edgesFailed = 0;

    // Derive the user's email domain for coworker detection
    const userEmailDomain = session.user.email?.split("@")[1]?.toLowerCase() ?? "";

    for (const person of connections) {
      const rawName = person.names?.[0]?.displayName;
      const email = person.emailAddresses?.[0]?.value;
      const title = person.organizations?.[0]?.title;
      const phone = person.phoneNumbers?.[0]?.value;

      if (!email) {
        skipped++;
        continue;
      }

      // Use the Google-provided org name; otherwise derive a company from the
      // email's business domain so the contact isn't orphaned (and never store
      // an email string as a company name). Returns null for free providers.
      const company = person.organizations?.[0]?.name || deriveCompanyFromEmail(email);

      // Google sometimes sets displayName = email for contacts with no name
      const nameIsEmail = !rawName || rawName === email || rawName.includes("@");
      const name = nameIsEmail
        ? email
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : rawName;

      if (!name) {
        skipped++;
        continue;
      }

      // Determine relationship type and strength based on contact context
      const contactEmailDomain = email.split("@")[1]?.toLowerCase() ?? "";
      const isCoworker =
        userEmailDomain &&
        contactEmailDomain === userEmailDomain &&
        !FREE_EMAIL_DOMAINS.has(contactEmailDomain);
      const hasPhone = !!phone;

      let relationshipType: string;
      let strengthScore: number;
      if (isCoworker) {
        relationshipType = "coworker_connection";
        strengthScore = 55;
      } else if (hasPhone) {
        relationshipType = "email_history";
        strengthScore = 45;
      } else {
        relationshipType = "linkedin_connection";
        strengthScore = 35;
      }

      // Find or create the company account
      let accountId: string | undefined;
      if (company) {
        const existing = await prisma.bizAccount.findFirst({
          where: { workspaceId, name: { equals: company, mode: "insensitive" } },
        });
        if (existing) {
          accountId = existing.id;
        } else {
          const created = await prisma.bizAccount.create({
            data: { workspaceId, name: company, stage: "prospect" },
          });
          accountId = created.id;
        }
      }

      // Upsert the contact by email within workspace
      const existingContact = await prisma.contact.findFirst({
        where: { workspaceId, email },
      });

      let contactId: string;
      if (existingContact) {
        await prisma.contact.update({
          where: { id: existingContact.id },
          data: { name, title, accountId },
        });
        contactId = existingContact.id;
      } else {
        const newContact = await prisma.contact.create({
          data: { workspaceId, name, email, title, accountId, warmthScore: 30 },
        });
        contactId = newContact.id;
      }

      // Seed/update a relationship edge so the graph engine can find this contact.
      // For existing contacts we check if an edge already exists before creating one.
      try {
        const existingEdge = await prisma.relationshipEdge.findFirst({
          where: { workspaceId, fromId: session.user.id, toId: contactId },
        });
        if (!existingEdge) {
          await prisma.relationshipEdge.create({
            data: {
              workspaceId,
              fromType: "user",
              fromId: session.user.id,
              fromName: session.user.name ?? session.user.email?.split("@")[0] ?? "Team Member",
              toType: "contact",
              toId: contactId,
              toName: name,
              relationshipType,
              strengthScore,
              source: "google_contacts_import",
            },
          });
        } else if (
          existingEdge.relationshipType !== relationshipType ||
          existingEdge.strengthScore !== strengthScore
        ) {
          // Update strength/type if we have better data now
          await prisma.relationshipEdge.update({
            where: { id: existingEdge.id },
            data: { relationshipType, strengthScore },
          });
        }
      } catch (edgeErr) {
        edgesFailed++;
        console.error(
          `[google-import] Failed to create edge for contact ${contactId} (${email}):`,
          edgeErr,
        );
      }

      imported++;
    }

    // Log the integration event
    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: session.user.id,
        action: "google_contacts_imported",
        entityType: "integration",
        entityId: "google",
        metadataJson: JSON.stringify({
          imported,
          skipped,
          edgesFailed,
          total: connections.length,
        }),
      },
    });

    return NextResponse.json({ imported, skipped, edgesFailed, total: connections.length });
  } catch (err) {
    console.error("Google contacts import error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
