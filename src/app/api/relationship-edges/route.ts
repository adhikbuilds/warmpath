import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_RELATIONSHIP_EDGES } from "@/lib/demo-data";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const edges = await prisma.relationshipEdge.findMany({
      where: { workspaceId },
    });
    if (edges.length === 0) {
      return NextResponse.json(isDemo ? DEMO_RELATIONSHIP_EDGES : []);
    }
    return NextResponse.json(
      edges.map((e) => ({
        ...e,
        from_type: e.fromType,
        from_id: e.fromId,
        from_name: e.fromName,
        to_type: e.toType,
        to_id: e.toId,
        to_name: e.toName,
        relationship_type: e.relationshipType,
        strength_score: e.strengthScore,
        last_interaction_at: e.lastInteractionAt,
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
      from_type,
      from_id,
      from_name,
      to_type,
      to_id,
      to_name,
      relationship_type,
      strength_score,
      evidence,
      source,
      last_interaction_at,
    } = body;

    if (!from_id?.trim() || !to_id?.trim()) {
      return NextResponse.json({ error: "from_id and to_id are required" }, { status: 400 });
    }
    if (!relationship_type?.trim()) {
      return NextResponse.json({ error: "relationship_type is required" }, { status: 400 });
    }

    const edge = await prisma.relationshipEdge.create({
      data: {
        workspaceId,
        fromType: from_type ?? "contact",
        fromId: from_id.trim(),
        fromName: from_name?.trim() ?? from_id.trim(),
        toType: to_type ?? "contact",
        toId: to_id.trim(),
        toName: to_name?.trim() ?? to_id.trim(),
        relationshipType: relationship_type.trim(),
        strengthScore:
          typeof strength_score === "number" ? Math.max(0, Math.min(100, strength_score)) : 50,
        evidence: evidence?.trim() ?? null,
        source: source?.trim() ?? null,
        lastInteractionAt: last_interaction_at ? new Date(last_interaction_at) : new Date(),
      },
    });

    return NextResponse.json(
      {
        ...edge,
        from_type: edge.fromType,
        from_id: edge.fromId,
        from_name: edge.fromName,
        to_type: edge.toType,
        to_id: edge.toId,
        to_name: edge.toName,
        relationship_type: edge.relationshipType,
        strength_score: edge.strengthScore,
        last_interaction_at: edge.lastInteractionAt,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
