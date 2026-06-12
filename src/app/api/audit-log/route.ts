import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const logs = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = await getWorkspaceId();
    if (!workspaceId || workspaceId === "ws-1") {
      return NextResponse.json({ error: "Workspace not found" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, entityType, entityId, metadata } = body;

    if (!action?.trim()) return NextResponse.json({ error: "action is required" }, { status: 400 });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: session.user.id,
        actorName: session.user.name ?? session.user.email ?? "Unknown",
        action: action.trim(),
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
