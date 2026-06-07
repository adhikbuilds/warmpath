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

  if (!connection) {
    return NextResponse.json({ configured: false });
  }

  return NextResponse.json({
    configured: true,
    status: connection.status,
    connectedAt: connection.createdAt,
    lastSyncAt: connection.lastSyncAt,
  });
}
