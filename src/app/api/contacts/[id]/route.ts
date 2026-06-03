import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const contact = await prisma.contact.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
    include: { account: true },
  });
  if (!contact) return notFound("Contact");
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.contact.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Contact");
  const { name, email, phone, title, linkedinUrl, seniority, department, persona, fitScore, warmthScore, engagementScore, consentStatus, avatarUrl, accountId } = body;
  const updated = await prisma.contact.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(title !== undefined && { title }),
      ...(linkedinUrl !== undefined && { linkedinUrl }),
      ...(seniority !== undefined && { seniority }),
      ...(department !== undefined && { department }),
      ...(persona !== undefined && { persona }),
      ...(fitScore !== undefined && { fitScore: Number(fitScore) }),
      ...(warmthScore !== undefined && { warmthScore: Number(warmthScore) }),
      ...(engagementScore !== undefined && { engagementScore: Number(engagementScore) }),
      ...(consentStatus !== undefined && { consentStatus }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(accountId !== undefined && { accountId }),
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
  const existing = await prisma.contact.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
  if (!existing) return notFound("Contact");
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
