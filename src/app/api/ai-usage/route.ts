import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const logs = await prisma.aIUsageLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = await getWorkspaceId();
    if (!workspaceId || workspaceId === "ws-1") {
      return NextResponse.json({ error: "Workspace not found" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { model, feature, inputTokens, outputTokens, cacheReadTokens, costUsd } = body;

    if (!model?.trim()) return NextResponse.json({ error: "model is required" }, { status: 400 });
    if (!feature?.trim())
      return NextResponse.json({ error: "feature is required" }, { status: 400 });
    if (typeof costUsd !== "number")
      return NextResponse.json({ error: "costUsd must be a number" }, { status: 400 });

    await prisma.aIUsageLog.create({
      data: {
        workspaceId,
        userId: session.user.id,
        actionType: feature.trim(),
        provider: "anthropic",
        mode: "remote",
        model: model.trim(),
        inputTokens: inputTokens ?? 0,
        outputTokens: outputTokens ?? 0,
        estimatedCost: costUsd,
        status: "success",
        cacheHit: (cacheReadTokens ?? 0) > 0,
        latencyMs: 0,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
