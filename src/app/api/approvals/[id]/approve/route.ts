import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, getAuthContext, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";
import { approveAsset, approveMessage } from "@/lib/db/queries/approvals";

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

    // Check whether an active email/SMTP integration exists
    const emailConn = await prisma.integrationConnection.findFirst({
      where: {
        workspaceId: ctx.workspaceId,
        provider: { in: ["brevo", "smtp", "email", "sendgrid", "mailgun"] },
        status: "active",
      },
    });

    if (!emailConn) {
      // No email channel connected — message is approved but cannot be sent yet
      return NextResponse.json({
        ok: true,
        approved: true,
        sent: false,
        reason: "no_email_channel",
        message:
          "Message approved but no email provider connected. Connect Brevo in Integrations to send.",
      });
    }

    // Email channel exists — return approved + sent:true (actual send handled by worker/webhook)
    return NextResponse.json({ ok: true, approved: true, sent: true });
  }

  return badRequest("Unsupported approval type");
}
