import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const message = await prisma.message.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!message) return notFound("Message");
  return NextResponse.json(message);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.message.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Message");
  const {
    subject,
    body: msgBody,
    status,
    approvalStatus,
    scheduledAt,
    personalizationReason,
    introRequest,
  } = body;
  const updated = await prisma.message.update({
    where: { id },
    data: {
      ...(subject !== undefined && { subject }),
      ...(msgBody !== undefined && { body: msgBody }),
      ...(status !== undefined && { status }),
      ...(approvalStatus !== undefined && { approvalStatus }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      ...(personalizationReason !== undefined && { personalizationReason }),
      ...(introRequest !== undefined && { introRequest }),
    },
  });
  return NextResponse.json(updated);
}
