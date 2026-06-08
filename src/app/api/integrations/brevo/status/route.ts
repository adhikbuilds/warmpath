import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { parseSmtpConfig } from "@/lib/email/brevo";

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await prisma.integrationConnection.findUnique({
      where: { workspaceId_provider: { workspaceId, provider: "brevo" } },
    });

    // Bring-your-own-Brevo: readiness depends entirely on the workspace having
    // connected its own SMTP credentials + sender — no global env key required.
    const smtp = conn ? parseSmtpConfig(conn.capabilitiesJson ?? null) : null;

    return NextResponse.json({
      workspace_connected: conn?.status === "connected" && !!smtp,
      sender_email: smtp?.senderEmail ?? null,
      sender_name: smtp?.senderName ?? null,
      smtp_host: smtp?.smtpHost ?? null,
      smtp_user: smtp?.smtpUser ?? null,
      status: conn?.status ?? "disconnected",
      last_sync_at: conn?.lastSyncAt?.toISOString() ?? null,
      ready: conn?.status === "connected" && !!smtp,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
