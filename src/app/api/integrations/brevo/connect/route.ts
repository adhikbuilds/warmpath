import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { isBrevoConfigured } from "@/lib/email/brevo";

export async function POST(req: Request) {
  try {
    const { workspaceId } = await getWorkspaceContext();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isBrevoConfigured()) {
      return NextResponse.json(
        { error: "Brevo is not configured on this WarmPath instance (missing BREVO_API_KEY)" },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { sender_name, sender_email, reply_to } = body as {
      sender_name?: string;
      sender_email?: string;
      reply_to?: string;
    };

    if (!sender_email?.trim()) {
      return NextResponse.json({ error: "sender_email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sender_email)) {
      return NextResponse.json(
        { error: "sender_email is not a valid email address" },
        { status: 400 },
      );
    }

    const capabilities = JSON.stringify({
      senderName: sender_name?.trim() ?? "WarmPath",
      senderEmail: sender_email.trim(),
      replyTo: reply_to?.trim() ?? undefined,
    });

    await prisma.integrationConnection.upsert({
      where: { workspaceId_provider: { workspaceId, provider: "brevo" } },
      create: {
        workspaceId,
        provider: "brevo",
        channel: "email",
        displayName: "Brevo",
        description: "Transactional email sending via Brevo SMTP API",
        status: "connected",
        authType: "api_key",
        capabilitiesJson: capabilities,
        healthScore: 100,
      },
      update: {
        status: "connected",
        capabilitiesJson: capabilities,
        healthScore: 100,
        errorMessage: null,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, sender_email: sender_email.trim() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
