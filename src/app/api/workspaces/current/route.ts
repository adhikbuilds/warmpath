import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext, getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_WORKSPACE, DEMO_WORKSPACE_MEMBERS } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: { select: { name: true, email: true, image: true } } },
        },
        invitations: {
          where: { status: "pending", expiresAt: { gt: new Date() } },
          include: { invitedBy: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!workspace) {
      return NextResponse.json(
        isDemo
          ? { ...DEMO_WORKSPACE, members: DEMO_WORKSPACE_MEMBERS, pendingInvitations: [] }
          : null,
      );
    }
    const { invitations, ...rest } = workspace;
    // Empty workspace in demo mode — overlay demo members so relationship graph has team nodes
    if (isDemo && rest.members.length <= 1) {
      return NextResponse.json({
        ...rest,
        members: DEMO_WORKSPACE_MEMBERS,
        pendingInvitations: invitations,
      });
    }
    return NextResponse.json({ ...rest, pendingInvitations: invitations });
  } catch {
    return NextResponse.json({
      ...DEMO_WORKSPACE,
      members: DEMO_WORKSPACE_MEMBERS,
      pendingInvitations: [],
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    const allowedFields: (keyof {
      name: string;
      domain: string;
      industry: string;
      companySize: string;
      website: string;
      description: string;
      region: string;
      sellingMotion: string;
      primaryGoal: string;
    })[] = [
      "name",
      "domain",
      "industry",
      "companySize",
      "website",
      "description",
      "region",
      "sellingMotion",
      "primaryGoal",
    ];

    const data: Record<string, string> = {};
    for (const field of allowedFields) {
      if (field in body && typeof body[field] === "string") {
        data[field] = body[field];
      }
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });
    return NextResponse.json(workspace);
  } catch {
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}
