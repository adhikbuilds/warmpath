import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const item = await prisma.knowledgeBaseItem.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!item) return notFound("Knowledge base item");
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.knowledgeBaseItem.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Knowledge base item");
  const { title, type, content, source, tagsJson, confidenceScore, approvedForAi } = body;
  const updated = await prisma.knowledgeBaseItem.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && { type }),
      ...(content !== undefined && { content }),
      ...(source !== undefined && { source }),
      ...(tagsJson !== undefined && { tagsJson }),
      ...(confidenceScore !== undefined && { confidenceScore: Number(confidenceScore) }),
      ...(approvedForAi !== undefined && { approvedForAi: Boolean(approvedForAi) }),
    },
  });
  return NextResponse.json(updated);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const existing = await prisma.knowledgeBaseItem.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Knowledge base item");
  await prisma.knowledgeBaseItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
