import { prisma } from "@/lib/db/client";

export async function getIntegrations(workspaceId: string) {
  return prisma.integrationConnection.findMany({
    where: { workspaceId },
    orderBy: { channel: "asc" },
  });
}

export async function upsertIntegration(
  workspaceId: string,
  provider: string,
  data: Partial<{
    channel: string;
    displayName: string;
    description: string;
    status: string;
    demoMode: boolean;
    healthScore: number;
    capabilitiesJson: string;
    iconColor: string;
  }>,
) {
  return prisma.integrationConnection.upsert({
    where: { workspaceId_provider: { workspaceId, provider } },
    create: { workspaceId, provider, channel: data.channel ?? "other", ...data },
    update: { ...data, updatedAt: new Date() },
  });
}
