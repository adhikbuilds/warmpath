import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: { steps: true, assets: { take: 10 } },
  });
  if (!campaign) return notFound("Campaign");
  return NextResponse.json(campaign);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.campaign.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Campaign");
  const { name, type, goal, status, targetSegment, channelsJson } = body;
  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(goal !== undefined && { goal }),
      ...(status !== undefined && { status }),
      ...(targetSegment !== undefined && { targetSegment }),
      ...(channelsJson !== undefined && { channelsJson }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const existing = await prisma.campaign.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Campaign");
  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
