import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { buildRelationshipGraph } from "@/lib/graph/index";
import type { RelationshipEdge } from "@/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { contact_id } = body as { contact_id?: string };
  if (!contact_id) {
    return NextResponse.json({ error: "contact_id is required" }, { status: 400 });
  }

  const workspaceId = await getWorkspaceId();

  // Fetch contact
  const contact = await prisma.contact.findFirst({
    where: { id: contact_id, workspaceId },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  if (!contact.accountId) {
    return NextResponse.json({ error: "Contact has no account" }, { status: 404 });
  }

  // Fetch all relationship edges for the workspace
  const prismaEdges = await prisma.relationshipEdge.findMany({
    where: { workspaceId },
  });

  // Map Prisma snake_case → domain type
  const edges: RelationshipEdge[] = prismaEdges.map((e) => ({
    id: e.id,
    from_id: e.fromId,
    from_name: e.fromName,
    from_type: e.fromType as RelationshipEdge["from_type"],
    to_id: e.toId,
    to_name: e.toName,
    to_type: e.toType as RelationshipEdge["to_type"],
    relationship_type: e.relationshipType as RelationshipEdge["relationship_type"],
    strength_score: e.strengthScore,
    evidence: e.evidence ?? "",
    source: e.source ?? "",
    last_interaction_at: e.lastInteractionAt.toISOString(),
  }));

  const graph = buildRelationshipGraph(edges);
  const userId = session.user.id;
  const paths = graph.findPaths(userId, contact_id, 3, 1);

  const path = paths[0] ?? null;

  // Always create a WarmPath record (even if no path found)
  const warmPath = await prisma.warmPath.create({
    data: {
      workspaceId,
      contactId: contact_id,
      accountId: contact.accountId,
      pathJson: path ? JSON.stringify(path.nodes) : "[]",
      warmthScore: path ? path.warmth : 0,
      confidenceScore: path ? Math.round(path.warmth) : 0,
      explanation: path ? path.explanation : "No warm path found",
      recommendedIntroPerson: path?.nodes[1]?.name ?? "",
      recommendedChannel: "linkedin",
      status: "active",
    },
  });

  return NextResponse.json({
    id: warmPath.id,
    warmth_score: warmPath.warmthScore,
    path_nodes: (() => {
      try {
        return JSON.parse(warmPath.pathJson);
      } catch {
        return [];
      }
    })(),
    path_explanation: warmPath.explanation ?? "",
    account_id: warmPath.accountId,
    contact_id: warmPath.contactId,
  });
}
