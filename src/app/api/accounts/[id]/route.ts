import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const account = await prisma.bizAccount.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!account) return notFound("Account");
  return NextResponse.json(account);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.bizAccount.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Account");
  const { name, domain, industry, employeeCount, location, description, stage, fitScore, intentScore, warmthScore, logoUrl } = body;
  const updated = await prisma.bizAccount.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(domain !== undefined && { domain }),
      ...(industry !== undefined && { industry }),
      ...(employeeCount !== undefined && { employeeCount: Number(employeeCount) }),
      ...(location !== undefined && { location }),
      ...(description !== undefined && { description }),
      ...(stage !== undefined && { stage }),
      ...(fitScore !== undefined && { fitScore: Number(fitScore) }),
      ...(intentScore !== undefined && { intentScore: Number(intentScore) }),
      ...(warmthScore !== undefined && { warmthScore: Number(warmthScore) }),
      ...(logoUrl !== undefined && { logoUrl }),
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
  const existing = await prisma.bizAccount.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Account");
  await prisma.bizAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
