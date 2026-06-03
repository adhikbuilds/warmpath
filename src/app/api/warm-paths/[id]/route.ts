import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const path = await prisma.warmPath.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: { account: true, contact: true },
  });
  if (!path) return notFound("Warm path");
  return NextResponse.json(path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.warmPath.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Warm path");
  const { pathJson, explanation, warmthScore, confidenceScore, recommendedIntroPerson, recommendedChannel, status } = body;
  const updated = await prisma.warmPath.update({
    where: { id },
    data: {
      ...(pathJson !== undefined && { pathJson }),
      ...(explanation !== undefined && { explanation }),
      ...(warmthScore !== undefined && { warmthScore: Number(warmthScore) }),
      ...(confidenceScore !== undefined && { confidenceScore: Number(confidenceScore) }),
      ...(recommendedIntroPerson !== undefined && { recommendedIntroPerson }),
      ...(recommendedChannel !== undefined && { recommendedChannel }),
      ...(status !== undefined && { status }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const existing = await prisma.warmPath.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Warm path");
  await prisma.warmPath.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
