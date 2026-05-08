import { prisma } from "@/lib/db/client";

export async function getKBItems(workspaceId: string) {
  return prisma.knowledgeBaseItem.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createKBItem(
  workspaceId: string,
  data: {
    title: string;
    type: string;
    content: string;
    source?: string;
    tagsJson?: string;
    confidenceScore?: number;
    approvedForAi?: boolean;
  },
) {
  return prisma.knowledgeBaseItem.create({ data: { workspaceId, ...data } });
}

export async function updateKBItem(
  workspaceId: string,
  id: string,
  data: Partial<{
    title: string;
    content: string;
    approvedForAi: boolean;
    confidenceScore: number;
    tagsJson: string;
  }>,
) {
  return prisma.knowledgeBaseItem.updateMany({ where: { id, workspaceId }, data });
}

export async function deleteKBItem(workspaceId: string, id: string) {
  return prisma.knowledgeBaseItem.deleteMany({ where: { id, workspaceId } });
}
