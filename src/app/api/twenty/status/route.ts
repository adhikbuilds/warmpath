import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();

  const connection = await prisma.integrationConnection
    .findUnique({
      where: { workspaceId_provider: { workspaceId, provider: "twenty" } },
    })
    .catch(() => null);

  // Configured = the instance has Twenty credentials (so a first sync is
  // possible), or this workspace has already synced at least once.
  const configured = Boolean(process.env.TWENTY_API_KEY) || !!connection;

  return NextResponse.json({
    configured,
    status: connection?.status ?? (configured ? "ready" : "disconnected"),
    connectedAt: connection?.createdAt ?? null,
    lastSyncAt: connection?.lastSyncAt ?? null,
  });
}
