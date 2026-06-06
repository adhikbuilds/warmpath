import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";

const APP_URL = process.env.NEXTAUTH_URL ?? "https://warmpath-frontend.ashysea-7d3de045.centralindia.azurecontainerapps.io";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const emails: string[] = Array.isArray(body.emails)
    ? body.emails
    : body.email
      ? [body.email]
      : [];

  if (!emails.length) {
    return NextResponse.json({ error: "At least one email is required" }, { status: 400 });
  }

  const { workspaceId } = await getWorkspaceContext();
  const workspace = workspaceId
    ? await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } })
    : null;
  const workspaceName = workspace?.name ?? "WarmPath";
  const inviterName = session.user.name ?? session.user.email ?? "A teammate";

  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    // No email service — return the invite link so the caller can share it manually
    const inviteLink = `${APP_URL}/login`;
    return NextResponse.json({
      success: true,
      fallback: true,
      inviteLink,
      message: `RESEND_API_KEY not set — share this link manually: ${inviteLink}`,
      emails,
    });
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);

  const results: Array<{ email: string; ok: boolean; error?: string }> = [];

  for (const email of emails.slice(0, 20)) {
    const html = buildInviteEmail({ inviterName, workspaceName, appUrl: APP_URL });
    const { error } = await resend.emails.send({
      from: "WarmPath <noreply@warmpath.app>",
      to: email,
      subject: `${inviterName} invited you to join ${workspaceName} on WarmPath`,
      html,
    });
    results.push({ email, ok: !error, error: error?.message });
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  return NextResponse.json({
    success: sent > 0,
    sent,
    failed: failed.length,
    errors: failed.length > 0 ? failed : undefined,
  });
}

function buildInviteEmail({
  inviterName,
  workspaceName,
  appUrl,
}: {
  inviterName: string;
  workspaceName: string;
  appUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafafa">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e8e8ea;overflow:hidden">
    <div style="background:#131315;padding:24px 32px;display:flex;align-items:center;gap:10px">
      <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px">WarmPath</span>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111">You're invited</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6">
        <strong style="color:#111">${inviterName}</strong> has invited you to join
        <strong style="color:#111">${workspaceName}</strong> on WarmPath — the AI outbound platform that routes
        every prospect through your team's real relationship graph.
      </p>
      <a href="${appUrl}/login" style="display:inline-block;background:#8083ff;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:-0.2px">
        Accept invitation →
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.6">
        Sign in with Google to get started. Once you connect your LinkedIn,
        your network becomes part of the relationship graph — every contact your team
        reaches out to gets routed through the warmest possible intro path.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e8e8ea;text-align:center">
      <p style="margin:0;font-size:12px;color:#aaa">
        WarmPath · AI-first B2B outbound · <a href="${appUrl}" style="color:#8083ff;text-decoration:none">warmpath.ai</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
