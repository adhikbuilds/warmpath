import { prisma } from "@/lib/db/client";

export async function getWarmPaths(workspaceId: string) {
  return prisma.warmPath.findMany({
    where: { workspaceId },
    include: { account: true, contact: true },
    orderBy: { warmthScore: "desc" },
  });
}
