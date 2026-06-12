"use client";

import { ChevronDown, Filter, RefreshCw, UserCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatRelativeTime, signalTypeLabel } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "var(--background)",
  card: "var(--card)",
  border: "var(--border)",
  primary: "#2563eb",
  emerald: "#10b981",
  muted: "var(--muted-foreground)",
  veryMuted: "var(--muted-foreground)",
  white: "var(--foreground)",
  cardHoverBorder: "rgba(79,70,229,0.5)",
  dot: "radial-gradient(circle at 2px 2px, #3f3f46 1px, transparent 0)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ICP tier label based on opportunity score
function icpTier(score: number): string {
  if (score >= 80) return "Tier 1 ICP";
  if (score >= 60) return "Tier 2 ICP";
  return "Tier 3 ICP";
}

// Signal type badge color (inline style approach to match token system)
const SIGNAL_BADGE: Record<string, { bg: string; color: string }> = {
  funding: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  job_posting: { bg: "rgba(139,92,246,0.12)", color: "#a78bfa" },
  leadership_change: { bg: "rgba(234,179,8,0.12)", color: "#fbbf24" },
  intent_topic_surge: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  pricing_page_visit: { bg: "rgba(6,182,212,0.12)", color: "#22d3ee" },
  website_visit: { bg: "rgba(59,130,246,0.12)", color: "#60a5fa" },
  champion_job_change: { bg: "rgba(20,184,166,0.12)", color: "#2dd4bf" },
  product_launch: { bg: "rgba(236,72,153,0.12)", color: "#f472b6" },
  g2_review: { bg: "rgba(239,68,68,0.12)", color: "#f87171" },
  competitor_hiring: { bg: "rgba(249,115,22,0.12)", color: "#fb923c" },
  tech_stack_change: { bg: "rgba(168,85,247,0.12)", color: "#c084fc" },
  crm_stage_change: { bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
  linkedin_post: { bg: "rgba(14,165,233,0.12)", color: "#38bdf8" },
};

function signalBadgeStyle(type: string): { bg: string; color: string } {
  return SIGNAL_BADGE[type] ?? { bg: "rgba(161,161,170,0.12)", color: "var(--muted-foreground)" };
}

// ─── Filter chip component ────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  active?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  hasDropdown?: boolean;
}

function FilterChip({ label, active, removable, onRemove, onClick, hasDropdown }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        paddingLeft: removable ? 10 : 12,
        paddingRight: removable ? 6 : 12,
        height: 32,
        borderRadius: 9999,
        border: active ? `1px solid rgba(79,70,229,0.6)` : `1px solid ${T.border}`,
        backgroundColor: active ? "rgba(79,70,229,0.12)" : "transparent",
        color: active ? "#818cf8" : T.muted,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "border-color 0.15s, background-color 0.15s",
        flexShrink: 0,
      }}
    >
      {label}
      {hasDropdown && !removable && (
        <ChevronDown style={{ width: 13, height: 13, opacity: 0.7, marginLeft: 2 }} />
      )}
      {removable && (
        // biome-ignore lint/a11y/noStaticElementInteractions: remove chip button inside button
        // biome-ignore lint/a11y/useKeyWithClickEvents: remove chip button inside button
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 9999,
            background: "rgba(79,70,229,0.25)",
            marginLeft: 4,
            cursor: "pointer",
          }}
        >
          <X style={{ width: 10, height: 10, color: "#818cf8" }} />
        </span>
      )}
    </button>
  );
}

// ─── Signal card ──────────────────────────────────────────────────────────────

interface SignalCardProps {
  signalId: string;
  companyName: string;
  companyInitial: string;
  signalTitle: string;
  signalType: string;
  industry: string;
  opportunityScore: number;
  detectedAt: string;
  warmthScore: number;
  icpRelevanceReason?: string;
  connectorName: string;
  connectorInitials: string;
  connectorSubtitle: string;
  targetName: string;
  targetTitle: string;
  isDismissed: boolean;
  onDismiss: (id: string) => void;
  onDraftIntro: (companyName: string) => void;
}

