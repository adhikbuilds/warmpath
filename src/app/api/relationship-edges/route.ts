import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    // Cap at 500 for initial load performance — force-graph renders poorly above this.
    const edges = await prisma.relationshipEdge.findMany({
      where: { workspaceId },
      orderBy: { strengthScore: "desc" },
      take: 500,
    });
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
