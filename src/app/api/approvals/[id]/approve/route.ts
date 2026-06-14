import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, getAuthContext, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";
import { approveAsset, approveMessage } from "@/lib/db/queries/approvals";
import { parseSmtpConfig, sendViaSmtp } from "@/lib/email/brevo";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as {
    type?: "message" | "asset";
    editedBody?: string;
  };

  if (body.type === "asset") {
    await approveAsset(ctx.workspaceId, id, ctx.userId);
    return NextResponse.json({ ok: true });
  }

  if (!body.type || body.type === "message") {
    // Approve the message first — user can pre-approve before channel is connected
    await approveMessage(ctx.workspaceId, id, ctx.userId, body.editedBody);

    // Check whether a connected email/SMTP integration exists
    const emailConn = await prisma.integrationConnection.findFirst({
      where: {
        workspaceId: ctx.workspaceId,
        provider: { in: ["brevo", "smtp", "email", "sendgrid", "mailgun"] },
        status: "connected",
      },
    });

    if (!emailConn) {
      return NextResponse.json({
        ok: true,
        approved: true,
        sent: false,
        reason: "no_email_channel",
        message:
          "Message approved but no email provider connected. Connect Brevo in Integrations to send.",
      });
    }

    // Fetch the approved message + recipient contact
    const message = await prisma.message.findFirst({
      where: { id, workspaceId: ctx.workspaceId },
      include: { contact: true },
    });

    const smtpConfig = parseSmtpConfig(emailConn.capabilitiesJson);
    const recipientEmail = message?.contact?.email;

    if (!smtpConfig || !recipientEmail || !message) {
      return NextResponse.json({
        ok: true,
        approved: true,
        sent: false,
        reason: "send_skipped",
        message: smtpConfig
          ? "Message approved but contact has no email address."
          : "Message approved but SMTP credentials are incomplete. Re-connect Brevo in Integrations.",
      });
    }

    const sendResult = await sendViaSmtp(smtpConfig, {
      toName: message.contact!.name,
      toEmail: recipientEmail,
      subject: message.subject ?? "A message from WarmPath",
      htmlContent: `<p>${message.body.replace(/\n/g, "<br>")}</p>`,
      textContent: message.body,
    });

    if (sendResult.ok) {
      await prisma.message.update({
        where: { id },
        data: { status: "sent", sentAt: new Date() },
      });
      return NextResponse.json({ ok: true, approved: true, sent: true });
    }

    return NextResponse.json({
      ok: true,
      approved: true,
      sent: false,
      reason: "send_failed",
      message: `Message approved but email send failed: ${sendResult.error}`,
    });
  }

  return badRequest("Unsupported approval type");
}
