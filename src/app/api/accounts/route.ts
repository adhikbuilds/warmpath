import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_ACCOUNTS } from "@/lib/demo-data";
import { DEMO_ACCOUNTS_EXTRA } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const prismaAccounts = await prisma.bizAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    const baseAccounts =
      prismaAccounts.length > 0 ? prismaAccounts : [...DEMO_ACCOUNTS, ...DEMO_ACCOUNTS_EXTRA];

    // Try Twenty CRM if configured
    if (process.env.TWENTY_API_KEY) {
      try {
        const { syncFromTwenty } = await import("@/lib/twenty/sync");
        const twentyData = await syncFromTwenty();
        // Merge: Twenty accounts come first (they are the CRM of record)
        const prismaSet = new Set(baseAccounts.map((a) => a.name.toLowerCase()));
        const newFromTwenty = twentyData.accounts.filter(
          (a) => !prismaSet.has(a.name.toLowerCase()),
        );
        return NextResponse.json([...newFromTwenty, ...baseAccounts]);
      } catch {
        // Twenty not available, use Prisma/demo only
      }
    }

    return NextResponse.json(baseAccounts);
  } catch {
    return NextResponse.json([...DEMO_ACCOUNTS, ...DEMO_ACCOUNTS_EXTRA]);
  }
}

export async function POST(req: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json().catch(() => ({}));
    const {
      name,
      domain,
      industry,
      employeeCount,
      location,
      description,
      stage,
      fitScore,
      intentScore,
      warmthScore,
      logoUrl,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const account = await prisma.bizAccount.create({
      data: {
        workspaceId,
        name: name.trim(),
        domain: domain?.trim() || null,
        industry: industry?.trim() || null,
        employeeCount: employeeCount ? Number(employeeCount) : null,
        location: location?.trim() || null,
        description: description?.trim() || null,
        stage: stage || "prospect",
        fitScore: fitScore ?? 0,
        intentScore: intentScore ?? 0,
        warmthScore: warmthScore ?? 0,
        logoUrl: logoUrl?.trim() || null,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
