import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_INTEGRATIONS } from "@/lib/demo-data-omnichannel";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const integrations = await prisma.integrationConnection.findMany({
      where: { workspaceId },
    });
    if (integrations.length === 0) {
      return NextResponse.json(DEMO_INTEGRATIONS);
    }
    return NextResponse.json(
      integrations.map((i) => ({
        ...i,
        display_name: i.displayName,
        auth_type: i.authType,
        last_sync_at: i.lastSyncAt,
        sync_status: i.syncStatus,
        error_message: i.errorMessage,
        demo_mode: i.demoMode,
        health_score: i.healthScore,
        scopes: (() => {
          try {
            return JSON.parse(i.scopesJson ?? "[]");
          } catch {
            return [];
          }
        })(),
        capabilities: (() => {
          try {
            return JSON.parse(i.capabilitiesJson ?? "[]");
          } catch {
            return [];
          }
        })(),
        icon_color: i.iconColor,
        created_at: i.createdAt,
        updated_at: i.updatedAt,
      })),
    );
  } catch {
    return NextResponse.json(DEMO_INTEGRATIONS);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
