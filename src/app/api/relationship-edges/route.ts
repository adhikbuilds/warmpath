import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_RELATIONSHIP_EDGES } from "@/lib/demo-data";

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext();
    const edges = await prisma.relationshipEdge.findMany({
      where: { workspaceId },
    });
    if (edges.length === 0) {
      return NextResponse.json(DEMO_RELATIONSHIP_EDGES);
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

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
