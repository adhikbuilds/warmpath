import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext, notFound, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const integration = await prisma.integrationConnection.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!integration) return notFound("Integration");
  return NextResponse.json(integration);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.integrationConnection.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!existing) return notFound("Integration");
  const { displayName, status, authType, scopesJson, capabilitiesJson, lastSyncAt, syncStatus, errorMessage } = body;
  const updated = await prisma.integrationConnection.update({
    where: { id },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(status !== undefined && { status }),
      ...(authType !== undefined && { authType }),
      ...(scopesJson !== undefined && { scopesJson }),
      ...(capabilitiesJson !== undefined && { capabilitiesJson }),
      ...(lastSyncAt !== undefined && { lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : null }),
      ...(syncStatus !== undefined && { syncStatus }),
      ...(errorMessage !== undefined && { errorMessage }),
    },
  });
  return NextResponse.json(updated);
}
