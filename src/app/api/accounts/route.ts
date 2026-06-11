import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
