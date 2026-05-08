import { prisma } from "@/lib/db/client";

export async function getAIUsageLogs(workspaceId: string, limit = 100) {
  return prisma.aIUsageLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createAIUsageLog(data: {
  workspaceId: string;
  userId?: string;
  actionType: string;
  provider: string;
  mode: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  status?: string;
  cacheHit?: boolean;
  latencyMs?: number;
}) {
  return prisma.aIUsageLog.create({ data });
}
