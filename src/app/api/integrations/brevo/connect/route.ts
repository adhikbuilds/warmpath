import { NextResponse } from "next/server";
import { encryptSecret } from "@/lib/crypto";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEFAULT_BREVO_SMTP_HOST, DEFAULT_BREVO_SMTP_PORT, verifySmtp } from "@/lib/email/brevo";

// Connect a workspace's own Brevo account via SMTP (bring-your-own-Brevo).
// The customer pastes their Brevo SMTP login + password (from Brevo → SMTP & API
// → SMTP) plus the verified sender they want to send from. We verify the
// credentials, encrypt the password, and store everything per-workspace.
export async function POST(req: Request) {
  try {
    const { workspaceId } = await getWorkspaceContext();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { smtp_host, smtp_port, smtp_user, smtp_password, sender_name, sender_email, reply_to } =
      body as {
        smtp_host?: string;
        smtp_port?: number | string;
        smtp_user?: string;
        smtp_password?: string;
        sender_name?: string;
        sender_email?: string;
        reply_to?: string;
      };

    if (!smtp_user?.trim() || !smtp_password?.trim()) {
      return NextResponse.json(
        { error: "smtp_user and smtp_password are required" },
        { status: 400 },
      );
    }
    if (!sender_email?.trim()) {
      return NextResponse.json({ error: "sender_email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sender_email.trim())) {
      return NextResponse.json(
        { error: "sender_email is not a valid email address" },
        { status: 400 },
      );
    }

    const host = smtp_host?.trim() || DEFAULT_BREVO_SMTP_HOST;
    const port = Number(smtp_port) || DEFAULT_BREVO_SMTP_PORT;

    // Verify the credentials before saving so the customer gets real feedback.
    const verification = await verifySmtp({
      smtpHost: host,
      smtpPort: port,
      smtpUser: smtp_user.trim(),
      smtpPassword: smtp_password,
      senderName: sender_name?.trim() || "WarmBlue",
      senderEmail: sender_email.trim(),
      replyTo: reply_to?.trim() || undefined,
    });

    if (!verification.ok) {
      return NextResponse.json(
        { error: `SMTP verification failed: ${verification.error}` },
        { status: 400 },
      );
    }

    const capabilities = JSON.stringify({
      smtpHost: host,
      smtpPort: port,
      smtpUser: smtp_user.trim(),
      smtpPasswordEnc: encryptSecret(smtp_password),
      senderName: sender_name?.trim() || "WarmBlue",
      senderEmail: sender_email.trim(),
      replyTo: reply_to?.trim() || undefined,
    });

    await prisma.integrationConnection.upsert({
      where: { workspaceId_provider: { workspaceId, provider: "brevo" } },
      create: {
        workspaceId,
        provider: "brevo",
        channel: "email",
        displayName: "Brevo",
        description: "Transactional email via the workspace's own Brevo SMTP account",
        status: "connected",
        authType: "smtp",
        capabilitiesJson: capabilities,
        healthScore: 100,
      },
      update: {
        status: "connected",
        authType: "smtp",
        capabilitiesJson: capabilities,
        healthScore: 100,
        errorMessage: null,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, sender_email: sender_email.trim(), verified: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
