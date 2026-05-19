import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_ACCOUNTS } from "@/lib/demo-data";
import { DEMO_ACCOUNTS_EXTRA } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const accounts = await prisma.bizAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    if (accounts.length === 0) {
      return NextResponse.json([...DEMO_ACCOUNTS, ...DEMO_ACCOUNTS_EXTRA]);
    }
    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json([...DEMO_ACCOUNTS, ...DEMO_ACCOUNTS_EXTRA]);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
