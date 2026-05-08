import { prisma } from "@/lib/db/client";

export async function getAccounts(workspaceId: string) {
  return prisma.bizAccount.findMany({
    where: { workspaceId },
    orderBy: { opportunityScore: "desc" },
  });
}

export async function getAccount(workspaceId: string, id: string) {
  return prisma.bizAccount.findFirst({
    where: { id, workspaceId },
    include: { contacts: true, signals: { take: 5, orderBy: { detectedAt: "desc" } } },
  });
}

export async function createAccount(
  workspaceId: string,
  data: {
    name: string;
    domain?: string;
    industry?: string;
    employeeCount?: number;
    location?: string;
    description?: string;
    stage?: string;
    fitScore?: number;
    intentScore?: number;
    warmthScore?: number;
    opportunityScore?: number;
  },
) {
  return prisma.bizAccount.create({ data: { workspaceId, ...data } });
}

export async function updateAccount(
  workspaceId: string,
  id: string,
  data: Partial<{
    name: string;
    stage: string;
    fitScore: number;
    intentScore: number;
    warmthScore: number;
    opportunityScore: number;
  }>,
) {
  return prisma.bizAccount.updateMany({ where: { id, workspaceId }, data });
}
