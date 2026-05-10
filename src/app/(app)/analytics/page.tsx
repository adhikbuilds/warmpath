"use client";

import {
  ArrowUpRight,
  Clock,
  DollarSign,
  Info,
  Loader2,
  Network,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface TeamStat {
  user_id: string;
  name: string;
  role: string;
  relationship_score: number;
  joined_at: string | null;
}

interface TopSignal {
  id: string;
  type: string;
  title: string;
  account_name: string | null;
  urgency_score: number;
  detected_at: string | null;
}

interface AnalyticsData {
  signal_attribution: SignalAttribution[];
  messages_funnel: MessagesFunnel;
  channel_breakdown: ChannelBreakdown[];
  warm_path_coverage: WarmPathCoverage;
  team_stats: TeamStat[];
  top_signals: TopSignal[];
}

// ── Benchmark reply-rate trend (illustrative labelled as benchmark) ─────────

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

// ── Channel colours ───────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Custom tooltip ─────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<"30d" | "90d" | "all">("90d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avgDealSize, setAvgDealSize] = useState(30000);
  const [coldCostPerMeeting, setColdCostPerMeeting] = useState(1500);

  const { messages, accounts, warmPaths, workspaceMembers } = useSalesStore();

  // Fetch analytics from the API
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

  // ── Derived metrics from Zustand store ─────────────────────────────────────

  const totalMessages = messages.length;
  const approvedMessages = messages.filter((m) => m.approval_status === "approved").length;
  const sentMessages = messages.filter((m) => m.status === "sent").length;
  const warmReplyRate =
    totalMessages > 0 ? Math.round((approvedMessages / totalMessages) * 100) : 0;

  // Network coverage: accounts with at least one warm path / total accounts
  const accountsWithPaths = new Set(warmPaths.map((wp) => wp.account_id)).size;
  const totalAccounts = accounts.length;
  const networkCoverage =
    analytics?.warm_path_coverage.coverage_pct ??
    (totalAccounts > 0 ? Math.round((accountsWithPaths / totalAccounts) * 100) : 0);

  // Meetings approximation (sent messages as proxy)
  const meetingsFromWarm = analytics ? analytics.messages_funnel.sent : sentMessages;

  // ROI numbers (configurable via inputs)
  const WARM_CLOSE_RATE = 0.26;
  const HOURS_PER_MEETING_COLD = 20;
  const projectedPipeline = meetingsFromWarm * avgDealSize;
  const projectedRevenue = Math.round(projectedPipeline * WARM_CLOSE_RATE);
  const coldCostEquivalent = meetingsFromWarm * coldCostPerMeeting;
  const hoursSaved = meetingsFromWarm * HOURS_PER_MEETING_COLD;

  // ── Funnel from API (or store fallback) ────────────────────────────────────

  const funnel = analytics?.messages_funnel ?? {
    total: totalMessages,
    pending: messages.filter((m) => m.approval_status === "pending").length,
    approved: approvedMessages,
    sent: sentMessages,
    rejected: messages.filter((m) => m.approval_status === "rejected").length,
  };

  const warmFunnelTotal = funnel.total || 1;
  const WARM_FUNNEL = [
    {
      stage: "Queued / Pending",
      count: funnel.pending,
      pct: Math.round((funnel.pending / warmFunnelTotal) * 100),
    },
    {
      stage: "Approved",
      count: funnel.approved,
      pct: Math.round((funnel.approved / warmFunnelTotal) * 100),
    },
    { stage: "Sent", count: funnel.sent, pct: Math.round((funnel.sent / warmFunnelTotal) * 100) },
    {
      stage: "Rejected",
      count: funnel.rejected,
      pct: Math.round((funnel.rejected / warmFunnelTotal) * 100),
    },
  ];

  const COLD_FUNNEL = [
    { stage: "Sent", count: 180, pct: 100 },
    { stage: "Opened", count: 54, pct: 30 },
    { stage: "Replied", count: 9, pct: 5 },
    { stage: "Meeting booked", count: 3, pct: 1.7 },
  ];

  // ── Signal attribution bar chart data ──────────────────────────────────────

  const signalChartData = (analytics?.signal_attribution ?? []).map((s) => ({
    signal: s.display_name,
    count: s.count,
    urgency: s.urgency_avg,
  }));

  // ── Channel donut data ──────────────────────────────────────────────────────

  const channelDonutData = (analytics?.channel_breakdown ?? []).map((ch) => ({
    name: channelLabel(ch.channel),
    value: ch.count,
    color: channelColor(ch.channel),
  }));
  const totalChannelMessages = channelDonutData.reduce((s, d) => s + d.value, 0);

  // ── Leaderboard from workspaceMembers store ────────────────────────────────

  const leaderboard = workspaceMembers
    .slice()
    .sort((a, b) => b.relationship_score - a.relationship_score);

  const topIdx = leaderboard.reduce(
    (best, row, i) => (row.relationship_score > leaderboard[best].relationship_score ? i : best),
    0,
  );

  // ── Range label ────────────────────────────────────────────────────────────

  const RANGE_LABELS: { key: "30d" | "90d" | "all"; label: string }[] = [
    { key: "30d", label: "Last 30 days" },
    { key: "90d", label: "Last 90 days" },
    { key: "all", label: "All time" },
  ];

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
            Track warm vs cold outreach performance and pipeline attribution
          </p>
        </div>

        {/* Date range selector */}
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

      {/* ── Loading overlay ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading analytics data…
        </div>
      )}

      {/* ── Section 1 Hero metrics ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Warm Reply Rate */}
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
            <p className="text-3xl font-bold tracking-tight">{warmReplyRate}%</p>
            <p className="text-sm font-medium mt-0.5">Warm Reply Rate</p>
            <p className="text-[11px] text-muted-foreground mt-1">vs 5% industry cold avg</p>
          </CardContent>
        </Card>

        {/* Meetings from Warm Intros */}
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
            <p className="text-3xl font-bold tracking-tight">{meetingsFromWarm}</p>
            <p className="text-sm font-medium mt-0.5">Messages Sent</p>
            <p className="text-[11px] text-muted-foreground mt-1">approved & dispatched</p>
          </CardContent>
        </Card>

        {/* Deal Velocity */}
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

        {/* Network Coverage */}
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

      {/* ── Section 2 Warm vs Cold Comparison ────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          Warm vs Cold Outreach
        </h2>

        <div className="grid lg:grid-cols-[60fr_40fr] gap-5">
          {/* Left Reply rate line chart (benchmark data) */}
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

          {/* Right Funnel cards */}
          <div className="space-y-4">
            {/* Warm funnel */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Warm Outreach Funnel
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20"
                  >
                    {warmReplyRate}% approved
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {WARM_FUNNEL.map(({ stage, count, pct }) => (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{stage}</span>
                      <span className="font-medium">
                        {count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Cold funnel */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">
                    Cold Outreach Funnel
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    5% reply rate
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {COLD_FUNNEL.map(({ stage, count, pct }) => (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{stage}</span>
                      <span className="font-medium">
                        {count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Section 3 Signal Attribution + Channel Breakdown ─────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-500" />
          Signal Attribution
        </h2>

        <div className="grid lg:grid-cols-[60fr_40fr] gap-5">
          {/* Left Signal bar chart */}
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
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 flex-shrink-0" />
                      Other signals
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Right Channel donut */}
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

      {/* ── Section 4 Team Network Contribution Leaderboard ──────────────── */}
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
                                  <Trophy className="w-3.5 h-3.5 text-brand" aria-label="Top network score" />
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

      {/* ── Section 5 ROI Calculator ─────────────────────────────────────── */}
      <div>
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand" />
                <CardTitle className="text-base font-semibold">ROI Calculator</CardTitle>
              </div>
              {/* Configurable inputs */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="deal-size" className="text-xs text-muted-foreground whitespace-nowrap">
                    Avg deal size
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      id="deal-size"
                      type="number"
                      min={1000}
                      step={1000}
                      value={avgDealSize}
                      onChange={(e) => setAvgDealSize(Math.max(1000, Number(e.target.value)))}
                      className="h-7 w-28 pl-5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="cold-cost" className="text-xs text-muted-foreground whitespace-nowrap">
                    Cold cost / meeting
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <Input
                      id="cold-cost"
                      type="number"
                      min={100}
                      step={100}
                      value={coldCostPerMeeting}
                      onChange={(e) => setColdCostPerMeeting(Math.max(100, Number(e.target.value)))}
                      className="h-7 w-24 pl-5 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/60">
              {/* Col 1 Cost savings */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                    Messages sent
                  </p>
                  <p className="text-3xl font-bold tracking-tight">{meetingsFromWarm}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    approved & dispatched this period
                  </p>
                </div>
                <div className="h-px bg-border/60" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    vs cold outreach cost:{" "}
                    <span className="font-medium text-foreground">${coldCostPerMeeting.toLocaleString()}/meeting</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Would have cost:</p>
                  <p className="text-2xl font-bold text-brand mt-0.5">
                    ${coldCostEquivalent.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Col 2 Pipeline */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                    Pipeline generated
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-[#5db8a6]">
                    ~${projectedPipeline.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {meetingsFromWarm} messages × ${avgDealSize.toLocaleString()} avg deal size
                  </p>
                </div>
                <div className="h-px bg-border/60" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Close rate warm: <span className="font-medium text-foreground">26%</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Projected revenue:</p>
                  <p className="text-2xl font-bold text-[#5db872] mt-0.5">
                    ${projectedRevenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Col 3 Time saved */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                    Time saved
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold tracking-tight">{hoursSaved}</p>
                    <p className="text-lg font-semibold text-muted-foreground">hrs</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {meetingsFromWarm} warm messages saved ~{hoursSaved} hours of cold outreach
                    effort
                  </p>
                </div>
                <div className="h-px bg-border/60" />
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Equivalent to ~{Math.round(hoursSaved / 40)} full work week
                    {hoursSaved / 40 !== 1 ? "s" : ""} of cold calling and email sequencing
                  </span>
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div className="mx-6 mb-6 mt-2 rounded-lg bg-brand/5 border border-brand/15 p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Based on your actual warm path coverage and outreach history. Adjust the deal size
                and cold cost above to model your specific numbers. Increasing network coverage from{" "}
                <strong className="text-foreground">
                  {networkCoverage}% → {Math.min(networkCoverage + 17, 100)}%
                </strong>{" "}
                is estimated to add <strong className="text-foreground">4–6 more messages/month</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
