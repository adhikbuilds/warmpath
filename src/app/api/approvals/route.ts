import { NextResponse } from "next/server";
import { getAuthContext, unauthorized } from "@/lib/db/auth-helpers";
import { getPendingApprovals } from "@/lib/db/queries/approvals";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();

  const data = await getPendingApprovals(ctx.workspaceId);
  return NextResponse.json(data);
}

export async function POST() {
  return NextResponse.json({ error: "Method not implemented" }, { status: 405 });
}
