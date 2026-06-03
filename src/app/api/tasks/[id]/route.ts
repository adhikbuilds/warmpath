import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: { account: true, contact: true },
  });
  if (!task) return notFound("Task");
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.task.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Task");
  const { title, description, priority, status, dueAt, type } = body;
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(type !== undefined && { type }),
      ...(dueAt !== undefined && { dueAt: dueAt ? new Date(dueAt) : null }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const existing = await prisma.task.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Task");
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
