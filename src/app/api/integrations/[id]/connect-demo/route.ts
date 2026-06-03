import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const existing = await prisma.integrationConnection.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return notFound("Integration");
  const updated = await prisma.integrationConnection.update({
    where: { id },
    data: { status: "demo", demoMode: true, lastSyncAt: new Date(), syncStatus: "ok" },
  });
  return NextResponse.json(updated);
}
