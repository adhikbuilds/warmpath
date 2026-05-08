import { prisma } from "@/lib/db/client";

export async function getPendingApprovals(workspaceId: string) {
  const messages = await prisma.message.findMany({
    where: { workspaceId, approvalStatus: "pending" },
    include: { contact: true, account: true, signal: true, warmPath: true, campaign: true },
    orderBy: { createdAt: "desc" },
  });
  const assets = await prisma.campaignAsset.findMany({
    where: { workspaceId, approvalStatus: { in: ["draft", "pending_approval"] } },
    include: { contact: true, account: true, campaign: true },
    orderBy: { createdAt: "desc" },
  });
  return { messages, assets };
}

export async function approveMessage(
  workspaceId: string,
  messageId: string,
  userId: string,
  editedBody?: string,
) {
  await prisma.message.updateMany({
    where: { id: messageId, workspaceId },
    data: {
      approvalStatus: "approved",
      status: "queued",
      ...(editedBody ? { body: editedBody } : {}),
    },
  });
  return prisma.approval.create({
    data: {
      workspaceId,
      messageId,
      userId,
      status: "approved",
      editedBody,
      decidedAt: new Date(),
    },
  });
}

export async function rejectMessage(
  workspaceId: string,
  messageId: string,
  userId: string,
  feedback?: string,
) {
  await prisma.message.updateMany({
    where: { id: messageId, workspaceId },
    data: { approvalStatus: "rejected", status: "draft" },
  });
  return prisma.approval.create({
    data: {
      workspaceId,
      messageId,
      userId,
      status: "rejected",
      feedback,
      decidedAt: new Date(),
    },
  });
}

export async function approveAsset(workspaceId: string, assetId: string, userId: string) {
  await prisma.campaignAsset.updateMany({
    where: { id: assetId, workspaceId },
    data: { approvalStatus: "approved" },
  });
  return prisma.approval.create({
    data: { workspaceId, assetId, userId, status: "approved", decidedAt: new Date() },
  });
}

export async function rejectAsset(
  workspaceId: string,
  assetId: string,
  userId: string,
  feedback?: string,
) {
  await prisma.campaignAsset.updateMany({
    where: { id: assetId, workspaceId },
    data: { approvalStatus: "rejected" },
  });
  return prisma.approval.create({
    data: { workspaceId, assetId, userId, status: "rejected", feedback, decidedAt: new Date() },
  });
}
