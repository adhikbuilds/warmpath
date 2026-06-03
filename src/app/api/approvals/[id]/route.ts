import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const approval = await prisma.approval.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!approval) return notFound("Approval");
  return NextResponse.json(approval);
}
