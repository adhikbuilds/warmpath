import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const invite = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({
    workspaceName: invite.workspace.name,
    inviterName: invite.invitedBy.name ?? invite.invitedBy.email,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    status: invite.status,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const token = body.token as string | undefined;
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const invite = await prisma.workspaceInvitation.findUnique({
    where: { token },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status === "accepted") {
    // Idempotent: already accepted — check if user is now a member
    const existing = await prisma.workspaceMember.findFirst({
      where: { workspaceId: invite.workspaceId, userId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        workspaceId: invite.workspaceId,
        alreadyMember: true,
      });
    }
    return NextResponse.json({ error: "This invite has already been used" }, { status: 409 });
  }

  if (invite.status !== "pending" || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invite link has expired. Ask your teammate to send a new one." },
      { status: 410 },
    );
  }

  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "This invite was sent to a different email address." },
      { status: 403 },
    );
  }

  // Check if user is already a member (idempotent join)
  const alreadyMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId: invite.workspaceId, userId: session.user.id },
  });

  await prisma.$transaction([
    ...(alreadyMember
      ? []
      : [
          prisma.workspaceMember.create({
            data: {
              workspaceId: invite.workspaceId,
              userId: session.user.id,
              role: invite.role,
              seatStatus: "active",
            },
          }),
        ]),
    prisma.workspaceInvitation.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedAt: new Date(), acceptedByUserId: session.user.id },
    }),
  ]);

  return NextResponse.json({ success: true, workspaceId: invite.workspaceId });
}
