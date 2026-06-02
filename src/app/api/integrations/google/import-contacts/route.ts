import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

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

    for (const person of connections) {
      const name = person.names?.[0]?.displayName;
      const email = person.emailAddresses?.[0]?.value;
      const company = person.organizations?.[0]?.name;
      const title = person.organizations?.[0]?.title;

      if (!name || !email) {
        skipped++;
        continue;
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
      if (existingContact) {
        await prisma.contact.update({
          where: { id: existingContact.id },
          data: { name, title, accountId },
        });
      } else {
        await prisma.contact.create({
          data: { workspaceId, name, email, title, accountId, warmthScore: 30 },
        });
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
        metadataJson: JSON.stringify({ imported, skipped, total: connections.length }),
      },
    });

    return NextResponse.json({ imported, skipped, total: connections.length });
  } catch (err) {
    console.error("Google contacts import error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

type GooglePerson = {
  names?: Array<{ displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
};
