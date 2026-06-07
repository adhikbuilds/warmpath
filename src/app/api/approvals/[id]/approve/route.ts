import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, getAuthContext, unauthorized } from "@/lib/db/auth-helpers";
import prisma from "@/lib/db/client";
import { approveAsset, approveMessage } from "@/lib/db/queries/approvals";
import { isBrevoConfigured, parseSenderIdentity, sendEmail } from "@/lib/email/brevo";
import { logger } from "@/lib/logger";

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
    await approveMessage(ctx.workspaceId, id, ctx.userId, body.editedBody);

    // Attempt to send via Brevo after approval.
    // Non-fatal: approval persists even if send fails.
    const sent = await trySendApprovedMessage(ctx.workspaceId, id, body.editedBody);

    return NextResponse.json({ ok: true, sent });
  }

  return badRequest("Unsupported approval type");
}

async function trySendApprovedMessage(
  workspaceId: string,
  messageId: string,
  editedBody?: string,
): Promise<boolean> {
  if (!isBrevoConfigured()) {
    logger.warn("Brevo not configured — message approved but not sent", { messageId });
    return false;
  }

  try {
    const [message, brevoConn] = await Promise.all([
      prisma.message.findFirst({
        where: { id: messageId, workspaceId },
        include: { contact: true },
      }),
      prisma.integrationConnection.findUnique({
        where: { workspaceId_provider: { workspaceId, provider: "brevo" } },
      }),
    ]);

    if (!message) {
      logger.warn("Message not found for Brevo send", { messageId, workspaceId });
      return false;
    }

    const senderIdentity = brevoConn
      ? parseSenderIdentity(brevoConn.capabilitiesJson ?? null)
      : null;
    if (!senderIdentity) {
      logger.warn("No Brevo sender identity configured for workspace", { workspaceId, messageId });
      return false;
    }

    const toEmail = message.contact?.email;
    const toName = message.contact?.name ?? "there";

    if (!toEmail) {
      logger.warn("Contact has no email — cannot send via Brevo", {
        messageId,
        contactId: message.contactId,
      });
      return false;
    }

    const bodyText = editedBody ?? message.body;
    const htmlContent = bodyText
      .split("\n")
      .map((line) => `<p>${line || "&nbsp;"}</p>`)
      .join("");

    const result = await sendEmail({
      senderName: senderIdentity.senderName,
      senderEmail: senderIdentity.senderEmail,
      replyTo: senderIdentity.replyTo,
      toName,
      toEmail,
      subject: message.subject ?? "A message from WarmPath",
      htmlContent,
      textContent: bodyText,
    });

    if (result.ok) {
      await prisma.message.update({
        where: { id: messageId },
        data: { status: "sent", sentAt: new Date() },
      });
      logger.info("Message sent via Brevo", {
        messageId,
        toEmail,
        brevoMessageId: result.messageId,
      });
      return true;
    } else {
      logger.error("Brevo send failed", { messageId, error: result.error });
      return false;
    }
  } catch (err) {
    logger.error("Brevo send threw", { messageId, error: err });
    return false;
  }
}
