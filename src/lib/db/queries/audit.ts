import { prisma } from "@/lib/db/client";

export async function getAuditLogs(workspaceId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
