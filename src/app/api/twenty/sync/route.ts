import { NextResponse } from "next/server";

// Twenty sync is disabled until per-workspace CRM config is implemented.
// Each workspace will need its own IntegrationConnection record with provider="twenty"
// storing a workspace-specific apiUrl and apiKey before sync can be enabled.
export async function GET() {
  return NextResponse.json(
    { error: "Twenty sync requires per-workspace configuration — not yet implemented" },
    { status: 501 },
  );
}
