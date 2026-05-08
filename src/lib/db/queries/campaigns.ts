import { prisma } from "@/lib/db/client";

export async function getCampaigns(workspaceId: string) {
  return prisma.campaign.findMany({
    where: { workspaceId },
    include: { steps: true, _count: { select: { assets: true, messages: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCampaign(workspaceId: string, id: string) {
  return prisma.campaign.findFirst({
    where: { id, workspaceId },
    include: {
      steps: { orderBy: { stepNumber: "asc" } },
      assets: { include: { contact: true, account: true } },
    },
  });
}

export async function createCampaign(
  workspaceId: string,
  ownerId: string,
  data: {
    name: string;
    goal?: string;
    type?: string;
    targetSegment?: string;
    channelsJson?: string;
  },
) {
  return prisma.campaign.create({ data: { workspaceId, ownerId, ...data } });
}

export async function updateCampaign(
  workspaceId: string,
  id: string,
  data: Partial<{
    name: string;
    status: string;
    goal: string;
    targetSegment: string;
  }>,
) {
  return prisma.campaign.updateMany({ where: { id, workspaceId }, data });
}
