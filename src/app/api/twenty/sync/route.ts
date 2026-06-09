import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { getTwentyCompanies, getTwentyPeople } from "@/lib/twenty/client";

// Pull companies + people from the connected Twenty CRM and persist them into
// the CALLER's workspace (scoped by workspaceId — no cross-workspace bleed).
// Upserts by name (accounts) / email (contacts), matching the Google import.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.TWENTY_API_KEY || !process.env.TWENTY_API_URL) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Twenty CRM is not configured — set TWENTY_API_URL and TWENTY_API_KEY in your environment",
      },
      { status: 400 },
    );
  }

  const workspaceId = await getWorkspaceId();

  try {
    const [companies, people] = await Promise.all([getTwentyCompanies(), getTwentyPeople()]);

    let accounts = 0;
    let contacts = 0;
    const companyIdMap = new Map<string, string>(); // Twenty company id -> BizAccount id

    for (const c of companies) {
      if (!c.name?.trim()) continue;
      const existing = await prisma.bizAccount.findFirst({
        where: { workspaceId, name: { equals: c.name, mode: "insensitive" } },
      });
      if (existing) {
        companyIdMap.set(c.id, existing.id);
      } else {
        const created = await prisma.bizAccount.create({
          data: { workspaceId, name: c.name, stage: "prospect" },
        });
        companyIdMap.set(c.id, created.id);
        accounts++;
      }
    }

    for (const p of people) {
      const fullName = [p.name?.firstName, p.name?.lastName].filter(Boolean).join(" ").trim();
      if (!fullName) continue;
      const email = p.emails?.primaryEmail?.trim() || null;
      const accountId = p.company ? (companyIdMap.get(p.company.id) ?? null) : null;
      const linkedinUrl = p.linkedinLink?.primaryLinkUrl ?? null;

      const existing = email
        ? await prisma.contact.findFirst({ where: { workspaceId, email } })
        : null;

      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: { name: fullName, title: p.jobTitle ?? null, accountId },
        });
      } else {
        await prisma.contact.create({
          data: {
            workspaceId,
            name: fullName,
            email,
            title: p.jobTitle ?? null,
            accountId,
            linkedinUrl,
            warmthScore: 35,
          },
        });
        contacts++;
      }
    }

    await prisma.integrationConnection.upsert({
      where: { workspaceId_provider: { workspaceId, provider: "twenty" } },
      create: {
        workspaceId,
        provider: "twenty",
        channel: "crm",
        displayName: "Twenty CRM",
        description: "Synced accounts and contacts from Twenty CRM",
        status: "connected",
        authType: "api_key",
        healthScore: 100,
        lastSyncAt: new Date(),
      },
      update: { status: "connected", lastSyncAt: new Date(), errorMessage: null },
    });

    await prisma.auditLog
      .create({
        data: {
          workspaceId,
          actorUserId: session.user.id,
          action: "twenty_synced",
          entityType: "integration",
          entityId: "twenty",
          metadataJson: JSON.stringify({ accounts, contacts }),
        },
      })
      .catch(() => null);

    return NextResponse.json({ ok: true, accounts, contacts });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Twenty sync failed" },
      { status: 500 },
    );
  }
}
