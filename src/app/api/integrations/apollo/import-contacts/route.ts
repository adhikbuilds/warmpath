import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

type ApolloPerson = {
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
  organization?: {
    name?: string | null;
    id?: string | null;
    primary_domain?: string | null;
  } | null;
};

type ApolloSearchResponse = {
  people?: ApolloPerson[];
  pagination?: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
};

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
    if (!APOLLO_API_KEY) {
      return NextResponse.json(
        {
          error: "Apollo API key not configured",
          hint: "Add APOLLO_API_KEY to environment",
        },
        { status: 501 },
      );
    }

    const workspaceId = await getWorkspaceId();

    // Load workspace ICP context (for audit logging / future ICP-based filtering)
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        industry: true,
        description: true,
        primaryGoal: true,
        sellingMotion: true,
      },
    });

    // Call Apollo People Search
    const apolloRes = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Authorization: `Bearer ${APOLLO_API_KEY}`,
      },
      body: JSON.stringify({
        api_key: APOLLO_API_KEY,
        person_titles: [
          "VP Sales",
          "Head of Sales",
          "CRO",
          "VP Revenue",
          "Director of Sales",
          "VP Marketing",
          "CMO",
        ],
        person_locations: ["India"],
        contact_email_status: ["verified"],
        page: 1,
        per_page: 25,
      }),
    });

    if (!apolloRes.ok) {
      const text = await apolloRes.text();
      return NextResponse.json(
        { error: `Apollo API error: ${apolloRes.status} ${text}` },
        { status: 502 },
      );
    }

    const apolloData: ApolloSearchResponse = await apolloRes.json();
    const people = apolloData.people ?? [];

    let imported = 0;
    let skipped = 0;

    const repName = session.user.name ?? session.user.email?.split("@")[0] ?? "Team Member";

    for (const person of people) {
      const firstName = person.first_name?.trim() ?? "";
      const lastName = person.last_name?.trim() ?? "";
      const name = person.name?.trim() || [firstName, lastName].filter(Boolean).join(" ");
      const email = person.email?.trim() ?? "";

      // Need at least a name to create a meaningful contact
      if (!name) {
        skipped++;
        continue;
      }

      const title = person.title?.trim() || undefined;
      const linkedinUrl = person.linkedin_url?.trim() || undefined;
      const companyName = person.organization?.name?.trim() || undefined;

      // Find or create the BizAccount for this company
      let accountId: string | undefined;
      if (companyName) {
        const existingAccount = await prisma.bizAccount.findFirst({
          where: {
            workspaceId,
            name: { equals: companyName, mode: "insensitive" },
          },
        });
        if (existingAccount) {
          accountId = existingAccount.id;
        } else {
          const created = await prisma.bizAccount.create({
            data: { workspaceId, name: companyName, stage: "prospect" },
          });
          accountId = created.id;
        }
      }

      // Upsert contact — match by email first, then name + company
      let contactId: string;
      if (email) {
        const existing = await prisma.contact.findFirst({
          where: { workspaceId, email },
        });
        if (existing) {
          await prisma.contact.update({
            where: { id: existing.id },
            data: {
              name,
              title: title ?? existing.title,
              linkedinUrl: linkedinUrl ?? existing.linkedinUrl,
              accountId: accountId ?? existing.accountId,
            },
          });
          contactId = existing.id;
        } else {
          const created = await prisma.contact.create({
            data: {
              workspaceId,
              name,
              email,
              title,
              linkedinUrl,
              accountId,
              warmthScore: 30,
            },
          });
          contactId = created.id;
        }
      } else {
        // No verified email — upsert by name + company
        const existing = accountId
          ? await prisma.contact.findFirst({ where: { workspaceId, name, accountId } })
          : await prisma.contact.findFirst({ where: { workspaceId, name } });
        if (existing) {
          await prisma.contact.update({
            where: { id: existing.id },
            data: {
              title: title ?? existing.title,
              linkedinUrl: linkedinUrl ?? existing.linkedinUrl,
              accountId: accountId ?? existing.accountId,
            },
          });
          contactId = existing.id;
        } else {
          const created = await prisma.contact.create({
            data: { workspaceId, name, title, linkedinUrl, accountId, warmthScore: 30 },
          });
          contactId = created.id;
        }
      }

      // Create a relationship edge if one does not already exist
      const existingEdge = await prisma.relationshipEdge.findFirst({
        where: { workspaceId, fromId: session.user.id, toId: contactId },
      });

      if (!existingEdge) {
        await prisma.relationshipEdge
          .create({
            data: {
              workspaceId,
              fromType: "user",
              fromId: session.user.id,
              fromName: repName,
              toType: "contact",
              toId: contactId,
              toName: name,
              relationshipType: "linkedin_connection",
              strengthScore: 30,
              source: "apollo_import",
            },
          })
          .catch((edgeErr) => {
            console.error(
              `[apollo-import] Edge creation failed for contact ${contactId}:`,
              edgeErr,
            );
          });
      }

      imported++;
    }

    // Audit log entry
    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: session.user.id,
        action: "apollo_contacts_imported",
        entityType: "integration",
        entityId: "apollo",
        metadataJson: JSON.stringify({
          imported,
          skipped,
          total: people.length,
          workspaceName: workspace?.name,
        }),
      },
    });

    return NextResponse.json({ imported, skipped, total: people.length });
  } catch (err) {
    console.error("[apollo-import] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
