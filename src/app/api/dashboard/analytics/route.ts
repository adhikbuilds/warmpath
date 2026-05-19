import { NextResponse } from "next/server";
import { DEMO_ACCOUNTS, DEMO_MESSAGES, DEMO_SIGNALS, DEMO_WARM_PATHS } from "@/lib/demo-data";
import { DEMO_WORKSPACE_MEMBERS } from "@/lib/demo-data-extended";

export async function GET() {
  const messages = DEMO_MESSAGES;
  const signals = DEMO_SIGNALS;
  const accounts = DEMO_ACCOUNTS;
  const warmPaths = DEMO_WARM_PATHS;

  // Signal attribution: count by type
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
    signalTypeCounts[s.type].urgencySum += s.urgency_score;
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

  // Messages funnel
  const total = messages.length;
  const pending = messages.filter((m) => m.approval_status === "pending").length;
  const approved = messages.filter((m) => m.approval_status === "approved").length;
  const sent = messages.filter((m) => m.status === "sent").length;
  const rejected = messages.filter((m) => m.approval_status === "rejected").length;
  const messages_funnel = { total, pending, approved, sent, rejected };

  // Channel breakdown
  const channelCounts: Record<string, { count: number; approvedCount: number }> = {};
  for (const m of messages) {
    if (!channelCounts[m.channel]) channelCounts[m.channel] = { count: 0, approvedCount: 0 };
    channelCounts[m.channel].count++;
    if (m.approval_status === "approved") channelCounts[m.channel].approvedCount++;
  }
  const channel_breakdown = Object.entries(channelCounts).map(
    ([channel, { count, approvedCount }]) => ({
      channel,
      count,
      approved_count: approvedCount,
    }),
  );

  // Warm path coverage
  const accountsWithPaths = new Set(warmPaths.map((wp) => wp.account_id)).size;
  const warm_path_coverage = {
    accounts_with_paths: accountsWithPaths,
    total_accounts: accounts.length,
    coverage_pct: accounts.length > 0 ? Math.round((accountsWithPaths / accounts.length) * 100) : 0,
  };

  // Team stats from workspace members
  const team_stats = DEMO_WORKSPACE_MEMBERS.slice(0, 6).map((m) => ({
    user_id: m.id,
    name: m.name,
    role: m.role,
    relationship_score: m.relationship_score ?? 70,
    joined_at: m.joined_at ?? null,
  }));

  // Build account id → name map for signal enrichment
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

  // Top signals
  const top_signals = signals
    .slice()
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      account_name: accountMap[s.account_id] ?? null,
      urgency_score: s.urgency_score,
      detected_at: s.detected_at,
    }));

  return NextResponse.json({
    signal_attribution,
    messages_funnel,
    channel_breakdown,
    warm_path_coverage,
    team_stats,
    top_signals,
  });
}
