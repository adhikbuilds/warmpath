import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  await prisma.relationshipEdge.deleteMany({ where: { id, workspaceId: ctx.workspaceId } });
  return NextResponse.json({ ok: true });
}
