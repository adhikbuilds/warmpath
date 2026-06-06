import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const item = await prisma.knowledgeBaseItem.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!item) return notFound("Knowledge base item");
  const updated = await prisma.knowledgeBaseItem.update({
    where: { id },
    data: { approvedForAi: !item.approvedForAi },
  });
  return NextResponse.json(updated);
}
