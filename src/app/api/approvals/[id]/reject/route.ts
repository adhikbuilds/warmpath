import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { badRequest, getAuthContext, unauthorized } from "@/lib/db/auth-helpers";
import { rejectAsset, rejectMessage } from "@/lib/db/queries/approvals";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as {
    type?: "message" | "asset";
    feedback?: string;
  };

  if (body.type === "asset") {
    await rejectAsset(ctx.workspaceId, id, ctx.userId, body.feedback);
    return NextResponse.json({ ok: true });
  }

  if (!body.type || body.type === "message") {
    await rejectMessage(ctx.workspaceId, id, ctx.userId, body.feedback);
    return NextResponse.json({ ok: true });
  }

  return badRequest("Unsupported rejection type");
}
