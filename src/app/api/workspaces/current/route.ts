import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext, getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_WORKSPACE } from "@/lib/demo-data-extended";

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
      return isDemo
        ? NextResponse.json(DEMO_WORKSPACE)
        : NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    const { invitations, ...rest } = workspace;
    return NextResponse.json({ ...rest, pendingInvitations: invitations });
  } catch {
    return NextResponse.json({ error: "Failed to load workspace" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
