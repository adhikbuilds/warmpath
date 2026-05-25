"use client";

import {
  AlertTriangle,
  Bell,
  Clock,
  Download,
  Filter,
  GitFork,
  Info,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Network,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { ComputedPath, GraphNode } from "@/lib/graph";
import { buildRelationshipGraph, computeEdgeWarmth } from "@/lib/graph";
import { useSalesStore } from "@/stores/salesStore";

/** Generate a synthetic 90-day weekly trend ending at `currentPct`. */
function buildCoverageTrend(currentPct: number): { week: string; pct: number }[] {
  const weeks = 13;
  const startPct = Math.max(5, currentPct - 15);
  const step = (currentPct - startPct) / (weeks - 1);
  const now = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (weeks - 1 - i) * 7);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const noise = i < weeks - 1 ? Math.round((Math.random() - 0.5) * 4) : 0;
    const pct = i === weeks - 1 ? currentPct : Math.round(startPct + step * i + noise);
    return { week: label, pct: Math.max(0, Math.min(100, pct)) };
  });
}

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const HEADER_H = 48;
const CANVAS_BG = "#06060e";

const REL_COLORS: Record<string, string> = {
  linkedin_connection: "#3b82f6",
  email_history: "#a78bfa",
  calendar_meeting: "#f59e0b",
  coworker_connection: "#34d399",
  intro_history: "#f87171",
  warm_path: "#f59e0b",
  crm_owner: "#64748b",
  works_at: "#475569",
};

const NODE_COLORS: Record<string, string> = {
  user: "#f59e0b",
  team: "#3b82f6",
  contact: "#a78bfa",
  account: "#34d399",
};

