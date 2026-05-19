import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_AUDIT_LOGS } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    if (logs.length === 0) {
      return NextResponse.json(DEMO_AUDIT_LOGS);
    }
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json(DEMO_AUDIT_LOGS);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
