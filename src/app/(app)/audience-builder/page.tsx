"use client";

import { ChevronRight, GitFork, Rocket, Search, Sparkles, Target, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildRelationshipGraph } from "@/lib/graph";
import { signalTypeLabel } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedCriteria {
  roles: string[];
  stages: string[];
  industries: string[];
  signalTypes: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ENRICHMENT_STATUSES = [
  { label: "Fetching LinkedIn data", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { label: "Checking signals", color: "text-brand bg-brand/10 border-brand/20" },
  { label: "Finding warm path", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  { label: "Scoring fit", color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  { label: "Ready", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
] as const;

const STAGE_OPTIONS = [
  { id: "1-50", label: "Seed (1–50)", min: 0, max: 50 },
  { id: "51-200", label: "Series A (51–200)", min: 51, max: 200 },
  { id: "201-500", label: "Series B (201–500)", min: 201, max: 500 },
  { id: "501-1000", label: "Series C (501–1K)", min: 501, max: 1000 },
  { id: "1001+", label: "Enterprise (1K+)", min: 1001, max: Infinity },
];

const SIGNAL_OPTIONS = [
  { id: "linkedin_post", label: "LinkedIn posts" },
  { id: "job_posting", label: "Hiring signals" },
  { id: "funding", label: "Funding rounds" },
  { id: "pricing_page_visit", label: "Pricing page visits" },
  { id: "website_visit", label: "Website visits" },
  { id: "g2_review", label: "G2 reviews" },
  { id: "leadership_change", label: "Leadership changes" },
];

const EXAMPLE_QUERIES = [
  "VP Sales at Series B SaaS who posted about CRM pain",
  "CTO at fintech startups who are hiring engineers",
  "CEO at seed-stage AI companies with funding signals",
];

// ─── NLP Query Parser ─────────────────────────────────────────────────────────

function parseQuery(q: string): ParsedCriteria {
  const roles: string[] = [];
  if (/vp.{0,5}sales|head of sales|sales dir/i.test(q)) roles.push("VP Sales");
  if (/\bcto\b|chief tech|head of eng|vp eng/i.test(q)) roles.push("CTO");
  if (/\bceo\b|founder|chief exec/i.test(q)) roles.push("CEO");
  if (/vp.{0,5}product|head of product/i.test(q)) roles.push("VP Product");
  if (/vp.{0,5}market|head of market/i.test(q)) roles.push("VP Marketing");
  if (/\bcfo\b|chief financial/i.test(q)) roles.push("CFO");
  if (/revenue|rev ops|head of growth/i.test(q)) roles.push("Head of Revenue");

  const stages: string[] = [];
  if (/\bseed\b/i.test(q)) stages.push("1-50");
  if (/series.{0,3}a\b/i.test(q)) stages.push("51-200");
  if (/series.{0,3}b\b/i.test(q)) stages.push("201-500");
  if (/series.{0,3}c\b/i.test(q)) stages.push("501-1000");
  if (/enterprise|late.?stage/i.test(q)) stages.push("1001+");

  const industries: string[] = [];
  if (/\bsaas\b|b2b.?software/i.test(q)) industries.push("AI / SaaS");
  if (/\bai\b|artificial intel|machine learn/i.test(q)) industries.push("AI / SaaS");
  if (/fintech|financial tech|insurtech/i.test(q)) industries.push("FinTech");
  if (/healthtech|health.?tech|medtech/i.test(q)) industries.push("HealthTech");
  if (/devtools|dev.?tools/i.test(q)) industries.push("DevTools");
  if (/martech|marketing.?tech/i.test(q)) industries.push("MarTech");
  if (/hrtech|hr.?tech/i.test(q)) industries.push("HRTech");
  if (/ecomm|e-?commerce/i.test(q)) industries.push("eCommerce");
  if (/revenue.?ops|revops|gtm/i.test(q)) industries.push("AI / SaaS");

  const signalTypes: string[] = [];
  if (/post|linkedin|tweet/i.test(q)) signalTypes.push("linkedin_post");
  if (/hir|job.?post|recruit|open role/i.test(q)) signalTypes.push("job_posting");
  if (/fund|rais|series|invest/i.test(q)) signalTypes.push("funding");
  if (/pricing|trial|demo|eval/i.test(q)) signalTypes.push("pricing_page_visit");
  if (/visit|browse|website/i.test(q)) signalTypes.push("website_visit");
  if (/review|g2|capterra/i.test(q)) signalTypes.push("g2_review");
  // pain keywords → linkedin post intent
  if (/pain|problem|challeng|struggling|broken/i.test(q)) signalTypes.push("linkedin_post");

  return {
    roles,
    stages,
    industries: [...new Set(industries)],
    signalTypes: [...new Set(signalTypes)],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CriteriaChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-60 transition-opacity">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

function FilterToggle({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  color: "blue" | "amber";
  onClick: () => void;
}) {
  const activeClass =
    color === "blue"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      : "bg-brand/10 text-brand border-brand/20";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-all border ${
        active ? activeClass : "text-foreground hover:bg-muted/60 border-transparent"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          active
            ? color === "blue"
              ? "bg-blue-500 border-blue-500"
              : "bg-brand border-brand"
            : "border-border"
        }`}
      >
        {active && <span className="text-white text-[8px] font-bold">✓</span>}
      </div>
      {label}
    </button>
  );
}

function WarmPathDots({ nodes }: { nodes: Array<{ id: string; name: string }> }) {
  return (
    <div className="flex items-center gap-0.5">
      {nodes.map((n, i) => (
        <span key={n.id} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-muted-foreground/30 text-[9px]">›</span>}
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
              i === 0
                ? "bg-brand/20 text-brand"
                : i === nodes.length - 1
                  ? "bg-violet-500/20 text-violet-600"
                  : "bg-blue-500/20 text-blue-600"
            }`}
            title={n.name}
          >
            {n.name[0]}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AudienceBuilderPage() {
  const router = useRouter();
  const { accounts, contacts, signals, relationshipEdges, teamMembers } = useSalesStore();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tick, setTick] = useState(0);
  const [stageFilters, setStageFilters] = useState<string[]>([]);
  const [signalFilters, setSignalFilters] = useState<string[]>([]);

  // Debounce → reset enrichment tick
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setTick(0);
    }, 420);
    return () => clearTimeout(t);
  }, [query]);

  // Enrichment animation ticker
  useEffect(() => {
    const t = setInterval(() => setTick((p) => Math.min(p + 1, 20)), 750);
    return () => clearInterval(t);
  }, []);

  // Build graph
  const { graph, sourceIds } = useMemo(() => {
    const teamNodes = teamMembers.map((tm) => ({
      id: tm.id,
      name: tm.name,
      type: "team_member" as const,
    }));
    const g = buildRelationshipGraph(relationshipEdges, teamNodes);
    return { graph: g, sourceIds: teamMembers.map((t) => t.id) };
  }, [relationshipEdges, teamMembers]);

  const nlCriteria = useMemo(() => parseQuery(debouncedQuery), [debouncedQuery]);

  const effectiveStages = useMemo(
    () => [...new Set([...nlCriteria.stages, ...stageFilters])],
    [nlCriteria.stages, stageFilters],
  );
  const effectiveSignals = useMemo(
    () => [...new Set([...nlCriteria.signalTypes, ...signalFilters])],
    [nlCriteria.signalTypes, signalFilters],
  );

  // Filter accounts
  const matchingAccounts = useMemo(() => {
    let filtered = [...accounts];

    if (nlCriteria.industries.length > 0) {
      filtered = filtered.filter((a) =>
        nlCriteria.industries.some((ind) =>
          a.industry.toLowerCase().includes(ind.toLowerCase().split(" ")[0]),
        ),
      );
    }

    if (effectiveStages.length > 0) {
      filtered = filtered.filter((a) => {
        const ec = a.employee_count;
        return effectiveStages.some((s) => {
          const opt = STAGE_OPTIONS.find((o) => o.id === s);
          if (!opt) return false;
          return ec >= opt.min && ec <= opt.max;
        });
      });
    }

    if (effectiveSignals.length > 0) {
      filtered = filtered.filter((a) =>
        signals.some((s) => s.account_id === a.id && effectiveSignals.includes(s.type)),
      );
    }

    return filtered.sort((a, b) => b.opportunity_score - a.opportunity_score);
  }, [accounts, signals, nlCriteria.industries, effectiveStages, effectiveSignals]);

  // Compute warm paths + contact/signal data per account
  const accountData = useMemo(() => {
    return matchingAccounts.map((account) => {
      const topContact = contacts
        .filter((c) => c.account_id === account.id)
        .sort((a, b) => b.warmth_score - a.warmth_score)[0];

      const accountSignals = signals.filter((s) => s.account_id === account.id);
      const topSignal = [...accountSignals].sort((a, b) => b.urgency_score - a.urgency_score)[0];

      let bestPath: { nodes: Array<{ id: string; name: string }>; warmth: number } | null = null;
      if (topContact && sourceIds.length > 0) {
        for (const sid of sourceIds) {
          const paths = graph.findPaths(sid, topContact.id, 3, 1);
          if (paths.length > 0 && (!bestPath || paths[0].warmth > bestPath.warmth)) {
            bestPath = paths[0];
          }
        }
      }

      return { account, topContact, topSignal, path: bestPath, signalCount: accountSignals.length };
    });
  }, [matchingAccounts, contacts, signals, sourceIds, graph]);

  const warmCount = accountData.filter((d) => !!d.path).length;
  const totalSignals = accountData.reduce((sum, d) => sum + d.signalCount, 0);

  function getEnrichmentStatus(rowIdx: number) {
    const effective = Math.max(0, tick - Math.floor(rowIdx / 2));
    return ENRICHMENT_STATUSES[Math.min(4, effective)];
  }

  // Chips from NL + manual filters combined
  const criteriaChips = [
    ...nlCriteria.roles.map((r) => ({ key: `role:${r}`, label: r, onRemove: () => setQuery("") })),
    ...nlCriteria.industries.map((i) => ({
      key: `ind:${i}`,
      label: i,
      onRemove: () => setQuery(""),
    })),
    ...effectiveStages.map((s) => ({
      key: `stage:${s}`,
      label: STAGE_OPTIONS.find((o) => o.id === s)?.label ?? s,
      onRemove: () => setStageFilters((p) => p.filter((x) => x !== s)),
    })),
    ...effectiveSignals.map((s) => ({
      key: `sig:${s}`,
      label: SIGNAL_OPTIONS.find((o) => o.id === s)?.label ?? s,
      onRemove: () => setSignalFilters((p) => p.filter((x) => x !== s)),
    })),
  ];

  const hasQuery = debouncedQuery.length > 0;
  const noDetected = hasQuery && criteriaChips.length === 0;

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 48px)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50 flex-shrink-0 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-500" />
          <span className="font-semibold text-sm">Audience Builder</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ChevronRight className="w-3 h-3" />
          <span>{matchingAccounts.length} accounts</span>
          {warmCount > 0 && (
            <>
              <span className="text-border/60">·</span>
              <span className="text-brand font-medium flex items-center gap-0.5">
                <GitFork className="w-3 h-3" />
                {warmCount} warm paths
              </span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={matchingAccounts.length === 0}
            onClick={() => toast.success(`Exporting ${matchingAccounts.length} accounts…`)}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            disabled={matchingAccounts.length === 0}
            onClick={() => {
              toast.success(`Building campaign for ${matchingAccounts.length} accounts…`, {
                description: `${warmCount} will be routed via warm intros`,
              });
              setTimeout(() => router.push("/campaigns/new"), 1000);
            }}
          >
            <Rocket className="w-3 h-3" />
            Build campaign
          </Button>
        </div>
      </div>

      {/* NL Query bar */}
      <div className="px-5 py-3 border-b border-border/40 bg-card/20 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder='Describe your targets… e.g. "VP Sales at Series B SaaS who posted about CRM pain"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border/50 rounded-xl pl-9 pr-10 py-2.5 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-blue-500/40 focus:bg-muted/60 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Example queries when empty */}
        {!query && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground/60">Try:</span>
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="text-[11px] text-muted-foreground hover:text-blue-500 transition-colors underline-offset-2 hover:underline"
              >
                "{ex}"
              </button>
            ))}
          </div>
        )}

        {/* Parsed criteria chips */}
        {criteriaChips.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Sparkles className="w-3 h-3 text-brand flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground">Detected:</span>
            {criteriaChips.map((chip) => (
              <CriteriaChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
            ))}
          </div>
        )}

        {noDetected && (
          <p className="text-[11px] text-muted-foreground/60 mt-2">
            No criteria detected use phrases like "VP Sales at Series B SaaS" or "funded fintech"
          </p>
        )}
      </div>

      {/* Split pane */}
      <div className="flex flex-1 min-h-0">
        {/* Left: manual filters */}
        <div className="w-[252px] flex-shrink-0 border-r border-border/50 flex flex-col overflow-y-auto bg-card/20">
          <div className="p-4 space-y-5 flex-1">
            {/* Stage filter */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Company Stage
              </p>
              <div className="space-y-1">
                {STAGE_OPTIONS.map((opt) => (
                  <FilterToggle
                    key={opt.id}
                    active={effectiveStages.includes(opt.id)}
                    label={opt.label}
                    color="blue"
                    onClick={() =>
                      setStageFilters((p) =>
                        p.includes(opt.id) ? p.filter((s) => s !== opt.id) : [...p, opt.id],
                      )
                    }
                  />
                ))}
              </div>
            </div>

            {/* Signal filter */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Active Signals
              </p>
              <div className="space-y-1">
                {SIGNAL_OPTIONS.map((opt) => (
                  <FilterToggle
                    key={opt.id}
                    active={effectiveSignals.includes(opt.id)}
                    label={opt.label}
                    color="amber"
                    onClick={() =>
                      setSignalFilters((p) =>
                        p.includes(opt.id) ? p.filter((s) => s !== opt.id) : [...p, opt.id],
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="p-4 border-t border-border/40 space-y-2">
            {[
              { label: "Accounts", value: matchingAccounts.length, color: "text-foreground" },
              { label: "Warm paths", value: warmCount, color: "text-brand" },
              { label: "Active signals", value: totalSignals, color: "text-blue-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{s.label}</span>
                <span className={`font-bold tabular-nums ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: results table */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Table sub-header */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border/30 flex-shrink-0 bg-background/95 backdrop-blur-sm">
            <span className="text-xs font-semibold">Results</span>
            <Badge variant="outline" className="text-[10px]">
              {matchingAccounts.length}
            </Badge>
            {warmCount > 0 && (
              <span className="text-[11px] text-brand flex items-center gap-1 ml-1">
                <GitFork className="w-3 h-3" />
                {warmCount} warm
              </span>
            )}
            {matchingAccounts.length === 0 && !hasQuery && (
              <span className="text-[11px] text-muted-foreground ml-2">
                All accounts shown refine above to filter
              </span>
            )}
          </div>

          {matchingAccounts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Target className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No accounts match</p>
              <p className="text-xs text-muted-foreground/60">
                Try a broader description or fewer filters
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-border/30 text-muted-foreground">
                    <th className="text-left px-5 py-2.5 font-medium">Company</th>
                    <th className="text-left px-4 py-2.5 font-medium">Best contact</th>
                    <th className="text-left px-4 py-2.5 font-medium">Warm path</th>
                    <th className="text-left px-4 py-2.5 font-medium">Top signal</th>
                    <th className="text-left px-4 py-2.5 font-medium">Opp score</th>
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accountData.map(({ account, topContact, topSignal, path, signalCount }, i) => {
                    const status = getEnrichmentStatus(i);
                    return (
                      <tr
                        key={account.id}
                        className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                      >
                        {/* Company */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center text-[11px] font-bold text-brand flex-shrink-0">
                              {account.name[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground truncate max-w-[130px]">
                                {account.name}
                              </p>
                              <p className="text-muted-foreground text-[10px]">
                                {account.industry}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Best contact */}
                        <td className="px-4 py-3">
                          {topContact ? (
                            <div>
                              <p className="font-medium text-foreground truncate max-w-[150px]">
                                {topContact.name}
                              </p>
                              <p className="text-muted-foreground text-[10px] truncate max-w-[150px]">
                                {topContact.title}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>

                        {/* Warm path */}
                        <td className="px-4 py-3">
                          {path ? (
                            <div className="flex flex-col gap-0.5">
                              <WarmPathDots nodes={path.nodes} />
                              <span className="text-[10px] text-brand font-medium">
                                {path.warmth} warmth
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/40 italic">
                              No path
                            </span>
                          )}
                        </td>

                        {/* Top signal */}
                        <td className="px-4 py-3">
                          {topSignal ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border/40 inline-block max-w-[120px] truncate">
                                {signalTypeLabel(topSignal.type)}
                              </span>
                              {signalCount > 1 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{signalCount - 1} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </td>

                        {/* Opp score */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${account.opportunity_score}%` }}
                              />
                            </div>
                            <span className="tabular-nums text-muted-foreground font-medium">
                              {account.opportunity_score}
                            </span>
                          </div>
                        </td>

                        {/* Enrichment status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${status.color}`}
                          >
                            {status.label === "Ready" ? (
                              <>
                                <Zap className="w-2.5 h-2.5 mr-1" />
                                Ready
                              </>
                            ) : (
                              status.label
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
