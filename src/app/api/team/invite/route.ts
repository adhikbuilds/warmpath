import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";

const APP_URL =
  process.env.NEXTAUTH_URL ??
  "https://warmpath-frontend.ashysea-7d3de045.centralindia.azurecontainerapps.io";

const SENDER = "DoNotReply@f9c936e5-ece1-4698-ae75-dec1ed6b5c30.azurecomm.net";

async function sendEmail(to: string, subject: string, html: string): Promise<string | null> {
  const connStr = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
  if (!connStr) return "AZURE_COMMUNICATION_CONNECTION_STRING not configured";

  const { EmailClient } = await import("@azure/communication-email");
  const client = new EmailClient(connStr);

  const poller = await client.beginSend({
    senderAddress: SENDER,
    content: { subject, html },
    recipients: { to: [{ address: to }] },
  });
  await poller.pollUntilDone();
  return null; // null = success
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawEmails: string[] = Array.isArray(body.emails)
    ? body.emails
    : body.email
      ? [body.email]
      : [];

  if (!rawEmails.length) {
    return NextResponse.json({ error: "At least one email is required" }, { status: 400 });
  }

  const { workspaceId } = await getWorkspaceContext();
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  const requesterMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id, seatStatus: "active" },
  });
  if (!requesterMember) {
    return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  }

  // Email delivery is optional. If no email provider is configured we still
  // create the invitation and return a shareable accept link (copy-link flow).
  const emailConfigured = Boolean(process.env.AZURE_COMMUNICATION_CONNECTION_STRING);

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });
  const workspaceName = workspace?.name ?? "WarmPath";
  const inviterName = session.user.name ?? session.user.email;

  const existingMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId, seatStatus: "active" },
    include: { user: { select: { email: true } } },
  });
  const memberEmails = new Set(
    existingMembers.map((m) => m.user.email?.toLowerCase()).filter(Boolean),
  );

  const pendingInvites = await prisma.workspaceInvitation.findMany({
    where: { workspaceId, status: "pending", expiresAt: { gt: new Date() } },
    select: { email: true },
  });
  const pendingEmails = new Set(pendingInvites.map((i) => i.email));

  const results: Array<{
    email: string;
    status: "sent" | "skipped" | "failed" | "link";
    reason?: string;
    inviteId?: string;
    acceptUrl?: string;
  }> = [];

  for (const rawEmail of rawEmails.slice(0, 20)) {
    const email = rawEmail.trim().toLowerCase();
    if (!email) continue;

    if (memberEmails.has(email)) {
      results.push({ email, status: "skipped", reason: "already_member" });
      continue;
    }
    if (pendingEmails.has(email)) {
      results.push({ email, status: "skipped", reason: "already_invited" });
      continue;
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await prisma.workspaceInvitation.create({
      data: { workspaceId, email, role: "sales_rep", invitedByUserId: session.user.id, expiresAt },
    });

    const acceptUrl = `${APP_URL}/invite/accept?token=${invite.token}`;

    if (!emailConfigured) {
      // No email provider — hand back the link for the inviter to share.
      results.push({ email, status: "link", inviteId: invite.id, acceptUrl });
      continue;
    }

    const sendError = await sendEmail(
      email,
      `${inviterName} invited you to join ${workspaceName} on WarmPath`,
      buildInviteEmail({ inviterName, workspaceName, acceptUrl }),
    );

    if (sendError) {
      // Email failed but the invite is valid — still return the link.
      results.push({ email, status: "failed", reason: sendError, inviteId: invite.id, acceptUrl });
    } else {
      results.push({ email, status: "sent", inviteId: invite.id, acceptUrl });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const links = results.filter((r) => r.status === "link" || r.status === "failed");

  return NextResponse.json({
    success: sent > 0 || links.length > 0,
    sent,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    emailConfigured,
    // Links to share when email isn't sent (no provider, or send failed).
    links: links.map((r) => ({ email: r.email, acceptUrl: r.acceptUrl })),
    invites: results,
  });
}

function buildInviteEmail({
  inviterName,
  workspaceName,
  acceptUrl,
}: {
  inviterName: string;
  workspaceName: string;
  acceptUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafafa">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e8e8ea;overflow:hidden">
    <div style="background:#131315;padding:24px 32px">
      <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px">WarmPath</span>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111">You're invited</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6">
        <strong style="color:#111">${inviterName}</strong> has invited you to join
        <strong style="color:#111">${workspaceName}</strong> on WarmPath — the AI outbound platform
        that routes every prospect through your team's real relationship graph.
      </p>
      <a href="${acceptUrl}" style="display:inline-block;background:#8083ff;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:-0.2px">
        Accept invitation →
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.6">
        This link expires in 7 days. Sign in with Google to get started.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e8e8ea;text-align:center">
      <p style="margin:0;font-size:12px;color:#aaa">
        WarmPath · AI-first B2B outbound · <a href="${APP_URL}" style="color:#8083ff;text-decoration:none">warmpath.ai</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
