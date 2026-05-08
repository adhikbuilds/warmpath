import { prisma } from "@/lib/db/client";

export async function getWorkspace(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: { include: { user: true } },
      subscriptions: true,
    },
  });
}

export async function updateWorkspace(
  workspaceId: string,
  data: Partial<{
    name: string;
    domain: string;
    industry: string;
    companySize: string;
    website: string;
    description: string;
    plan: string;
    onboardingStage: string;
    healthScore: number;
  }>,
) {
  return prisma.workspace.update({ where: { id: workspaceId }, data });
}
