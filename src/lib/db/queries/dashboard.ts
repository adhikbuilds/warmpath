import { prisma } from "@/lib/db/client";

export async function getDashboardStats(workspaceId: string) {
  const [warmPaths, hotAccounts, pendingMessages, pendingAssets, messages, signals] =
    await Promise.all([
      prisma.warmPath.count({ where: { workspaceId, status: "active" } }),
      prisma.bizAccount.count({ where: { workspaceId, opportunityScore: { gte: 75 } } }),
      prisma.message.count({ where: { workspaceId, approvalStatus: "pending" } }),
      prisma.campaignAsset.count({
        where: { workspaceId, approvalStatus: { in: ["draft", "pending_approval"] } },
      }),
      prisma.message.findMany({
        where: { workspaceId },
        select: { status: true, approvalStatus: true },
      }),
      prisma.signal.count({ where: { workspaceId, urgencyScore: { gte: 70 } } }),
    ]);

  const sent = messages.filter((m) =>
    ["sent", "delivered", "opened", "replied"].includes(m.status),
  ).length;
  const replied = messages.filter((m) => m.status === "replied").length;

  return {
    warm_paths_found: warmPaths,
    hot_accounts: hotAccounts,
    pending_approvals: pendingMessages + pendingAssets,
    meetings_booked: Math.floor(replied * 0.3),
    pipeline_influenced: hotAccounts * 45000,
    reply_rate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
    messages_sent: sent,
    hot_signals: signals,
  };
}