type TabId = "relationships" | "pipeline" | "activity";
type ViewMode = "graph" | "coverage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function warmthColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function initials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Deterministic pastel bg from name
function avatarBg(name: string): string {
  const palette = [
    "rgba(79,70,229,0.25)",
    "rgba(16,185,129,0.2)",
    "rgba(245,158,11,0.2)",
    "rgba(139,92,246,0.2)",
    "rgba(59,130,246,0.2)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(hash) % palette.length];
}

// ─── Coverage Map ─────────────────────────────────────────────────────────────

type GapType = "no_path" | "cold_path" | "stale_path" | "warm";

interface CoverageRow {
  accountId: string;
  accountName: string;
  industry: string;
  bestWarmth: number;
  path: string;
  introPerson: string;
  gapType: GapType;
  recommendation: string;
}

const GAP_CONFIG: Record<GapType, { label: string; color: string; dot: string }> = {
  warm: {
    label: "Warm path",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  stale_path: {
    label: "Stale path",
    color: "text-brand bg-brand/10 border-brand/20",
    dot: "bg-brand",
  },
  cold_path: {
    label: "Cold path",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-400",
  },
  no_path: {
    label: "No path",
    color: "text-muted-foreground bg-muted border-border",
    dot: "bg-muted-foreground",
  },
};

const GAP_ACTIONS: Record<GapType, (row: CoverageRow) => string> = {
  warm: () => "Ready to draft intro",
  stale_path: (r) => `Re-engage ${r.introPerson} to refresh the connection`,
  cold_path: (r) => `Ask ${r.introPerson} to strengthen the relationship first`,
  no_path: (r) => `Find a direct connection at ${r.accountName} on LinkedIn`,
};

function CoverageMap() {
  const { accounts, warmPaths, relationshipEdges } = useSalesStore();

  const rows = useMemo<CoverageRow[]>(() => {
    const now = Date.now();
    const STALE_DAYS = 90;

    return accounts.map((account) => {
      const paths = warmPaths.filter((wp) => wp.account_id === account.id);
      const bestPath = paths.sort((a, b) => b.warmth_score - a.warmth_score)[0];

      let gapType: GapType;
      let bestWarmth = 0;
      let pathLabel = "-";
      let introPerson = "-";

      if (!bestPath) {
        gapType = "no_path";
      } else {
        bestWarmth = bestPath.warmth_score;
        pathLabel = bestPath.path_nodes.map((n) => n.name.split(" ")[0]).join(" → ");
        introPerson = bestPath.recommended_intro_person;

        const relevantEdges = relationshipEdges.filter((e) =>
          bestPath.path_nodes.some((n) => n.id === e.from_id || n.id === e.to_id),
        );
        const mostRecentInteraction = relevantEdges.reduce((latest, e) => {
          const t = new Date(e.last_interaction_at).getTime();
          return t > latest ? t : latest;
        }, 0);

        const daysSince = (now - mostRecentInteraction) / (1000 * 60 * 60 * 24);

        if (bestWarmth >= 60 && daysSince <= STALE_DAYS) {
          gapType = "warm";
        } else if (daysSince > STALE_DAYS) {
          gapType = "stale_path";
        } else {
          gapType = "cold_path";
        }
      }

      const row: CoverageRow = {
        accountId: account.id,
        accountName: account.name,
        industry: account.industry,
        bestWarmth,
        path: pathLabel,
        introPerson,
        gapType,
        recommendation: "",
      };
      row.recommendation = GAP_ACTIONS[gapType](row);
      return row;
    });
  }, [accounts, warmPaths, relationshipEdges]);

  const warmCount = rows.filter((r) => r.gapType === "warm").length;
  const staleCount = rows.filter((r) => r.gapType === "stale_path").length;
  const coldCount = rows.filter((r) => r.gapType === "cold_path").length;
  const noPathCount = rows.filter((r) => r.gapType === "no_path").length;

  const strongCount = rows.filter((r) => r.bestWarmth > 70).length;
  const moderateCount = rows.filter((r) => r.bestWarmth >= 40 && r.bestWarmth <= 70).length;

  const coveredAccountIds = new Set(warmPaths.map((wp) => wp.account_id));
  const coveragePct =
    accounts.length > 0 ? Math.round((coveredAccountIds.size / accounts.length) * 100) : 0;

  const coverageTrend = useMemo(() => buildCoverageTrend(coveragePct), [coveragePct]);

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const order: GapType[] = ["no_path", "cold_path", "stale_path", "warm"];
        return order.indexOf(a.gapType) - order.indexOf(b.gapType);
      }),
    [rows],
  );

  function exportCSV() {
    const header = [
      "Account",
      "Industry",
      "Gap Type",
      "Best Warmth",
      "Intro Via",
      "Recommendation",
    ];
    const csvRows = sorted.map((r) =>
      [r.accountName, r.industry, r.gapType, r.bestWarmth, r.introPerson, r.recommendation]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...csvRows].join("\n");
    navigator.clipboard.writeText(csv).then(() => {
      toast.success("Coverage report copied to clipboard");
    });
  }

  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference * (1 - coveragePct / 100);
  const trendColor = coveragePct >= 70 ? "#10b981" : coveragePct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Hero metrics */}
      <div className="grid grid-cols-5 gap-4 items-stretch">
        <div className="col-span-2 bg-card border border-border/60 rounded-xl p-5 flex items-center gap-6">
          <div className="flex-shrink-0 flex flex-col items-center">
            <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
              <circle
                cx="48"
                cy="48"
                r="36"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                fill="none"
                stroke={trendColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 48 48)"
              />
              <text
                x="48"
                y="44"
                textAnchor="middle"
                className="fill-foreground"
                fontSize="18"
                fontWeight="700"
              >
                {coveragePct}%
              </text>
              <text
                x="48"
                y="60"
                textAnchor="middle"
                fill="currentColor"
                fontSize="9"
                opacity="0.5"
              >
                coverage
              </text>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {coveredAccountIds.size} of {accounts.length} target accounts have ≥1 warm path
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              Network coverage across all ICP accounts
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Strong paths (warmth &gt;70): {strongCount}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Moderate (40–70): {moderateCount}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                No path: {noPathCount}
              </span>
            </div>
          </div>
        </div>

        {[
          { label: "Warm", value: warmCount, color: "text-emerald-500", dot: "bg-emerald-500" },
          { label: "Stale", value: staleCount, color: "text-brand", dot: "bg-brand" },
          { label: "Cold path", value: coldCount, color: "text-blue-400", dot: "bg-blue-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border/60 rounded-xl p-5 flex flex-col justify-center"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {accounts.length ? Math.round((s.value / accounts.length) * 100) : 0}% of accounts
            </div>
          </div>
        ))}
      </div>

      {/* 90-day trend sparkline */}
      <div className="bg-card border border-border/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold">Coverage trend last 90 days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Started at</span>
            <span className="text-xs font-semibold">{coverageTrend[0].pct}%</span>
            <span className="text-xs text-muted-foreground">→ now</span>
            <span className="text-xs font-semibold" style={{ color: trendColor }}>
              {coveragePct}%
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 ml-1">
              +{coveragePct - coverageTrend[0].pct}pp
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={coverageTrend} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="coverageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              domain={[35, 65]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(v) => [`${v}%`, "Coverage"]}
            />
            <Area
              type="monotone"
              dataKey="pct"
              stroke={trendColor}
              strokeWidth={2}
              fill="url(#coverageGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <h2 className="text-sm font-semibold">Account coverage breakdown</h2>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={exportCSV}>
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground">
                <th className="text-left px-5 py-2.5 font-medium">Account</th>
                <th className="text-left px-4 py-2.5 font-medium">Best warmth</th>
                <th className="text-left px-4 py-2.5 font-medium">Intro via</th>
                <th className="text-left px-4 py-2.5 font-medium">Gap</th>
                <th className="text-left px-4 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const cfg = GAP_CONFIG[row.gapType];
                return (
                  <tr
                    key={row.accountId}
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-[11px] font-bold text-foreground flex-shrink-0">
                          {row.accountName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{row.accountName}</div>
                          <span className="inline-block mt-0.5 text-[9px] px-1.5 py-px rounded bg-muted text-muted-foreground border border-border/40">
                            {row.industry}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.bestWarmth > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${row.bestWarmth}%`,
                                backgroundColor: warmthColor(row.bestWarmth),
                              }}
                            />
                          </div>
                          <span
                            className="tabular-nums font-semibold text-[11px] px-1.5 py-px rounded"
                            style={{
                              color: warmthColor(row.bestWarmth),
                              background:
                                row.bestWarmth >= 70
                                  ? "rgba(16,185,129,0.1)"
                                  : row.bestWarmth >= 40
                                    ? "rgba(245,158,11,0.1)"
                                    : "rgba(239,68,68,0.1)",
                            }}
                          >
                            {row.bestWarmth}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.introPerson !== "-" ? (
                        <span className="font-medium text-foreground">{row.introPerson}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                        {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.gapType === "warm" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 whitespace-nowrap"
                          onClick={() =>
                            toast.success(`Drafting intro for ${row.accountName}`, {
                              description: `Via ${row.introPerson}`,
                            })
                          }
                        >
                          Draft intro →
                        </Button>
                      ) : row.gapType === "cold_path" || row.gapType === "stale_path" ? (
                        <span className="text-muted-foreground text-[11px]">
                          Re-engage connection
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">
                          Find connection on LinkedIn
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gap breakdown note */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        {[
          {
            type: "no_path" as GapType,
            title: "No path",
            desc: "No team member has worked with, met, or connected with anyone at this account.",
          },
          {
            type: "cold_path" as GapType,
            title: "Cold path",
            desc: "A path exists but warmth score is below 45 — the relationship is too weak for a credible intro.",
          },
          {
            type: "stale_path" as GapType,
            title: "Stale path",
            desc: "A warm path exists but last interaction was 90+ days ago. Re-engage before requesting an intro.",
          },
        ].map((item) => {
          const cfg = GAP_CONFIG[item.type];
          return (
            <div key={item.type} className="bg-card border border-border/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="font-semibold">{item.title}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Relationships Spreadsheet ────────────────────────────────────────────────

function RelationshipsSpreadsheet() {
  const { contacts, accounts, warmPaths, relationshipEdges } = useSalesStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Build per-contact last-synced from relationshipEdges
  const lastSyncedMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const edge of relationshipEdges) {
      for (const cid of [edge.from_id, edge.to_id]) {
        const existing = map.get(cid);
        if (!existing || edge.last_interaction_at > existing) {
          map.set(cid, edge.last_interaction_at);
        }
      }
    }
    return map;
  }, [relationshipEdges]);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => {
      const account = accounts.find((a) => a.id === c.account_id);
      return c.name.toLowerCase().includes(q) || account?.name.toLowerCase().includes(q);
    });
  }, [contacts, accounts, search]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: `calc(100vh - ${HEADER_H * 2 + 1}px)` }}
    >
      {/* View controls bar */}
      <div
        className="flex justify-between items-center px-6 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: "#27272a", background: "#09090b" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 border rounded px-2.5 h-8"
            style={{ borderColor: "#27272a", background: "#18181b" }}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#71717a" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter relationships..."
              className="bg-transparent outline-none text-xs w-48"
              style={{ color: "#e5e5e5" }}
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: "#27272a", color: "#a1a1aa" }}
          >
            <Filter className="w-3 h-3" />
            Filter
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: "#27272a", color: "#a1a1aa" }}
          >
            <SlidersHorizontal className="w-3 h-3" />
            Sort
          </button>
        </div>
        <span className="text-xs" style={{ color: "#71717a" }}>
          {filtered.length} Contact{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-auto" style={{ background: "#09090b" }}>
        <table className="w-full border-collapse" style={{ minWidth: 1000, whiteSpace: "nowrap" }}>
          <thead
            className="sticky top-0 z-10"
            style={{ background: "#18181b", borderBottom: "1px solid #27272a" }}
          >
            <tr>
              {/* checkbox col */}
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                />
              </th>
              {[
                { label: "Contact", sortable: true },
                { label: "Target Company", sortable: false },
                { label: "Internal Connector", sortable: false },
                { label: "Shared Context", sortable: false },
                { label: "Warmth", sortable: true },
                { label: "Last Synced", sortable: true },
              ].map((col) => (
                <th
                  key={col.label}
                  className="text-left px-4 py-2.5 text-xs font-medium select-none"
                  style={{ color: "#a1a1aa" }}
                >
                  {col.label}
                  {col.sortable && (
                    <span className="ml-1 opacity-40" style={{ fontSize: 10 }}>
                      ↕
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact) => {
              const account = accounts.find((a) => a.id === contact.account_id);
              const warmPath = warmPaths.find((wp) => wp.contact_id === contact.id);
              const connector = warmPath?.recommended_intro_person ?? "—";
              const context = warmPath?.path_explanation ?? "No context";
              const score = contact.warmth_score ?? 0;
              const color = warmthColor(score);
              const lastInteraction = lastSyncedMap.get(contact.id);
              const isSelected = selected.has(contact.id);
              const ini = initials(contact.name);
              const bg = avatarBg(contact.name);
              const accountFirst = account?.name.charAt(0).toUpperCase() ?? "?";

              return (
                <tr
                  key={contact.id}
                  className="group transition-colors"
                  style={{
                    borderBottom: "1px solid #27272a",
                    background: isSelected ? "rgba(79,70,229,0.06)" : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#18181b";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = "";
                  }}
                >
                  {/* Checkbox */}
                  <td className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(contact.id)}
                      className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ opacity: isSelected ? 1 : undefined }}
                    />
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ background: bg, color: "#e5e5e5" }}
                      >
                        {ini}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-medium leading-tight"
                          style={{ color: "#e5e5e5" }}
                        >
                          {contact.name}
                        </span>
                        <span className="text-xs leading-tight mt-0.5" style={{ color: "#71717a" }}>
                          {contact.title ?? "—"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Target Company */}
                  <td className="px-4 py-3">
                    {account ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ background: "#2563eb", color: "#fff" }}
                        >
                          {accountFirst}
                        </div>
                        <span className="text-sm" style={{ color: "#e5e5e5" }}>
                          {account.name}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#71717a" }}>—</span>
                    )}
                  </td>

                  {/* Internal Connector */}
                  <td className="px-4 py-3">
                    {connector !== "—" ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
                          style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}
                        >
                          {initials(connector)}
                        </div>
                        <span className="text-sm" style={{ color: "#e5e5e5" }}>
                          {connector}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "#71717a" }}>—</span>
                    )}
                  </td>

                  {/* Shared Context */}
                  <td className="px-4 py-3" style={{ maxWidth: 240 }}>
                    {context !== "No context" ? (
                      <div
                        className="inline-block rounded px-2 py-1 text-xs truncate max-w-[220px]"
                        style={{
                          background: "#18181b",
                          border: "1px solid #27272a",
                          color: "#a1a1aa",
                        }}
                        title={context}
                      >
                        {context}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "#71717a" }}>
                        No context
                      </span>
                    )}
                  </td>

                  {/* Warmth */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5" style={{ minWidth: 100 }}>
                      <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                        {score}
                      </span>
                      <div
                        className="flex-1 rounded-full overflow-hidden"
                        style={{ height: 5, background: "#27272a", maxWidth: 64 }}
                      >
                        <div
                          style={{
                            width: `${score}%`,
                            height: "100%",
                            borderRadius: 9999,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Last Synced */}
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: "#71717a" }}>
                      {formatRelativeTime(lastInteraction)}
                    </span>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-sm" style={{ color: "#71717a" }}>
                  No contacts match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div
        className="h-8 flex items-center px-4 justify-between text-xs flex-shrink-0"
        style={{ borderTop: "1px solid #27272a", color: "#71717a" }}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }}
            />
            Sync Active
          </span>
          <span>Last updated: just now</span>
        </div>
        <div>Selected: {selected.size}</div>
      </div>
    </div>
  );
}

// ─── Activity Empty State ─────────────────────────────────────────────────────

function ActivityTab() {
  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ height: `calc(100vh - ${HEADER_H * 2 + 1}px)`, background: "#09090b" }}
    >
      <EmptyState
        variant="empty"
        size="lg"
        title="No activity yet"
        description="Relationship activity and interaction history will appear here once synced."
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RelationshipGraphPage() {
  const { contacts, accounts, teamMembers, relationshipEdges, warmPaths } = useSalesStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Top-level tab
  const [activeTab, setActiveTab] = useState<TabId>("relationships");

  // Pipeline sub-view (graph vs coverage)
  const view = (searchParams.get("view") as ViewMode) ?? "graph";
  const setView = (v: ViewMode) => router.replace(`/relationship-graph?view=${v}`);

  // Graph state
  const [selectedNode, setSelectedNode] = useState<(GraphNode & { type: string }) | null>(null);
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [computedPaths, setComputedPaths] = useState<ComputedPath[]>([]);
  const [pathsSearched, setPathsSearched] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [warmthThreshold, setWarmthThreshold] = useState(20);
  const [coverageMode, setCoverageMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const graphWrapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      graphWrapRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  const graph = useMemo(() => {
    const teamNodes: GraphNode[] = teamMembers.map((tm) => ({
      id: tm.id,
      name: tm.name,
      type: tm.id === "user-1" ? "user" : "team_member",
    }));
    return buildRelationshipGraph(relationshipEdges, teamNodes);
  }, [teamMembers, relationshipEdges]);

  const allPeople = useMemo(
    () => [
      ...teamMembers.map((tm) => ({ id: tm.id, name: tm.name })),
      ...contacts.slice(0, 20).map((c) => ({ id: c.id, name: c.name })),
    ],
    [teamMembers, contacts],
  );

  const sourceTeamIds = useMemo(() => teamMembers.map((t) => t.id), [teamMembers]);

  const accountsWithWarmPath = useMemo(
    () => new Set(warmPaths.map((wp) => wp.account_id)),
    [warmPaths],
  );

  const applyPaths = useCallback((paths: ComputedPath[]) => {
    setComputedPaths(paths);
    setPathsSearched(true);
    const ids = new Set<string>();
    for (const p of paths) for (const n of p.nodes) ids.add(n.id);
    setHighlightedIds(ids);
  }, []);

  const handleFindPaths = useCallback(() => {
    const from = allPeople.find((p) => p.name.toLowerCase().includes(fromSearch.toLowerCase()));
    const to = allPeople.find((p) => p.name.toLowerCase().includes(toSearch.toLowerCase()));
    if (!from || !to) return;
    setIsComputing(true);
    setTimeout(() => {
      applyPaths(graph.findPaths(from.id, to.id, 3, 3));
      setIsComputing(false);
    }, 600);
  }, [allPeople, fromSearch, toSearch, graph, applyPaths]);

  const handleNodeClick = useCallback(
    (node: unknown) => {
      const n = node as GraphNode & { type: string };
      setSelectedNode(n);
      if (n.type === "contact") {
        setIsComputing(true);
        setTimeout(() => {
          const all: ComputedPath[] = [];
          for (const sid of sourceTeamIds) {
            all.push(...graph.findPaths(sid, n.id, 3, 3));
          }
          applyPaths(all.sort((a, b) => b.warmth - a.warmth).slice(0, 3));
          setIsComputing(false);
        }, 400);
      }
    },
    [sourceTeamIds, graph, applyPaths],
  );

  const filteredEdges = useMemo(
    () =>
      warmthThreshold > 0
        ? relationshipEdges.filter((e) => computeEdgeWarmth(e) >= warmthThreshold)
        : relationshipEdges,
    [relationshipEdges, warmthThreshold],
  );

  const { nodes, links } = useMemo(() => {
    const graphNodes = [
      ...teamMembers.map((tm) => ({
        id: tm.id,
        name: tm.name,
        type: tm.id === "user-1" ? "user" : "team",
        val: tm.id === "user-1" ? 28 : 16,
        color: tm.id === "user-1" ? NODE_COLORS.user : NODE_COLORS.team,
      })),
      ...contacts.slice(0, 18).map((c) => ({
        id: c.id,
        name: c.name,
        type: "contact",
        val: Math.max(6, c.warmth_score / 9),
        color: NODE_COLORS.contact,
        accountId: c.account_id,
      })),
      ...accounts.slice(0, 10).map((a) => ({
        id: a.id,
        name: a.name,
        type: "account",
        val: Math.max(5, a.opportunity_score / 12),
        color: NODE_COLORS.account,
        hasWarmPath: accountsWithWarmPath.has(a.id),
      })),
    ];

    const graphLinks = [
      ...filteredEdges.map((e) => ({
        source: e.from_id,
        target: e.to_id,
        relType: e.relationship_type,
        strength: e.strength_score,
        warmth: computeEdgeWarmth(e),
      })),
      ...contacts.slice(0, 18).map((c) => ({
        source: c.id,
        target: c.account_id,
        relType: "works_at",
        strength: 55,
        warmth: 40,
      })),
    ];

    return { nodes: graphNodes, links: graphLinks };
  }, [teamMembers, contacts, accounts, filteredEdges, accountsWithWarmPath]);

  const nodeCanvasObject = useCallback(
    (node: unknown, ctx: CanvasRenderingContext2D) => {
      const n = node as {
        x?: number;
        y?: number;
        val: number;
        color: string;
        name: string;
        id: string;
        type: string;
        hasWarmPath?: boolean;
      };
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const r = Math.sqrt(n.val) * 3.2;
      const isHighlighted = highlightedIds.has(n.id);
      const isYou = n.id === "user-1";
      const isDimmed = coverageMode && n.type === "account" && !n.hasWarmPath && !isHighlighted;
      const alpha = isDimmed ? 0.2 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (isHighlighted || isYou) {
        const glowR = r * (isYou ? 4 : 3);
        const grd = ctx.createRadialGradient(x, y, 0, x, y, glowR);
        grd.addColorStop(0, `${n.color}50`);
        grd.addColorStop(0.5, `${n.color}20`);
        grd.addColorStop(1, `${n.color}00`);
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, 2 * Math.PI);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      if (isYou) {
        ctx.beginPath();
        ctx.arc(x, y, r + 7, 0, 2 * Math.PI);
        ctx.strokeStyle = `${n.color}70`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted || isYou ? n.color : `${n.color}bb`;
      ctx.fill();

      const ig = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      ig.addColorStop(0, "rgba(255,255,255,0.25)");
      ig.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = ig;
      ctx.fill();

      const label = n.name.split(" ")[0];
      const fontSize = isYou ? 11 : 9;
      ctx.font = `${isHighlighted || isYou ? "700" : "500"} ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = isHighlighted || isYou ? "#ffffff" : "rgba(255,255,255,0.65)";
      ctx.fillText(label, x, y + r + 4);
      ctx.shadowBlur = 0;
      ctx.restore();
    },
    [highlightedIds, coverageMode],
  );

  const linkColor = useCallback(
    (link: unknown) => {
      const l = link as { relType: string; source: unknown; target: unknown; warmth?: number };
      const srcId =
        typeof l.source === "object" ? (l.source as { id: string }).id : String(l.source);
      const tgtId =
        typeof l.target === "object" ? (l.target as { id: string }).id : String(l.target);
      const isWarm = highlightedIds.has(srcId) && highlightedIds.has(tgtId);
      const w = l.warmth ?? 50;
      const base = w >= 70 ? "#10b981" : w >= 40 ? "#f59e0b" : "#ef4444";
      return isWarm ? `${base}ee` : `${base}35`;
    },
    [highlightedIds],
  );

  const linkWidth = useCallback(
    (link: unknown) => {
      const l = link as { relType: string; strength: number; source: unknown; target: unknown };
      const srcId =
        typeof l.source === "object" ? (l.source as { id: string }).id : String(l.source);
      const tgtId =
        typeof l.target === "object" ? (l.target as { id: string }).id : String(l.target);
      const isWarm = highlightedIds.has(srcId) && highlightedIds.has(tgtId);
      return isWarm ? 3 : (l.strength / 100) * 1.5;
    },
    [highlightedIds],
  );

  const decayingEdges = useMemo(() => {
    const now = Date.now();
    return relationshipEdges
      .filter((e) => {
        const days = (now - new Date(e.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24);
        return days > 45;
      })
      .slice(0, 5);
  }, [relationshipEdges]);

  const TAB_STYLES = (id: TabId): React.CSSProperties =>
    activeTab === id
      ? {
          color: "#2563eb",
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 14,
          cursor: "pointer",
          background: "none",
          border: "none",
          borderBottom: "2px solid #2563eb",
          paddingBottom: 0,
          fontWeight: 500,
        }
      : {
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: 14,
          cursor: "pointer",
          background: "none",
          border: "none",
          borderBottom: "2px solid transparent",
          color: "#a1a1aa",
          fontWeight: 400,
          paddingBottom: 0,
        };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: `calc(100vh - ${HEADER_H}px)`, background: "#09090b" }}
    >
      {/* Top App Bar with tab navigation */}
      <header
        className="flex justify-between items-center px-6 flex-shrink-0"
        style={{
          height: HEADER_H,
          borderBottom: "1px solid #27272a",
          background: "#09090b",
        }}
      >
        <nav className="flex h-full items-center gap-6">
          {(
            [
              { id: "relationships" as TabId, label: "Relationships" },
              { id: "pipeline" as TabId, label: "Pipeline" },
              { id: "activity" as TabId, label: "Activity" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={TAB_STYLES(tab.id) as React.CSSProperties}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-8 px-3 rounded border flex items-center gap-1.5 text-xs transition-colors hover:bg-white/5"
            style={{ borderColor: "#27272a", color: "#a1a1aa" }}
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
          </button>
          <button
            type="button"
            className="h-8 px-3 rounded border flex items-center gap-1.5 text-xs transition-colors hover:bg-white/5"
            style={{ borderColor: "#27272a", color: "#a1a1aa" }}
          >
            <Clock className="w-3.5 h-3.5" />
            History
          </button>
          <div className="w-px h-5" style={{ background: "#27272a" }} />
          <button
            type="button"
            className="h-8 px-3 rounded border flex items-center gap-1.5 text-xs transition-colors hover:bg-white/5"
            style={{ borderColor: "#27272a", color: "#a1a1aa" }}
            onClick={() => toast.success("Exported to clipboard")}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            type="button"
            className="h-8 px-3 rounded flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{ background: "#2563eb", color: "#fff" }}
            onClick={() => toast.info("Add contact coming soon")}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </button>
        </div>
      </header>

      {/* Tab content */}
      {activeTab === "relationships" && <RelationshipsSpreadsheet />}

      {activeTab === "activity" && <ActivityTab />}

      {activeTab === "pipeline" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Pipeline sub-header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 flex-shrink-0 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Network className="w-4 h-4 text-brand" />
              <div>
                <h1 className="text-sm font-bold leading-none">Relationship Graph</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  BFS pathfinding · warmth-scored edges · real network intelligence
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] bg-brand/10 text-brand border-brand/20"
              >
                Live
              </Badge>
            </div>

            {/* View tabs */}
            <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border/40">
              <button
                type="button"
                onClick={() => setView("graph")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  view === "graph"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Network className="w-3 h-3" />
                Graph
              </button>
              <button
                type="button"
                onClick={() => setView("coverage")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  view === "coverage"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                Coverage map
              </button>
            </div>

            {view === "graph" && (
              <div className="flex items-center gap-8 pr-2">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                {[
                  { label: "Nodes", value: nodes.length },
                  { label: "Edges", value: links.length },
                  { label: "Paths", value: computedPaths.length },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-base font-bold tabular-nums leading-none">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline content */}
          {view === "coverage" ? (
            <div className="flex-1 overflow-y-auto">
              <CoverageMap />
            </div>
          ) : (
            <div ref={graphWrapRef} className="flex flex-1 min-h-0 overflow-hidden">
              {/* Graph canvas */}
              <div
                ref={containerRef}
                className="flex-1 min-w-0 relative"
                style={{ background: CANVAS_BG }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />

                <ForceGraph2D
                  graphData={{ nodes, links }}
                  width={dimensions.width}
                  height={dimensions.height}
                  nodeLabel={(node) => {
                    const n = node as (typeof nodes)[0];
                    const typeLabel =
                      n.type === "user"
                        ? "You"
                        : n.type === "team"
                          ? "Team member"
                          : n.type === "contact"
                            ? "Contact"
                            : "Account";
                    return `<div style="font-size:12px;padding:4px 8px;background:#1e1e2e;border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:white"><strong>${n.name}</strong><br/><span style="opacity:0.6;font-size:10px">${typeLabel}</span></div>`;
                  }}
                  nodeVal="val"
                  nodeColor="color"
                  linkColor={linkColor}
                  linkWidth={linkWidth}
                  onNodeClick={handleNodeClick}
                  nodeCanvasObject={nodeCanvasObject}
                  backgroundColor={CANVAS_BG}
                  cooldownTicks={180}
                  d3AlphaDecay={0.015}
                  d3VelocityDecay={0.3}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleWidth={(link: unknown) => {
                    const l = link as { source: unknown; target: unknown };
                    const srcId =
                      typeof l.source === "object" ? (l.source as { id: string }).id : "";
                    const tgtId =
                      typeof l.target === "object" ? (l.target as { id: string }).id : "";
                    return highlightedIds.has(srcId) && highlightedIds.has(tgtId) ? 3 : 0;
                  }}
                  linkDirectionalParticleColor={(link: unknown) => {
                    const l = link as { relType?: string };
                    return REL_COLORS[l.relType ?? ""] ?? "#f59e0b";
                  }}
                />

                {isComputing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#06060e]/60 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3 bg-card/90 border border-border/60 rounded-2xl px-6 py-4 shadow-2xl">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-brand loading-dot"
                            style={{ animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">Computing warmest path…</span>
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-5 left-5 flex flex-col gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3.5">
                  {[
                    { color: NODE_COLORS.user, label: "You", sub: "Source" },
                    { color: NODE_COLORS.team, label: "Team", sub: "Advisors / co-founders" },
                    { color: NODE_COLORS.contact, label: "Contacts", sub: "Prospects" },
                    { color: NODE_COLORS.account, label: "Accounts", sub: "Companies" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: `0 0 6px ${item.color}80`,
                        }}
                      />
                      <div>
                        <span className="text-[11px] text-white/80 font-medium">{item.label}</span>
                        <span className="text-[10px] text-white/40 ml-1.5">{item.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="absolute top-4 left-4 text-[10px] text-white/35 bg-black/50 backdrop-blur-sm border border-white/8 rounded-lg px-2.5 py-2">
                  Click a purple contact node · or use the finder →
                </div>
              </div>

              {/* Right panel */}
              <div className="w-[300px] flex-shrink-0 border-l border-border/50 flex flex-col overflow-hidden bg-background">
                {/* Filters */}
                <div className="p-4 border-b border-border/40 space-y-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">Filters</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground">Min edge warmth</span>
                      <span className="text-[11px] font-semibold tabular-nums">
                        {warmthThreshold > 0 ? `≥${warmthThreshold}` : "All"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={10}
                      value={warmthThreshold}
                      onChange={(e) => setWarmthThreshold(Number(e.target.value))}
                      className="w-full h-1.5 accent-brand cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground/60 mt-0.5">
                      <span>All</span>
                      <span>Strong only</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCoverageMode((v) => !v)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
                      coverageMode
                        ? "border-brand/30 bg-brand/10 text-brand"
                        : "border-border/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <LayoutGrid className="w-3 h-3" />
                      Coverage mode
                    </span>
                    <div
                      className={`w-7 h-4 rounded-full transition-colors relative ${
                        coverageMode ? "bg-brand" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-[#e5e1e4] shadow transition-transform ${
                          coverageMode ? "translate-x-3.5" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Path finder form */}
                <div className="p-4 border-b border-border/40">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Zap className="w-3.5 h-3.5 text-brand" />
                    <span className="text-xs font-semibold">Find warm path</span>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="From (e.g. Adhik)"
                        value={fromSearch}
                        onChange={(e) => setFromSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFindPaths()}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="To (e.g. Priya)"
                        value={toSearch}
                        onChange={(e) => setToSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFindPaths()}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={handleFindPaths}
                      disabled={!fromSearch || !toSearch || isComputing}
                    >
                      {isComputing ? "Computing…" : "Find warmest path"}
                    </Button>
                  </div>
                </div>

                {/* Decay alert */}
                {decayingEdges.length > 0 && (
                  <div className="mx-4 mt-4 flex-shrink-0">
                    <div className="rounded-xl border border-brand/20 bg-brand/5 p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="w-3 h-3 text-brand flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-brand">
                          {decayingEdges.length} cooling connection
                          {decayingEdges.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {decayingEdges.slice(0, 3).map((e) => (
                          <p key={e.id} className="text-[10px] text-muted-foreground">
                            {e.from_name.split(" ")[0]} → {e.to_name.split(" ")[0]}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                  {!pathsSearched ? (
                    <EmptyState
                      variant="empty"
                      size="sm"
                      title="No search yet"
                      description="Click a contact node or use the finder above."
                    />
                  ) : computedPaths.length === 0 ? (
                    <EmptyState
                      variant="no-path"
                      size="sm"
                      title="No warm path found"
                      description="No shared connection within 3 hops. Expand your network or try cold outreach."
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <GitFork className="w-3.5 h-3.5 text-brand" />
                        <span className="text-xs font-semibold">
                          {computedPaths.length} path{computedPaths.length > 1 ? "s" : ""} found
                        </span>
                        {selectedNode && (
                          <span className="text-[11px] text-muted-foreground">
                            → {selectedNode.name.split(" ")[0]}
                          </span>
                        )}
                      </div>

                      {computedPaths.map((path, idx) => (
                        <div
                          key={path.nodes.map((n) => n.id).join("-")}
                          className={`rounded-xl border p-3 ${
                            idx === 0 ? "border-brand/30 bg-brand/5" : "border-border/40 bg-muted/5"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {idx === 0 ? "Best path" : `Path ${idx + 1}`}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] tabular-nums ${
                                idx === 0
                                  ? "bg-brand/10 text-brand border-brand/20"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {path.warmth} warmth
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 flex-wrap mb-2.5">
                            {path.nodes.map((node, ni) => (
                              <span key={node.id} className="flex items-center gap-1">
                                {ni > 0 && (
                                  <span className="text-muted-foreground/40 text-[10px]">→</span>
                                )}
                                <span
                                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                                    ni === 0
                                      ? "bg-brand/15 text-brand"
                                      : ni === path.nodes.length - 1
                                        ? "bg-violet-500/15 text-violet-400"
                                        : "bg-blue-500/15 text-blue-400"
                                  }`}
                                >
                                  {node.name.split(" ")[0]}
                                </span>
                              </span>
                            ))}
                          </div>

                          <div className="space-y-1.5">
                            {path.edges.map((e) => (
                              <div
                                key={`${e.edge.from_id}-${e.edge.to_id}`}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="w-2 h-0.5 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      REL_COLORS[e.edge.relationship_type] ?? "#475569",
                                  }}
                                />
                                <span className="text-[10px] text-muted-foreground flex-1 truncate capitalize">
                                  {e.edge.relationship_type.replace(/_/g, " ")}
                                </span>
                                <div className="w-10 h-1 bg-muted rounded-full overflow-hidden flex-shrink-0">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${e.warmth}%`,
                                      backgroundColor: e.warmth >= 70 ? "#f59e0b" : "#3b82f6",
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] tabular-nums text-muted-foreground w-5 text-right">
                                  {e.warmth}
                                </span>
                              </div>
                            ))}
                          </div>

                          {path.weakestLink.warmth < 55 && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-brand/80 bg-brand/8 border border-brand/15 rounded-lg px-2 py-1.5">
                              Weak link: {path.weakestLink.from.name.split(" ")[0]} →{" "}
                              {path.weakestLink.to.name.split(" ")[0]}
                            </div>
                          )}

                          {idx === 0 && (
                            <Button
                              size="sm"
                              className="w-full h-7 text-xs mt-2.5"
                              onClick={() => {
                                const targetContact = selectedNode;
                                if (targetContact) {
                                  router.push(`/approval-queue?contact=${targetContact.id}`);
                                }
                              }}
                            >
                              Draft intro
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected node footer */}
                {selectedNode && (
                  <div className="p-4 border-t border-border/40 bg-muted/20 flex-shrink-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Info className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                        Selected
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{selectedNode.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                      {selectedNode.type?.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
