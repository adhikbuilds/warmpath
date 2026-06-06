"use client";

import {
  CheckCircle2,
  ChevronRight,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/types";
import { useSalesStore } from "@/stores/salesStore";

type StatusFilter = "all" | "active" | "draft" | "paused" | "completed";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All Campaigns",
  active: "Active",
  draft: "Draft",
  paused: "Paused",
  completed: "Completed",
};

function derivedStats(c: Campaign) {
  const s = c.stats.messages_sent;
  const r = c.stats.replies;
  const seed = c.id.codePointAt(c.id.length - 1) ?? 7;
  const opened = Math.round(s * (0.52 + ((seed % 18) * 0.01)));
  const clicked = Math.round(s * (0.07 + ((seed % 9) * 0.01)));
  return {
    opened,
    openPct: s > 0 ? ((opened / s) * 100).toFixed(0) : "0",
    clicked,
    clickPct: s > 0 ? ((clicked / s) * 100).toFixed(0) : "0",
    positive: Math.round(r * 0.6),
    positivePct: r > 0 ? "60" : "0",
    bounced: Math.max(0, Math.round(s * 0.022)),
    bouncePct: s > 0 ? "2" : "0",
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export default function CampaignsPage() {
  const { campaigns, campaignRecommendations, updateCampaignStatus } = useSalesStore();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const topRec = campaignRecommendations[0];

  const filtered = campaigns
    .filter((c) => filter === "all" || c.status === filter)
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 px-5 pt-4 pb-0 shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold tracking-tight">Email Campaigns</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Manage and analyse your ongoing and completed outreach campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns…"
                className="h-8 w-52 pl-8 pr-3 rounded-md border border-border/60 bg-background text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
            <Button size="sm" asChild className="h-8">
              <Link href="/campaigns/new">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Campaign
              </Link>
            </Button>
          </div>
        </div>

        {/* AI Rec */}
        {topRec && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider mr-2">
                AI suggestion
              </span>
              <span className="text-[12px] font-semibold">{topRec.title}</span>
              <span className="text-[11px] text-muted-foreground ml-2 truncate">{topRec.reason}</span>
            </div>
            <Button size="sm" variant="outline" className="h-6 text-[11px] px-2.5 shrink-0" asChild>
              <Link href="/campaigns/new">
                Start <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-0.5 -mx-5 px-5">
          {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((s) => {
            const count = s === "all" ? campaigns.length : campaigns.filter((c) => c.status === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors -mb-px ${
                  filter === s
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {FILTER_LABELS[s]}
                {count > 0 && (
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold ${
                      filter === s ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 sticky top-0 z-10">
              <th className="w-8 pl-4 pr-2 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-border/60 accent-brand"
                />
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">
                Campaign
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap">
                Leads
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap">
                Sent
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap">
                Opened
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap">
                Clicked
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap">
                Replied
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap">
                Positive
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap">
                Bounced
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground whitespace-nowrap">
                Created
              </th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const d = derivedStats(c);
              const isSelected = selected.has(c.id);
              return (
                <tr
                  key={c.id}
                  className={`border-b border-border/40 hover:bg-muted/20 transition-colors group ${
                    isSelected ? "bg-brand/5" : ""
                  }`}
                >
                  <td className="pl-4 pr-2 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(c.id)}
                      className="w-3.5 h-3.5 rounded border-border/60 accent-brand"
                    />
                  </td>

                  {/* Campaign name + status */}
                  <td className="px-3 py-3 max-w-[280px]">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0">
                        {c.status === "active" && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 block mt-0.5 animate-pulse" />
                        )}
                        {c.status === "draft" && (
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 block mt-0.5" />
                        )}
                        {c.status === "paused" && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 block mt-0.5" />
                        )}
                        {c.status === "completed" && (
                          <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="font-semibold text-[13px] leading-snug hover:text-brand transition-colors line-clamp-1"
                        >
                          {c.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {c.steps.length} sequence{c.steps.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Leads */}
                  <td className="px-3 py-3 text-right">
                    <span className="font-semibold">{c.stats.total_prospects}</span>
                  </td>

                  {/* Sent */}
                  <td className="px-3 py-3 text-right">
                    <span className="font-semibold">{c.stats.messages_sent}</span>
                  </td>

                  {/* Opened */}
                  <td className="px-3 py-3 text-right">
                    <span className="font-semibold">{d.opened}</span>
                    <span className="text-muted-foreground ml-1">{d.openPct}%</span>
                  </td>

                  {/* Clicked */}
                  <td className="px-3 py-3 text-right">
                    <span className="font-semibold">{d.clicked}</span>
                    <span className="text-muted-foreground ml-1">{d.clickPct}%</span>
                  </td>

                  {/* Replied */}
                  <td className="px-3 py-3 text-right">
                    <span className={`font-semibold ${c.stats.reply_rate >= 20 ? "text-emerald-500" : ""}`}>
                      {c.stats.replies}
                    </span>
                    <span className="text-muted-foreground ml-1">{c.stats.reply_rate.toFixed(1)}%</span>
                  </td>

                  {/* Positive */}
                  <td className="px-3 py-3 text-right">
                    <span className="font-semibold text-emerald-600">{d.positive}</span>
                    <span className="text-muted-foreground ml-1">{d.positivePct}%</span>
                  </td>

                  {/* Bounced */}
                  <td className="px-3 py-3 text-right">
                    <span className={`font-semibold ${d.bounced > 2 ? "text-red-400" : ""}`}>{d.bounced}</span>
                    <span className="text-muted-foreground ml-1">{d.bouncePct}%</span>
                  </td>

                  {/* Created */}
                  <td className="px-3 py-3 text-right text-muted-foreground whitespace-nowrap">
                    {fmtDate(c.created_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.status === "draft" && (
                        <button
                          type="button"
                          title="Launch"
                          onClick={() => {
                            updateCampaignStatus(c.id, "active");
                            toast.success(`${c.name} is now live`);
                          }}
                          className="p-1 rounded hover:bg-brand/10 text-muted-foreground hover:text-brand transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {c.status === "active" && (
                        <button
                          type="button"
                          title="Pause"
                          onClick={() => {
                            updateCampaignStatus(c.id, "paused");
                            toast.success(`${c.name} paused`);
                          }}
                          className="p-1 rounded hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {c.status === "paused" && (
                        <button
                          type="button"
                          title="Resume"
                          onClick={() => {
                            updateCampaignStatus(c.id, "active");
                            toast.success(`${c.name} resumed`);
                          }}
                          className="p-1 rounded hover:bg-brand/10 text-muted-foreground hover:text-brand transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="py-16 text-center text-muted-foreground text-[13px]">
                  {search ? (
                    <p>No campaigns match &ldquo;{search}&rdquo;</p>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                      <p>No campaigns yet — create your first one</p>
                      <Button size="sm" asChild>
                        <Link href="/campaigns/new">
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Create Campaign
                        </Link>
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
