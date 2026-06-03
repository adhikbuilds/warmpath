import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const signal = await prisma.signal.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!signal) return notFound("Signal");
  return NextResponse.json(signal);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.signal.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Signal");
  const { type, title, description, source, sourceUrl, urgencyScore, confidenceScore } = body;
  const updated = await prisma.signal.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(source !== undefined && { source }),
      ...(sourceUrl !== undefined && { sourceUrl }),
      ...(urgencyScore !== undefined && { urgencyScore: Number(urgencyScore) }),
      ...(confidenceScore !== undefined && { confidenceScore: Number(confidenceScore) }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const existing = await prisma.signal.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Signal");
  await prisma.signal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
