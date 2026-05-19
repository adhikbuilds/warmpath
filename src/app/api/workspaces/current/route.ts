import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_WORKSPACE } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: { select: { name: true, email: true, image: true } } },
        },
      },
    });
    if (!workspace) {
      return NextResponse.json(DEMO_WORKSPACE);
    }
    return NextResponse.json(workspace);
  } catch {
    return NextResponse.json(DEMO_WORKSPACE);
  }
}

export async function PATCH() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
