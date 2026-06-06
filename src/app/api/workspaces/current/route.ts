import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({}, { status: 401 });

    let workspace = await prisma.workspace.findFirst({
      where: { members: { some: { userId: ctx.userId } } },
      include: {
        members: {
          include: { user: { select: { name: true, email: true, image: true } } },
        },
      },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "My Workspace",
          ownerId: ctx.userId,
          onboardingStage: "not_started",
          members: { create: { userId: ctx.userId, role: "owner" } },
        },
        include: {
          members: {
            include: { user: { select: { name: true, email: true, image: true } } },
          },
        },
      });
    }

    return NextResponse.json(workspace);
  } catch (err) {
    console.error("[workspaces/current]", err);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { name, onboardingStage } = body as { name?: string; onboardingStage?: string };

    const member = await prisma.workspaceMember.findFirst({
      where: { userId: ctx.userId },
      select: { workspaceId: true },
    });

    if (!member) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const updated = await prisma.workspace.update({
      where: { id: member.workspaceId },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(onboardingStage ? { onboardingStage } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[workspaces/current PATCH]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