function SignalCard({
  signalId,
  companyName,
  companyInitial,
  signalTitle,
  signalType,
  industry,
  opportunityScore,
  detectedAt,
  warmthScore,
  icpRelevanceReason,
  connectorName,
  connectorInitials,
  connectorSubtitle,
  targetName,
  targetTitle,
  isDismissed,
  onDismiss,
  onDraftIntro,
}: SignalCardProps) {
  const [hovered, setHovered] = useState(false);

  if (isDismissed) return null;

  const badge = signalBadgeStyle(signalType);
  const warmColor = warmthScore >= 80 ? T.emerald : warmthScore >= 50 ? "#f59e0b" : T.muted;

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: T.card,
        border: `1px solid ${hovered ? T.cardHoverBorder : T.border}`,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.18s",
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          {/* Company logo */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 16, color: "#000000" }}>
              {companyInitial}
            </span>
          </div>

          {/* Title + meta */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.white,
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {signalTitle}
              </h3>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 12, color: T.muted }}>{industry}</span>
              <span style={{ color: T.veryMuted, fontSize: 12 }}>·</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "1px 7px",
                  borderRadius: 9999,
                  backgroundColor: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.color}22`,
                }}
              >
                {signalTypeLabel(signalType)}
              </span>
              <span style={{ color: T.veryMuted, fontSize: 12 }}>·</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "1px 7px",
                  borderRadius: 9999,
                  backgroundColor: "rgba(79,70,229,0.1)",
                  color: "#818cf8",
                  border: "1px solid rgba(79,70,229,0.2)",
                }}
              >
                {icpTier(opportunityScore)}
              </span>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <span
          style={{
            fontSize: 12,
            color: T.veryMuted,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {formatRelativeTime(detectedAt)}
        </span>
      </div>

      {/* ICP relevance callout */}
      {icpRelevanceReason && (
        <div
          style={{
            margin: "0 16px",
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: "rgba(78,222,163,0.08)",
            border: "1px solid rgba(78,222,163,0.2)",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, lineHeight: 1.1, marginTop: 1 }}>💡</span>
          <span style={{ fontSize: 12, color: T.emerald, lineHeight: 1.5 }}>
            {icpRelevanceReason}
          </span>
        </div>
      )}

      {/* Path visualization */}
      <div
        style={{
          padding: "16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          minHeight: 160,
          backgroundColor: "rgba(9,9,11,0.4)",
        }}
      >
        {/* Dot grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.25,
            backgroundImage: T.dot,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Path nodes */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 8px",
          }}
        >
          {/* You node */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: `1px solid ${T.border}`,
                backgroundColor: "rgba(79,70,229,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              👤
            </div>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>You (AE)</span>
          </div>

          {/* Line with warmth badge */}
          <div
            style={{
              flex: 1,
              position: "relative",
              height: 1,
              backgroundColor: T.border,
              margin: "0 8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%) translateY(-50%)",
                backgroundColor: T.card,
                padding: "2px 10px",
                border: `1px solid ${T.border}`,
                borderRadius: 9999,
                display: "flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: warmColor,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: warmColor, fontWeight: 600 }}>
                {warmthScore} Warmth
              </span>
            </div>
          </div>

          {/* Connector node */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: `1px solid rgba(79,70,229,0.4)`,
                backgroundColor: "rgba(79,70,229,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#818cf8",
              }}
            >
              {connectorInitials}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.white, fontWeight: 500 }}>{connectorName}</div>
              {connectorSubtitle && (
                <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
                  {connectorSubtitle}
                </div>
              )}
            </div>
          </div>

          {/* Second line */}
          <div
            style={{
              flex: 1,
              height: 1,
              backgroundColor: T.border,
              margin: "0 8px",
            }}
          />

          {/* Target node */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: `2px dashed ${T.primary}`,
                backgroundColor: "rgba(79,70,229,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCircle size={18} color={T.primary} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.white, fontWeight: 500 }}>
                {targetName || "Target"}
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{targetTitle}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${T.border}`,
          backgroundColor: "rgba(9,9,11,0.6)",
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}
      >
        <button
          type="button"
          onClick={() => onDismiss(signalId)}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            border: `1px solid ${T.border}`,
            backgroundColor: "transparent",
            color: T.muted,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#3f3f46";
            e.currentTarget.style.color = T.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.color = T.muted;
          }}
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => onDraftIntro(companyName)}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            border: `1px solid ${T.primary}`,
            backgroundColor: T.primary,
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#4338ca";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = T.primary;
          }}
        >
          Draft Intro Request
        </button>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const router = useRouter();
  const { signals, accounts, contacts, warmPaths } = useSalesStore();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [dismissReasons, setDismissReasons] = useState<Record<string, string>>({});
  const [pendingDismissId, setPendingDismissId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  async function fetchLiveSignals() {
    setFetching(true);
    try {
      const res = await fetch("/api/cron/signals", { method: "POST" });
      const data = await res.json();
      if (data.ingested > 0) {
        toast.success(`${data.ingested} new signal${data.ingested > 1 ? "s" : ""} ingested`);
        router.refresh();
      } else {
        toast.info(`No new signals found (${data.fetched ?? 0} articles checked)`);
      }
    } catch {
      toast.error("Failed to fetch signals");
    } finally {
      setFetching(false);
    }
  }
  const [fundingChipActive, setFundingChipActive] = useState(false);
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>("all");
  const [icpTierFilter, setIcpTierFilter] = useState<string>("all");
  const [warmthFilter, setWarmthFilter] = useState<string>("all");

  // Check if any funding signals exist to conditionally show chip
  const hasFundingSignals = useMemo(() => signals.some((s) => s.type === "funding"), [signals]);

  const availableSignalTypes = useMemo(
    () => Array.from(new Set(signals.map((s) => s.type))),
    [signals],
  );

  // Enrich signals with account / path / contact data
  const enrichedSignals = useMemo(() => {
    return signals
      .filter((s) => !dismissedIds.has(s.id))
      .map((signal) => {
        const account = accounts.find((a) => a.id === signal.account_id);
        const warmPath = warmPaths.find((wp) => wp.account_id === signal.account_id);

        // Target: contact at this account with highest warmth_score
        const accountContacts = contacts
          .filter((c) => c.account_id === signal.account_id)
          .sort((a, b) => b.warmth_score - a.warmth_score);
        const targetContact = accountContacts[0];

        // Connector: from warm path recommended_intro_person or path_nodes middle node
        let connectorName = "";
        let connectorSubtitle = "";
        if (warmPath) {
          connectorName = warmPath.recommended_intro_person || "";
          // Try to derive subtitle from path_nodes (middle nodes)
          const midNodes = warmPath.path_nodes.filter((n) => n.type !== "contact");
          if (midNodes.length > 0 && midNodes[0]) {
            connectorSubtitle = midNodes[0].name !== connectorName ? midNodes[0].name : "";
          }
        }

        const warmthScore = warmPath?.warmth_score ?? signal.urgency_score;

        return {
          signal,
          account,
          warmPath,
          targetContact,
          connectorName,
          connectorSubtitle,
          warmthScore,
        };
      });
  }, [signals, accounts, contacts, warmPaths, dismissedIds]);

  // Apply all filters
  const visibleSignals = useMemo(() => {
    return enrichedSignals.filter((e) => {
      if (fundingChipActive && e.signal.type !== "funding") return false;
      if (signalTypeFilter !== "all" && e.signal.type !== signalTypeFilter) return false;
      if (icpTierFilter !== "all") {
        const fit = e.account?.fit_score ?? 0;
        if (icpTierFilter === "tier1" && fit < 80) return false;
        if (icpTierFilter === "tier2" && (fit < 60 || fit >= 80)) return false;
        if (icpTierFilter === "tier3" && fit >= 60) return false;
      }
      if (warmthFilter !== "all") {
        const w = e.warmthScore ?? 0;
        if (warmthFilter === "hot" && w < 80) return false;
        if (warmthFilter === "warm" && (w < 50 || w >= 80)) return false;
        if (warmthFilter === "cool" && w >= 50) return false;
      }
      return true;
    });
  }, [enrichedSignals, fundingChipActive, signalTypeFilter, icpTierFilter, warmthFilter]);

  function commitDismiss(id: string, reason: string) {
    setDismissedIds((prev) => new Set([...prev, id]));
    setDismissReasons((prev) => ({ ...prev, [id]: reason }));
    setPendingDismissId(null);
    toast.success("Signal dismissed", {
      description: `Reason: ${reason}. Used to retrain urgency scoring.`,
      action: {
        label: "Undo",
        onClick: () => {
          setDismissedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setDismissReasons((prev) => {
            const { [id]: _, ...rest } = prev;
            return rest;
          });
        },
      },
    });
  }

  function handleDismiss(id: string) {
    setPendingDismissId(id);
  }

  function handleDraftIntro(companyName: string) {
    toast.success(`Drafting intro for ${companyName}`);
    router.push("/approval-queue");
  }

  const liveCount = visibleSignals.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: T.bg,
      }}
    >
      {/* ── Sticky toolbar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backgroundColor: "rgba(9,9,11,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${T.border}`,
          padding: "16px 24px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: T.white,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              Live Buying Signals
            </h1>
            <p
              style={{
                fontSize: 13,
                color: T.muted,
                margin: "4px 0 0 0",
                lineHeight: 1.5,
              }}
            >
              Monitoring {(accounts.length * 12 + 240).toLocaleString()} target accounts across your
              network.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: T.muted,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: T.emerald,
                  display: "inline-block",
                  boxShadow: `0 0 6px ${T.emerald}`,
                  animation: "pulse 2s infinite",
                }}
              />
              {liveCount} live · Sorted by Relevance
            </span>
            <button
              type="button"
              disabled={fetching}
              onClick={fetchLiveSignals}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 12px",
                height: 34,
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                backgroundColor: "transparent",
                color: fetching ? T.muted : T.white,
                cursor: fetching ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 500,
              }}
              title="Fetch live funding & news signals"
            >
              <RefreshCw style={{ width: 13, height: 13, animation: fetching ? "spin 1s linear infinite" : undefined }} />
              {fetching ? "Fetching…" : "Fetch Signals"}
            </button>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                backgroundColor: "transparent",
                color: T.muted,
                cursor: "pointer",
              }}
              title="Filter"
            >
              <Filter style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        {/* Filter chips row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          <select
            value={signalTypeFilter}
            onChange={(e) => setSignalTypeFilter(e.target.value)}
            style={{
              height: 32,
              padding: "0 28px 0 12px",
              borderRadius: 9999,
              border:
                signalTypeFilter !== "all"
                  ? `1px solid rgba(79,70,229,0.6)`
                  : `1px solid ${T.border}`,
              backgroundColor: signalTypeFilter !== "all" ? "rgba(79,70,229,0.12)" : "transparent",
              color: signalTypeFilter !== "all" ? "#818cf8" : T.muted,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              appearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              flexShrink: 0,
            }}
          >
            <option value="all">Signal type: All</option>
            {availableSignalTypes.map((t) => (
              <option key={t} value={t}>
                Signal type: {t}
              </option>
            ))}
          </select>
          <select
            value={icpTierFilter}
            onChange={(e) => setIcpTierFilter(e.target.value)}
            style={{
              height: 32,
              padding: "0 28px 0 12px",
              borderRadius: 9999,
              border:
                icpTierFilter !== "all" ? `1px solid rgba(79,70,229,0.6)` : `1px solid ${T.border}`,
              backgroundColor: icpTierFilter !== "all" ? "rgba(79,70,229,0.12)" : "transparent",
              color: icpTierFilter !== "all" ? "#818cf8" : T.muted,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              appearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              flexShrink: 0,
            }}
          >
            <option value="all">ICP tier: All</option>
            <option value="tier1">ICP tier: 1 (fit ≥ 80)</option>
            <option value="tier2">ICP tier: 2 (fit 60–79)</option>
            <option value="tier3">ICP tier: 3 (fit &lt; 60)</option>
          </select>
          <select
            value={warmthFilter}
            onChange={(e) => setWarmthFilter(e.target.value)}
            style={{
              height: 32,
              padding: "0 28px 0 12px",
              borderRadius: 9999,
              border:
                warmthFilter !== "all" ? `1px solid rgba(79,70,229,0.6)` : `1px solid ${T.border}`,
              backgroundColor: warmthFilter !== "all" ? "rgba(79,70,229,0.12)" : "transparent",
              color: warmthFilter !== "all" ? "#818cf8" : T.muted,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              appearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              flexShrink: 0,
            }}
          >
            <option value="all">Warmth: All</option>
            <option value="hot">Warmth: Hot (80+)</option>
            <option value="warm">Warmth: Warm (50–79)</option>
            <option value="cool">Warmth: Cool (&lt; 50)</option>
          </select>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: T.border,
              flexShrink: 0,
              margin: "0 2px",
            }}
          />

          {/* Active "Funding Events" chip — only when funding signals exist */}
          {hasFundingSignals && (
            <FilterChip
              label="Funding Events"
              active={fundingChipActive}
              removable={fundingChipActive}
              onClick={() => setFundingChipActive((v) => !v)}
              onRemove={() => setFundingChipActive(false)}
            />
          )}
        </div>
      </div>

      {/* ── Feed canvas ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 24,
        }}
      >
        {visibleSignals.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 300,
              gap: 12,
              color: T.muted,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              📡
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.white, margin: 0 }}>
              No signals right now
            </p>
            <p style={{ fontSize: 13, color: T.muted, margin: 0, textAlign: "center" }}>
              {fundingChipActive
                ? "No funding signals in your pipeline. Remove the filter to see all signals."
                : "All signals have been dismissed. Connect integrations to unlock real-time data."}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 520px), 1fr))",
              gap: 24,
              maxWidth: 1600,
              margin: "0 auto",
            }}
          >
            {visibleSignals.map(
              ({
                signal,
                account,
                warmPath,
                targetContact,
                connectorName,
                connectorSubtitle,
                warmthScore,
              }) => {
                const companyName = account?.name ?? "Unknown";
                const companyInitial = companyName[0]?.toUpperCase() ?? "?";
                const industry = account?.industry ?? "Enterprise";
                const opportunityScore = account?.opportunity_score ?? 50;

                // Connector display
                const displayConnectorName =
                  connectorName || (warmPath?.path_nodes?.[1]?.name ?? "Network");
                const displayConnectorInitials = getInitials(displayConnectorName);
                // Subtitle: try to infer from path or recommended channel
                const displayConnectorSubtitle =
                  connectorSubtitle ||
                  (warmPath?.recommended_channel === "linkedin"
                    ? "via LinkedIn"
                    : warmPath?.recommended_channel === "email"
                      ? "via Email"
                      : "");

                // Target contact details
                const targetName = targetContact?.name ?? account?.name ?? "Target";
                const targetTitle = targetContact?.title ?? "Decision Maker";

                // Extract ICP relevance reason embedded as "💡 ..." in description
                const icpMatch = signal.description?.match(/💡\s*(.+)$/s);
                const icpRelevanceReason = icpMatch ? icpMatch[1].trim() : undefined;

                return (
                  <SignalCard
                    key={signal.id}
                    signalId={signal.id}
                    companyName={companyName}
                    companyInitial={companyInitial}
                    signalTitle={signal.title}
                    signalType={signal.type}
                    industry={industry}
                    opportunityScore={opportunityScore}
                    detectedAt={signal.detected_at}
                    warmthScore={warmthScore}
                    icpRelevanceReason={icpRelevanceReason}
                    connectorName={displayConnectorName}
                    connectorInitials={displayConnectorInitials}
                    connectorSubtitle={displayConnectorSubtitle}
                    targetName={targetName}
                    targetTitle={targetTitle}
                    isDismissed={dismissedIds.has(signal.id)}
                    onDismiss={handleDismiss}
                    onDraftIntro={handleDraftIntro}
                  />
                );
              },
            )}
          </div>
        )}
      </div>

      {/* Dismiss-reason modal */}
      {pendingDismissId && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: lightweight modal backdrop
        // biome-ignore lint/a11y/noStaticElementInteractions: dismiss reason modal backdrop
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setPendingDismissId(null)}
        >
          <div
            // biome-ignore lint/a11y/useKeyWithClickEvents: inner container stops propagation
            // biome-ignore lint/a11y/noStaticElementInteractions: inner container stops propagation
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              maxWidth: "90vw",
              backgroundColor: "var(--card)",
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <p
              style={{ fontSize: 14, fontWeight: 600, color: T.white, margin: 0, marginBottom: 6 }}
            >
              Why are you dismissing this signal?
            </p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0, marginBottom: 16 }}>
              Your answer trains the urgency model so we surface fewer like it.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Not in ICP",
                "Wrong contact / persona",
                "Bad timing — revisit later",
                "Already in pipeline",
                "Low-confidence signal",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => commitDismiss(pendingDismissId, reason)}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: 13,
                    color: T.white,
                    backgroundColor: "transparent",
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPendingDismissId(null)}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "6px 12px",
                fontSize: 12,
                color: T.muted,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pulse keyframe via style tag */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
