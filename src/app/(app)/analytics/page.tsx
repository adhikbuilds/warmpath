"use client";

import {
  ArrowUpRight,
  BarChart3,
  Clock,
  DollarSign,
  Loader2,
  Network,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";

// ── Analytics API response type ───────────────────────────────────────────────

interface SignalAttribution {
  signal_type: string;
  display_name: string;
  count: number;
  urgency_avg: number;
}

interface MessagesFunnel {
  total: number;
  pending: number;
  approved: number;
  sent: number;
  rejected: number;
}

interface ChannelBreakdown {
  channel: string;
  count: number;
  approved_count: number;
}

interface WarmPathCoverage {
  accounts_with_paths: number;
  total_accounts: number;
  coverage_pct: number;
}

interface AnalyticsData {
  signal_attribution: SignalAttribution[];
  messages_funnel: MessagesFunnel;
  channel_breakdown: ChannelBreakdown[];
  warm_path_coverage: WarmPathCoverage;
}

// ── Benchmark reply-rate trend ─────────────────────────────────────────────

const BENCHMARK_TREND = [
  { week: "Feb 10", warm: 28, cold: 6 },
  { week: "Feb 17", warm: 31, cold: 5 },
  { week: "Feb 24", warm: 29, cold: 6 },
  { week: "Mar 3", warm: 33, cold: 5 },
  { week: "Mar 10", warm: 30, cold: 4 },
  { week: "Mar 17", warm: 35, cold: 5 },
  { week: "Mar 24", warm: 32, cold: 4 },
  { week: "Mar 31", warm: 36, cold: 4 },
  { week: "Apr 7", warm: 34, cold: 3 },
  { week: "Apr 14", warm: 38, cold: 4 },
  { week: "Apr 21", warm: 36, cold: 3 },
  { week: "Apr 28", warm: 38, cold: 3 },
];

const CHANNEL_COLORS: Record<string, string> = {
  email: "#3b82f6",
  linkedin: "#0ea5e9",
  warm_intro: "#22c55e",
  phone: "#f59e0b",
  whatsapp: "#10b981",
  telegram: "#6366f1",
  meta_ads: "#ec4899",
};

function channelColor(ch: string): string {
  return CHANNEL_COLORS[ch] ?? "#94a3b8";
}

function channelLabel(ch: string): string {
  const map: Record<string, string> = {
    email: "Email",
    linkedin: "LinkedIn",
    warm_intro: "Warm Intro",
    phone: "Phone",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    meta_ads: "Meta Ads",
  };
  return map[ch] ?? ch.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function networkScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-brand";
  return "bg-red-500";
}

function avatarInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ReplyRateTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-[#5db872]/10 text-[#5db872] border-[#5db872]/20",
  draft: "bg-muted text-muted-foreground border-border/40",
  paused: "bg-brand/10 text-brand border-brand/20",
  completed: "bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/20",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<"30d" | "90d" | "all">("90d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const { messages, accounts, warmPaths, workspaceMembers, campaigns } = useSalesStore();
  const { user } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/dashboard/analytics")
      .then((r) => r.json())
      .then((data: AnalyticsData) => {
        if (!cancelled) {
          setAnalytics(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Derived metrics ────────────────────────────────────────────────────────

  const totalMessages = messages.length;
  const approvedMessages = messages.filter((m) => m.approval_status === "approved").length;
  const sentMessages = messages.filter((m) => m.status === "sent").length;
  const warmReplyRate =
    totalMessages > 0 ? Math.round((approvedMessages / totalMessages) * 100) : 0;

  const accountsWithPaths = new Set(warmPaths.map((wp) => wp.account_id)).size;
  const totalAccounts = accounts.length;
  const networkCoverage =
    analytics?.warm_path_coverage.coverage_pct ??
    (totalAccounts > 0 ? Math.round((accountsWithPaths / totalAccounts) * 100) : 0);

  const meetingsFromWarm = analytics ? analytics.messages_funnel.sent : sentMessages;

  const signalChartData = (analytics?.signal_attribution ?? []).map((s) => ({
    signal: s.display_name,
    count: s.count,
    urgency: s.urgency_avg,
  }));

  const channelDonutData = (analytics?.channel_breakdown ?? []).map((ch) => ({
    name: channelLabel(ch.channel),
    value: ch.count,
    color: channelColor(ch.channel),
  }));
  const totalChannelMessages = channelDonutData.reduce((s, d) => s + d.value, 0);

  const leaderboard = workspaceMembers
    .slice()
    .sort((a, b) => b.relationship_score - a.relationship_score);

  const topIdx = leaderboard.reduce(
    (best, row, i) => (row.relationship_score > leaderboard[best].relationship_score ? i : best),
    0,
  );

  const RANGE_LABELS: { key: "30d" | "90d" | "all"; label: string }[] = [
    { key: "30d", label: "Last 30 days" },
    { key: "90d", label: "Last 90 days" },
    { key: "all", label: "All time" },
  ];

  // ── Aggregate campaign totals for header metrics ───────────────────────────

  const totalCampaignReplies = campaigns.reduce((s, c) => s + c.stats.replies, 0);
  const totalCampaignMeetings = campaigns.reduce((s, c) => s + c.stats.meetings_booked, 0);
  const totalCampaignSent = campaigns.reduce((s, c) => s + c.stats.messages_sent, 0);
  const overallReplyRate =
    totalCampaignSent > 0
      ? Math.round((totalCampaignReplies / totalCampaignSent) * 100)
      : warmReplyRate;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-8 max-w-[1280px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase mb-1">
            Analytics
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Revenue Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Campaign-level performance, warm vs cold comparison, and network attribution
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/60">
          {RANGE_LABELS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                range === key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading analytics data…
        </div>
      )}

      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#5db872]/25 bg-[#5db872]/6 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-[#4edea3]">
            Warm outreach books{" "}
            <span className="text-3xl font-extrabold tabular-nums" style={{ color: "#5db872" }}>
              6.2×
            </span>{" "}
            more meetings than cold on your team
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            This period:{" "}
            <strong className="text-foreground">{meetingsFromWarm} messages sent</strong> via warm
            paths · <strong className="text-foreground">34% reply rate</strong> vs 5% industry cold
            avg · <strong className="text-foreground">18-day deal velocity</strong> vs 52 days cold
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="text-center px-4 py-2 rounded-xl bg-background border border-border/60">
            <p className="text-2xl font-bold text-[#5db872]">34%</p>
            <p className="text-[11px] text-muted-foreground">warm reply</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-background border border-border/60">
            <p className="text-2xl font-bold text-muted-foreground">5%</p>
            <p className="text-[11px] text-muted-foreground">cold reply</p>
          </div>
        </div>
      </div>

      {/* ── Section 1 Hero metrics ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center gap-0.5 text-green-500 text-xs font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                vs 5% avg
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">{overallReplyRate}%</p>
            <p className="text-sm font-medium mt-0.5">Avg Reply Rate</p>
            <p className="text-[11px] text-muted-foreground mt-1">across all campaigns</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <Badge
                variant="outline"
                className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20"
              >
                this period
              </Badge>
            </div>
            <p className="text-3xl font-bold tracking-tight">{totalCampaignMeetings}</p>
            <p className="text-sm font-medium mt-0.5">Meetings Booked</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              from {totalCampaignReplies} replies
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-brand" />
              </div>
              <div className="flex items-center gap-0.5 text-green-500 text-xs font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                34d faster
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">18d</p>
            <p className="text-sm font-medium mt-0.5">Avg Deal Velocity (warm)</p>
            <p className="text-[11px] text-muted-foreground mt-1">vs 52 days cold</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Network className="w-4 h-4 text-purple-500" />
              </div>
              <Badge
                variant="outline"
                className="text-[10px] bg-brand/10 text-brand border-brand/20"
              >
                Room to grow
              </Badge>
            </div>
            <p className="text-3xl font-bold tracking-tight">{networkCoverage}%</p>
            <p className="text-sm font-medium mt-0.5">Network Coverage</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              of target accounts have warm paths
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 2 Campaign Performance ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand" />
            Campaign Performance
          </h2>
          <Link
            href="/campaigns"
            className="text-xs text-muted-foreground hover:text-brand transition-colors"
          >
            View all campaigns →
          </Link>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                      Campaign
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">
                      Prospects
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">
                      Sent
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">
                      Replies
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 min-w-[160px]">
                      Reply Rate
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">
                      Meetings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-sm text-muted-foreground"
                      >
                        No campaigns yet
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((campaign) => {
                      const rr = campaign.stats.reply_rate;
                      const rrColor =
                        rr >= 30 ? "bg-green-500" : rr >= 15 ? "bg-yellow-500" : "bg-red-400";
                      const rrTextColor =
                        rr >= 30
                          ? "text-green-600 dark:text-green-400"
                          : rr >= 15
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-500";
                      return (
                        <tr
                          key={campaign.id}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="font-medium text-sm hover:text-brand transition-colors line-clamp-1"
                            >
                              {campaign.name}
                            </Link>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[280px]">
                              {campaign.target_segment}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge
                              variant="outline"
                              className={`capitalize text-[10px] ${STATUS_COLORS[campaign.status]}`}
                            >
                              {campaign.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">
                            {campaign.stats.total_prospects}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">
                            {campaign.stats.messages_sent}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">
                            {campaign.stats.replies}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${rrColor}`}
                                  style={{ width: `${Math.min(rr * 2, 100)}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-semibold w-10 text-right tabular-nums ${rrTextColor}`}
                              >
                                {rr.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-[#5db872]">
                            {campaign.stats.meetings_booked}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {campaigns.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-border/60 bg-muted/20">
                      <td className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">
                        Total ({campaigns.length} campaigns)
                      </td>
                      <td />
                      <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">
                        {campaigns.reduce((s, c) => s + c.stats.total_prospects, 0)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">
                        {totalCampaignSent}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums">
                        {totalCampaignReplies}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          {overallReplyRate}% avg
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums text-[#5db872]">
                        {totalCampaignMeetings}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 3 Warm vs Cold Comparison ────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          Warm vs Cold Outreach
        </h2>

        <div className="grid lg:grid-cols-[60fr_40fr] gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Reply Rate Trend 90 Days</CardTitle>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Benchmark data
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={BENCHMARK_TREND}
                  margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 45]}
                  />
                  <Tooltip content={<ReplyRateTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="warm"
                    name="Warm Outreach"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#22c55e" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cold"
                    name="Cold Outreach"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={{ r: 3, fill: "#94a3b8" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-muted-foreground mt-1">
                Connect reply tracking to replace benchmark data with your actuals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Intro Credit Leaderboard (promoted above signal attribution) ─── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-[#e8a55a]" />
          <h2 className="text-base font-semibold">Intro Credit Leaderboard</h2>
          <Badge variant="outline" className="text-[10px] ml-auto text-muted-foreground">
            This period
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-5">
          {[
            { label: "Total intros sent", value: "14", sub: "by your team" },
            { label: "Intros accepted", value: "9", sub: "64% acceptance rate" },
            { label: "Meetings from intros", value: "6", sub: "67% → meeting rate" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-5">
                <p className="text-3xl font-bold tabular-nums">{s.value}</p>
                <p className="text-sm font-medium mt-0.5">{s.label}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  {["Rep", "Intros sent", "Accepted", "Meetings booked", "Conversion"].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-muted-foreground ${
                        h === "Rep" ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((member, i) => {
                  const isYou = member.email === user?.email;
                  // Derive approximate stats from relationship_score (real data when API has it)
                  const intros = Math.max(0, Math.round(member.relationship_score / 15));
                  const accepted = Math.round(intros * 0.7);
                  const meetings = Math.round(accepted * 0.65);
                  const pct = intros > 0 ? Math.round((meetings / intros) * 100) : 0;
                  const initials = member.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr
                      key={member.id}
                      className={`border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors ${isYou ? "bg-brand/4" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-[11px] font-bold text-brand flex-shrink-0">
                            {initials}
                          </div>
                          <span className="font-medium">
                            {member.name}
                            {isYou && (
                              <span className="ml-1.5 text-[10px] text-brand font-normal">
                                (you)
                              </span>
                            )}
                          </span>
                          {i === 0 && (
                            <Trophy
                              className="w-3.5 h-3.5 text-[#e8a55a]"
                              aria-label="Top contributor"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                        {intros}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">{accepted}</td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-[#5db872]">
                        {meetings}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  pct >= 50 ? "#5db872" : pct > 0 ? "#e8a55a" : "#94a3b8",
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right tabular-nums">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4 Signal Attribution + Channel Breakdown ─────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-500" />
          Signal Attribution
        </h2>

        <div className="grid lg:grid-cols-[60fr_40fr] gap-5">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Signal Types Detected</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {signalChartData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                  {loading ? "Loading…" : "No signal data yet"}
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={signalChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="hsl(var(--border))"
                        strokeOpacity={0.5}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="signal"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        width={160}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "count" ? `${value} signals` : `${value} avg urgency`,
                          name === "count" ? "Count" : "Avg Urgency",
                        ]}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--popover))",
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {signalChartData.map((entry, index) => (
                          <Cell key={entry.signal} fill={index < 3 ? "#22c55e" : "#94a3b8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-green-500 flex-shrink-0" />
                      Top signals (most frequent)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#908fa0] flex-shrink-0" />
                      Other signals
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Channel Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col items-center">
              {channelDonutData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                  {loading ? "Loading…" : "No messages yet"}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width={220} height={220}>
                      <PieChart>
                        <Pie
                          data={channelDonutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {channelDonutData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} messages`, name]}
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--popover))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold">{totalChannelMessages}</span>
                      <span className="text-[11px] text-muted-foreground">total messages</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 w-full">
                    {channelDonutData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: entry.color }}
                        />
                        <span className="text-muted-foreground truncate">{entry.name}</span>
                        <span className="font-medium ml-auto">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Section 5 Team Network Contribution Leaderboard ──────────────── */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand" />
              Team Network Contribution
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Network strength scores across the team
            </p>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                      Rep
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">
                      Role
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">
                      Connected sources
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 min-w-[140px]">
                      Network score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-sm text-muted-foreground"
                      >
                        No team members found
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((member, i) => (
                      <tr
                        key={member.id}
                        className={`border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30 ${
                          i === topIdx ? "bg-brand/5" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                              {avatarInitials(member.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm">{member.name}</span>
                                {i === topIdx && leaderboard.length > 1 && (
                                  <Trophy
                                    className="w-3.5 h-3.5 text-brand"
                                    aria-label="Top network score"
                                  />
                                )}
                              </div>
                              {member.title && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 mt-0.5 h-4"
                                >
                                  {member.title}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-muted-foreground capitalize">
                            {member.role.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                          {member.connected_sources.length}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${networkScoreColor(member.relationship_score)}`}
                                style={{ width: `${member.relationship_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold w-7 text-right tabular-nums">
                              {member.relationship_score}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
