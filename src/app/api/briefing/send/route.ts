import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId();

    // Gather briefing data from DB
    const [warmPaths, signals, tasks, pendingCount, workspace] = await Promise.all([
      prisma.warmPath.findMany({
        where: { workspaceId },
        orderBy: { warmthScore: "desc" },
        take: 3,
        include: { contact: true, account: true },
      }),
      prisma.signal.findMany({
        where: { workspaceId },
        orderBy: { urgencyScore: "desc" },
        take: 3,
        include: { account: true },
      }),
      prisma.task.findMany({
        where: { workspaceId, status: "pending" },
        take: 5,
      }),
      prisma.message.count({
        where: { workspaceId, approvalStatus: "pending" },
      }),
      prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } }),
    ]);

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const workspaceName = workspace?.name ?? "WarmBlue";
    const recipientName = session.user.name ?? session.user.email.split("@")[0];

    const html = buildBriefingEmail({
      warmPaths,
      signals,
      tasks,
      pendingCount,
      workspaceName,
      recipientName,
    });

    const { error } = await resend.emails.send({
      from: `${workspaceName} Briefing <briefing@warmpath.app>`,
      to: session.user.email,
      subject: `${workspaceName} Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
      html,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

type BriefingWarmPath = {
  warmthScore: number;
  contact?: { name?: string | null } | null;
  account?: { name?: string | null } | null;
};
type BriefingSignal = {
  title: string;
  urgencyScore: number;
  account?: { name?: string | null } | null;
};
type BriefingTask = { title: string };

function buildBriefingEmail(data: {
  warmPaths: BriefingWarmPath[];
  signals: BriefingSignal[];
  tasks: BriefingTask[];
  pendingCount: number;
  workspaceName: string;
  recipientName: string;
}): string {
  const { warmPaths, signals, tasks, pendingCount, workspaceName, recipientName } = data;
  const appUrl = process.env.NEXTAUTH_URL ?? "https://warmpath.app";

  const warmPathRows =
    warmPaths.length > 0
      ? warmPaths
          .map(
            (wp) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e8e8ea">
          <strong style="color:#111">${wp.contact?.name ?? "Unknown"}</strong>
          <span style="color:#666"> at ${wp.account?.name ?? "Unknown"}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e8e8ea;text-align:right">
          <span style="background:#10b981;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">${wp.warmthScore} warmth</span>
        </td>
      </tr>`,
          )
          .join("")
      : `<tr><td colspan="2" style="padding:8px 0;color:#999;font-style:italic">No warm paths yet.</td></tr>`;

  const signalRows =
    signals.length > 0
      ? signals
          .map(
            (s) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e8e8ea">
          <strong style="color:#111">${s.title}</strong>
          <div style="color:#666;font-size:12px">${s.account?.name ?? ""}</div>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e8e8ea;text-align:right;color:#f59e0b;font-weight:600">${s.urgencyScore}</td>
      </tr>`,
          )
          .join("")
      : `<tr><td colspan="2" style="padding:8px 0;color:#999;font-style:italic">No urgent signals.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fafafa">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e8e8ea;overflow:hidden">
    <div style="background:#2563eb;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">${workspaceName} Briefing</h1>
    </div>
    <div style="padding:24px 32px">
      <p style="margin:0 0 20px;color:#333;font-size:15px">Hi ${recipientName},</p>
      ${
        pendingCount > 0
          ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:24px">
        <span style="color:#1e40af;font-weight:600">${pendingCount} draft${pendingCount > 1 ? "s" : ""} awaiting approval</span>
        <a href="${appUrl}/approval-queue" style="float:right;background:#2563eb;color:#fff;padding:4px 12px;border-radius:6px;text-decoration:none;font-size:13px">Review</a>
      </div>`
          : ""
      }
      <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#666;margin:0 0 10px">Top Warm Paths</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">${warmPathRows}</table>
      <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#666;margin:0 0 10px">Urgent Signals</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">${signalRows}</table>
      ${
        tasks.length > 0
          ? `
      <h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#666;margin:0 0 10px">Overdue Tasks (${tasks.length})</h2>
      <ul style="margin:0 0 20px;padding-left:16px">${tasks.map((t) => `<li style="margin-bottom:4px;color:#333;font-size:14px">${t.title}</li>`).join("")}</ul>`
          : ""
      }
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Open Dashboard →</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e8e8ea;text-align:center">
      <p style="margin:0;font-size:12px;color:#999">${workspaceName} daily briefing. <a href="${appUrl}/settings" style="color:#2563eb">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}
