import { prisma } from "@/lib/db/client";

export async function getRelationshipEdges(workspaceId: string) {
  return prisma.relationshipEdge.findMany({
    where: { workspaceId },
    orderBy: { lastInteractionAt: "desc" },
  });
}
