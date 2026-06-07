import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { isBrevoConfigured, parseSenderIdentity } from "@/lib/email/brevo";

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeyConfigured = isBrevoConfigured();

    const conn = await prisma.integrationConnection.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: "brevo" } },
    });

    const senderIdentity = conn ? parseSenderIdentity(conn.capabilitiesJson ?? null) : null;

    return NextResponse.json({
      api_key_configured: apiKeyConfigured,
      workspace_connected: conn?.status === "connected",
      sender_email: senderIdentity?.senderEmail ?? null,
      sender_name: senderIdentity?.senderName ?? null,
      status: conn?.status ?? "disconnected",
      last_sync_at: conn?.lastSyncAt?.toISOString() ?? null,
      // Ready to send = both the WarmPath API key is configured AND workspace has set a sender
      ready: apiKeyConfigured && conn?.status === "connected" && !!senderIdentity,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
