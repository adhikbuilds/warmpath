import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_AI_USAGE } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext();
    const logs = await prisma.aIUsageLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    if (logs.length === 0) {
      return NextResponse.json(DEMO_AI_USAGE);
    }
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
