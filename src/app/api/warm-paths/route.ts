import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_WARM_PATHS } from "@/lib/demo-data";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const warmPaths = await prisma.warmPath.findMany({
      where: { workspaceId },
      include: { account: true, contact: true },
      orderBy: { createdAt: "desc" },
    });
    if (warmPaths.length === 0) {
      return NextResponse.json(isDemo ? DEMO_WARM_PATHS : []);
    }
    return NextResponse.json(
      warmPaths.map((wp) => ({
        id: wp.id,
        account_id: wp.accountId,
        contact_id: wp.contactId,
        path_nodes: (() => {
          try {
            return JSON.parse(wp.pathJson);
          } catch {
            return [];
          }
        })(),
        path_explanation: wp.explanation ?? "",
        warmth_score: wp.warmthScore,
        confidence_score: wp.confidenceScore,
        recommended_intro_person: wp.recommendedIntroPerson ?? "",
        recommended_channel: (wp.recommendedChannel as "email" | "linkedin" | "call") ?? "linkedin",
        status: wp.status as
          | "active"
          | "intro_sent"
          | "intro_accepted"
          | "message_sent"
          | "replied",
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const { workspaceId } = await getWorkspaceContext();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      account_id,
      contact_id,
      path_nodes,
      path_explanation,
      warmth_score,
      confidence_score,
      recommended_intro_person,
      recommended_channel,
      status = "active",
      // Decomposition scores for WarmthScoreLog
      path_strength,
      recency_score,
      icp_fit_score,
      signal_boost,
      score_breakdown,
    } = body;

    if (!path_nodes || !Array.isArray(path_nodes) || path_nodes.length === 0) {
      return NextResponse.json({ error: "path_nodes array is required" }, { status: 400 });
    }

    const finalWarmthScore =
      typeof warmth_score === "number" ? Math.max(0, Math.min(100, Math.round(warmth_score))) : 0;

    const warmPath = await prisma.warmPath.create({
      data: {
        workspaceId,
        accountId: account_id ?? null,
        contactId: contact_id ?? null,
        pathJson: JSON.stringify(path_nodes),
        explanation: path_explanation?.trim() ?? null,
        warmthScore: finalWarmthScore,
        confidenceScore:
          typeof confidence_score === "number"
            ? Math.max(0, Math.min(100, Math.round(confidence_score)))
            : 0,
        recommendedIntroPerson: recommended_intro_person?.trim() ?? null,
        recommendedChannel: recommended_channel ?? null,
        status,
      },
    });

    // Write WarmthScoreLog decomposition entry for observability.
    // These fields are the instrumentation model — we record what the BFS engine computed
    // without inventing calibrated weights.
    if (contact_id) {
      const pathStrengthVal =
        typeof path_strength === "number"
          ? Math.max(0, Math.min(40, Math.round(path_strength)))
          : 0;
      const recencyScoreVal =
        typeof recency_score === "number"
          ? Math.max(0, Math.min(25, Math.round(recency_score)))
          : 0;
      const icpFitScoreVal =
        typeof icp_fit_score === "number"
          ? Math.max(0, Math.min(20, Math.round(icp_fit_score)))
          : 0;
      const signalBoostVal =
        typeof signal_boost === "number" ? Math.max(0, Math.min(15, Math.round(signal_boost))) : 0;

      await prisma.warmthScoreLog
        .create({
          data: {
            workspaceId,
            contactId: contact_id,
            score: finalWarmthScore,
            pathStrength: pathStrengthVal,
            recencyScore: recencyScoreVal,
            icpFitScore: icpFitScoreVal,
            signalBoost: signalBoostVal,
            breakdown:
              score_breakdown?.trim() ??
              JSON.stringify({
                path_strength: pathStrengthVal,
                recency_score: recencyScoreVal,
                icp_fit_score: icpFitScoreVal,
                signal_boost: signalBoostVal,
                total: finalWarmthScore,
                source: "bfs_client",
                path_node_count: path_nodes.length,
              }),
          },
        })
        .catch(() => null); // non-fatal: instrumentation must not block warm path creation
    }

    return NextResponse.json(
      {
        id: warmPath.id,
        account_id: warmPath.accountId,
        contact_id: warmPath.contactId,
        path_nodes: JSON.parse(warmPath.pathJson),
        path_explanation: warmPath.explanation ?? "",
        warmth_score: warmPath.warmthScore,
        confidence_score: warmPath.confidenceScore,
        recommended_intro_person: warmPath.recommendedIntroPerson ?? "",
        recommended_channel: warmPath.recommendedChannel ?? "linkedin",
        status: warmPath.status,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
