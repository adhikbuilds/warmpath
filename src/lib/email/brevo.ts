// Brevo email sending. Two models are supported:
//  - REST (legacy): one shared Brevo account via BREVO_API_KEY env (sendEmail).
//  - SMTP (per-workspace / bring-your-own): each workspace stores its own Brevo
//    SMTP credentials in IntegrationConnection.capabilitiesJson, password
//    encrypted at rest (sendViaSmtp). This is the model real customers use.

import nodemailer from "nodemailer";
import { decryptSecret } from "@/lib/crypto";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

export const DEFAULT_BREVO_SMTP_HOST = "smtp-relay.brevo.com";
export const DEFAULT_BREVO_SMTP_PORT = 587;

export type BrevoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; status?: number };

export interface SendEmailOptions {
  senderName: string;
  senderEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
}

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

export async function sendEmail(opts: SendEmailOptions): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY not configured" };
  }

  const payload = {
    sender: { name: opts.senderName, email: opts.senderEmail },
    to: [{ name: opts.toName, email: opts.toEmail }],
    subject: opts.subject,
    htmlContent: opts.htmlContent,
    ...(opts.textContent ? { textContent: opts.textContent } : {}),
    ...(opts.replyTo ? { replyTo: { email: opts.replyTo } } : {}),
  };

  const res = await fetch(BREVO_API, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { message?: string }).message ?? JSON.stringify(body);
    return { ok: false, error: `Brevo error ${res.status}: ${detail}`, status: res.status };
  }

  const data = (await res.json()) as { messageId?: string };
  return { ok: true, messageId: data.messageId ?? "unknown" };
}

export interface WorkspaceSenderIdentity {
  senderName: string;
  senderEmail: string;
  replyTo?: string;
}

export function parseSenderIdentity(
  capabilitiesJson: string | null,
): WorkspaceSenderIdentity | null {
  if (!capabilitiesJson) return null;
  try {
    const caps = JSON.parse(capabilitiesJson) as Record<string, unknown>;
    if (caps.senderEmail && typeof caps.senderEmail === "string") {
      return {
        senderName: (caps.senderName as string) ?? "WarmPath",
        senderEmail: caps.senderEmail,
        replyTo: (caps.replyTo as string | undefined) ?? undefined,
      };
    }
  } catch {}
  return null;
}

// ── Per-workspace SMTP (bring-your-own Brevo) ─────────────────────────────────

export interface WorkspaceSmtpConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string; // decrypted
  senderName: string;
  senderEmail: string;
  replyTo?: string;
}

// Parse + decrypt a workspace's stored SMTP config. Returns null if the
// workspace hasn't connected its own Brevo SMTP credentials.
export function parseSmtpConfig(capabilitiesJson: string | null): WorkspaceSmtpConfig | null {
  if (!capabilitiesJson) return null;
  try {
    const caps = JSON.parse(capabilitiesJson) as Record<string, unknown>;
    const host = caps.smtpHost as string | undefined;
    const user = caps.smtpUser as string | undefined;
    const passEnc = caps.smtpPasswordEnc as string | undefined;
    const senderEmail = caps.senderEmail as string | undefined;
    if (!host || !user || !passEnc || !senderEmail) return null;
    return {
      smtpHost: host,
      smtpPort: Number(caps.smtpPort) || DEFAULT_BREVO_SMTP_PORT,
      smtpUser: user,
      smtpPassword: decryptSecret(passEnc),
      senderName: (caps.senderName as string) ?? "WarmPath",
      senderEmail,
      replyTo: (caps.replyTo as string | undefined) ?? undefined,
    };
  } catch {
    return null;
  }
}

function makeTransport(cfg: WorkspaceSmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpPort === 465, // 587 uses STARTTLS, not implicit TLS
    auth: { user: cfg.smtpUser, pass: cfg.smtpPassword },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
  });
}

// Verify SMTP credentials (auth + connectivity) without sending a message.
export async function verifySmtp(cfg: WorkspaceSmtpConfig): Promise<BrevoSendResult> {
  try {
    await makeTransport(cfg).verify();
    return { ok: true, messageId: "verified" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "SMTP verification failed" };
  }
}

export async function sendViaSmtp(
  cfg: WorkspaceSmtpConfig,
  msg: Pick<SendEmailOptions, "toName" | "toEmail" | "subject" | "htmlContent" | "textContent">,
): Promise<BrevoSendResult> {
  try {
    const info = await makeTransport(cfg).sendMail({
      from: { name: cfg.senderName, address: cfg.senderEmail },
      to: { name: msg.toName, address: msg.toEmail },
      ...(cfg.replyTo ? { replyTo: cfg.replyTo } : {}),
      subject: msg.subject,
      html: msg.htmlContent,
      ...(msg.textContent ? { text: msg.textContent } : {}),
    });
    return { ok: true, messageId: info.messageId ?? "unknown" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "SMTP send failed" };
  }
}
