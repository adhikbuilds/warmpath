import { prisma } from "@/lib/db/client";

export async function getSignals(workspaceId: string) {
  return prisma.signal.findMany({
    where: { workspaceId },
    include: { account: true, contact: true },
    orderBy: { urgencyScore: "desc" },
  });
}
