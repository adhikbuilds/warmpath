import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(await buildWorkspaceAnalytics(workspaceId));
  } catch {
    return NextResponse.json(emptyAnalytics());
  }
}

async function buildWorkspaceAnalytics(workspaceId: string) {
  const [signals, messages, accounts, warmPaths, members] = await Promise.all([
    prisma.signal.findMany({
      where: { workspaceId },
      include: { account: { select: { name: true } } },
      orderBy: { urgencyScore: "desc" },
    }),
    prisma.message.findMany({
      where: { workspaceId },
      select: { channel: true, status: true, approvalStatus: true },
    }),
    prisma.bizAccount.findMany({ where: { workspaceId }, select: { id: true } }),
    prisma.warmPath.findMany({ where: { workspaceId }, select: { accountId: true } }),
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const signalTypeCounts: Record<string, { count: number; urgencySum: number; display: string }> =
    {};
  for (const s of signals) {
    if (!signalTypeCounts[s.type]) {
      signalTypeCounts[s.type] = {
        count: 0,
        urgencySum: 0,
        display: s.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      };
    }
    signalTypeCounts[s.type].count++;
    signalTypeCounts[s.type].urgencySum += s.urgencyScore;
  }
  const signal_attribution = Object.entries(signalTypeCounts)
    .map(([type, { count, urgencySum, display }]) => ({
      signal_type: type,
      display_name: display,
      count,
      urgency_avg: Math.round(urgencySum / count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const messages_funnel = {
    total: messages.length,
    pending: messages.filter((m) => m.approvalStatus === "pending").length,
    approved: messages.filter((m) => m.approvalStatus === "approved").length,
    sent: messages.filter((m) => m.status === "sent").length,
    rejected: messages.filter((m) => m.approvalStatus === "rejected").length,
  };

  const channelCounts: Record<string, { count: number; approvedCount: number }> = {};
  for (const m of messages) {
    if (!channelCounts[m.channel]) channelCounts[m.channel] = { count: 0, approvedCount: 0 };
    channelCounts[m.channel].count++;
    if (m.approvalStatus === "approved") channelCounts[m.channel].approvedCount++;
  }
  const channel_breakdown = Object.entries(channelCounts).map(
    ([channel, { count, approvedCount }]) => ({ channel, count, approved_count: approvedCount }),
  );

  const accountsWithPaths = new Set(warmPaths.map((wp) => wp.accountId)).size;
  const warm_path_coverage = {
    accounts_with_paths: accountsWithPaths,
    total_accounts: accounts.length,
    coverage_pct: accounts.length > 0 ? Math.round((accountsWithPaths / accounts.length) * 100) : 0,
  };

  const team_stats = members.slice(0, 6).map((m) => ({
    user_id: m.userId,
    name: m.user.name ?? m.user.email?.split("@")[0] ?? "Team Member",
    role: m.role,
    relationship_score: m.relationshipScore,
    joined_at: m.joinedAt.toISOString(),
  }));

  const top_signals = signals.slice(0, 5).map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    account_name: s.account?.name ?? null,
    urgency_score: s.urgencyScore,
    detected_at: s.detectedAt.toISOString(),
  }));

  return {
    signal_attribution,
    messages_funnel,
    channel_breakdown,
    warm_path_coverage,
    team_stats,
    top_signals,
  };
}

function emptyAnalytics() {
  return {
    signal_attribution: [],
    messages_funnel: { total: 0, pending: 0, approved: 0, sent: 0, rejected: 0 },
    channel_breakdown: [],
    warm_path_coverage: { accounts_with_paths: 0, total_accounts: 0, coverage_pct: 0 },
    team_stats: [],
    top_signals: [],
  };
}
