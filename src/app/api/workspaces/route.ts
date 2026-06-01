import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(
    memberships.map(({ workspace, role }) => ({
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      memberCount: workspace._count.members,
      ownerId: workspace.ownerId,
      role,
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json().catch(() => ({}));
  if (!name?.trim()) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }

  const userId = session.user.id;
  const workspaceId = `ws-${Date.now()}-${userId.slice(0, 8)}`;

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { id: workspaceId, name: name.trim(), ownerId: userId, plan: "free" },
    });
    await tx.workspaceMember.create({
      data: { workspaceId: ws.id, userId, role: "owner", seatStatus: "active" },
    });
    return ws;
  });

  return NextResponse.json({ id: workspace.id, name: workspace.name }, { status: 201 });
}
