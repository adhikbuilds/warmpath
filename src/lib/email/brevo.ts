// Brevo transactional email via REST API (no SDK).
// WarmPath operates a single Brevo account (BREVO_API_KEY).
// Per-workspace sender identity is stored in IntegrationConnection.capabilitiesJson.

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

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
