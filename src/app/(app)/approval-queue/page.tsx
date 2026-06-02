"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  GitFork,
  Info,
  MoreVertical,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, getInitials } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { GeneratedMessage } from "@/types";

// ─── Message Quality Scorer ───────────────────────────────────────────────────

function scoreMessage(msg: GeneratedMessage) {
  const personalization = Math.min(
    100,
    (msg.personalization_reason ? 40 : 0) +
      (msg.factual_claims?.length ?? 0) * 15 +
      (msg.supporting_sources?.length ?? 0) * 10,
  );

  const wordCount = msg.body?.split(/\s+/).filter(Boolean).length ?? 0;
  const isEmail = msg.channel === "email";
  const optimalMin = isEmail ? 75 : 50;
  const optimalMax = isEmail ? 125 : 80;
  const clarity =
    wordCount >= optimalMin && wordCount <= optimalMax
      ? 90
      : wordCount < optimalMin
        ? Math.max(40, 90 - (optimalMin - wordCount) * 2)
        : Math.max(40, 90 - (wordCount - optimalMax) * 1.5);

  const hasQuestion = msg.body?.includes("?") ?? false;
  const hasCTA =
    /15 min|30 min|this week|thursday|friday|tuesday|wednesday|monday|call|chat|meet/i.test(
      msg.body ?? "",
    );
  const ctaStrength = hasQuestion && hasCTA ? 88 : hasQuestion ? 70 : hasCTA ? 65 : 45;

  const toneMatch =
    msg.channel === "warm_intro" ? 92 : /dear|sincerely|formally/i.test(msg.body ?? "") ? 55 : 82;

  const lengthScore =
    wordCount >= optimalMin && wordCount <= optimalMax
      ? 95
      : Math.max(30, 95 - Math.abs(wordCount - (optimalMin + optimalMax) / 2) * 2);

  const overall = Math.round(
    (personalization + clarity + ctaStrength + toneMatch + lengthScore) / 5,
  );
  return { personalization, clarity, ctaStrength, toneMatch, lengthScore, overall, wordCount };
}

function qualityColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function qualityBadgeClass(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

function QualityScorer({ message }: { message: GeneratedMessage }) {
  const q = useMemo(() => scoreMessage(message), [message]);

  const dimensions = [
    { label: "Personalization", score: Math.round(q.personalization) },
    { label: "Clarity", score: Math.round(q.clarity) },
    { label: "CTA Strength", score: Math.round(q.ctaStrength) },
    { label: "Tone Match", score: Math.round(q.toneMatch) },
    { label: "Length", score: Math.round(q.lengthScore) },
  ];

  const weakest = dimensions.slice().sort((a, b) => a.score - b.score)[0];

  const tips: Record<string, string> = {
    Personalization:
      "Add the contact's name or a recent company milestone to boost personalization.",
    Clarity: "Keep sentences under 20 words. Use short, punchy phrases.",
    "CTA Strength": 'End with a concrete ask: "Worth 15 minutes this Thursday?"',
    "Tone Match": "Adjust formality to match the contact's seniority level.",
    Length: `Aim for ${message.channel === "email" ? "75–125" : "50–80"} words for ${message.channel} messages.`,
  };

  return (
    <div
      className="rounded-lg border flex flex-col gap-3 p-4"
      style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Message Quality
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {q.wordCount} words
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded border ${qualityBadgeClass(q.overall)}`}
          >
            {q.overall}/100
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {dimensions.map((dim) => (
          <div key={dim.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                {dim.label}
              </span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: qualityColor(dim.score) }}
              >
                {dim.score}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${dim.score}%`, backgroundColor: qualityColor(dim.score) }}
              />
            </div>
          </div>
        ))}
      </div>

      {weakest.score < 80 && (
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: "rgba(245,158,11,0.2)", backgroundColor: "rgba(245,158,11,0.05)" }}
        >
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                Tip ({weakest.label}):{" "}
              </span>
              {tips[weakest.label]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Research Card ─────────────────────────────────────────────────────────────

function ResearchCard({ message }: { message: GeneratedMessage }) {
  const claims = (message.factual_claims ?? []).slice(0, 3);
  const sources = (message.supporting_sources ?? []).slice(0, 2);
  const hasContent = !!message.personalization_reason || claims.length > 0;

  return (
    <div
      className="rounded-lg border flex flex-col gap-3 p-4"
      style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Personalization Hooks
        </span>
        <span
          className="text-[10px] ml-auto px-2 py-0.5 rounded border"
          style={{
            backgroundColor: "rgba(245,158,11,0.08)",
            color: "#f59e0b",
            borderColor: "rgba(245,158,11,0.2)",
          }}
        >
          Verify before approving
        </span>
      </div>

      {!hasContent ? (
        <p className="text-[11px] italic" style={{ color: "var(--muted-foreground)" }}>
          No research hooks — add specifics to increase reply rate.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {message.personalization_reason && (
            <div
              className="flex items-start gap-2 rounded-lg border p-3"
              style={{
                borderColor: "rgba(59,130,246,0.2)",
                backgroundColor: "rgba(59,130,246,0.05)",
              }}
            >
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-300 leading-relaxed">
                {message.personalization_reason}
              </p>
            </div>
          )}

          {claims.map((claim) => (
            <div
              key={claim}
              className="flex items-start gap-2 rounded-lg border p-3"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {claim}
                </p>
                <span className="text-[10px] text-emerald-500 font-medium">Verified</span>
              </div>
            </div>
          ))}

          {sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {sources.map((source) => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px]"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--background)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {source}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p
        className="text-[10px] border-t pt-2"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        Messages with 2+ specific hooks get 2.4× more replies
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWarmthScore(message: GeneratedMessage) {
  return message.warm_path?.warmth_score ?? message.contact?.warmth_score ?? 0;
}

function getConnectorName(message: GeneratedMessage): string {
  return message.warm_path?.recommended_intro_person ?? "Direct Outreach";
}

// Synthetic SLA: drafts expire 48h after they enter the queue.
// We don't have a real created_at on demo messages, so derive a stable
// "hours remaining" from the message id hash.
function expiresInHours(msgId: string): number {
  let hash = 0;
  for (let i = 0; i < msgId.length; i++) {
    hash = (hash * 31 + msgId.charCodeAt(i)) | 0;
  }
  return 2 + (Math.abs(hash) % 47);
}

function slaTone(hours: number): { label: string; cls: string; urgent: boolean } {
  if (hours <= 6)
    return {
      label: `${hours}h left`,
      cls: "text-red-400 bg-red-500/10 border-red-500/30",
      urgent: true,
    };
  if (hours <= 12)
    return {
      label: `${hours}h left`,
      cls: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      urgent: false,
    };
  if (hours <= 24)
    return {
      label: `${hours}h left`,
      cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
      urgent: false,
    };
  return {
    label: `${hours}h left`,
    cls: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
    urgent: false,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalQueuePage() {
  const { messages, loading, approveMessage, rejectMessage, regenerateMessage, generatingIds } =
    useSalesStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [filterRep, setFilterRep] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterWarmthMin, setFilterWarmthMin] = useState(0);
  const [filterSlaHours, setFilterSlaHours] = useState<string>("all");
  const [noteDismissed, setNoteDismissed] = useState(false);
  // Collapse state for groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Discard reason modal
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  // Save state
  const [saveState, setSaveState] = useState<"idle" | "unsaved" | "saved">("idle");
  // AI rewrite
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const allPending = useMemo(
    () => messages.filter((m) => m.approval_status === "pending"),
    [messages],
  );

  const repOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allPending
            .map((m) => m.warm_path?.recommended_intro_person)
            .filter((x): x is string => !!x),
        ),
      ),
    [allPending],
  );
  const accountOptions = useMemo(
    () =>
      Array.from(new Set(allPending.map((m) => m.account?.name).filter((x): x is string => !!x))),
    [allPending],
  );
  const channelOptions = useMemo(
    () => Array.from(new Set(allPending.map((m) => m.channel))),
    [allPending],
  );

  const pendingMessages = useMemo(
    () =>
      allPending
        .filter((m) => filterRep === "all" || m.warm_path?.recommended_intro_person === filterRep)
        .filter((m) => filterAccount === "all" || m.account?.name === filterAccount)
        .filter((m) => filterChannel === "all" || m.channel === filterChannel)
        .filter((m) => filterWarmthMin === 0 || getWarmthScore(m) >= filterWarmthMin)
        .filter((m) => {
          if (filterSlaHours === "all") return true;
          const h = expiresInHours(m.id);
          if (filterSlaHours === "6") return h <= 6;
          if (filterSlaHours === "12") return h <= 12;
          if (filterSlaHours === "24") return h <= 24;
          return true;
        })
        .sort((a, b) => {
          const ha = expiresInHours(a.id);
          const hb = expiresInHours(b.id);
          if (ha !== hb) return ha - hb;
          return getWarmthScore(b) - getWarmthScore(a);
        }),
    [allPending, filterRep, filterAccount, filterChannel, filterWarmthMin, filterSlaHours],
  );

  const selectedMessage =
    pendingMessages.find((m) => m.id === selectedId) ?? pendingMessages[0] ?? null;

  // Sync edit states when selected message changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset only on id change
  useEffect(() => {
    if (!selectedMessage) {
      setEditedBody("");
      setEditedSubject("");
      setSaveState("idle");
      return;
    }
    setEditedBody(selectedMessage.body ?? "");
    setEditedSubject(selectedMessage.subject ?? "Warm intro request");
    setSaveState("idle");
    setAiPromptOpen(false);
    setAiPrompt("");
  }, [selectedMessage?.id]);

  // Group pending messages by connector
  const groups = useMemo(() => {
    const map = new Map<string, GeneratedMessage[]>();
    for (const msg of pendingMessages) {
      const connector = getConnectorName(msg);
      const existing = map.get(connector) ?? [];
      map.set(connector, [...existing, msg]);
    }
    return map;
  }, [pendingMessages]);

  function handleSelect(id: string) {
    setSelectedId(id);
  }

  function advanceSelection(removedId: string) {
    const remaining = pendingMessages.filter((m) => m.id !== removedId);
    if (remaining.length > 0) {
      const currentIndex = pendingMessages.findIndex((m) => m.id === removedId);
      const next = remaining[Math.min(currentIndex, remaining.length - 1)];
      setSelectedId(next.id);
    } else {
      setSelectedId(null);
    }
  }

  function handleApprove() {
    if (!selectedMessage) return;
    approveMessage(selectedMessage.id, editedBody);
    toast.success(`Approved & sent via ${getConnectorName(selectedMessage)}`);
    advanceSelection(selectedMessage.id);
  }

  function handleDiscard() {
    setDiscardReason("");
    setDiscardModalOpen(true);
  }

  function handleDiscardConfirm() {
    if (!selectedMessage) return;
    const msgId = selectedMessage.id;
    const msgContact = selectedMessage.contact?.name ?? "contact";
    setDiscardModalOpen(false);
    rejectMessage(msgId);
    advanceSelection(msgId);
    toast.info(`Draft for ${msgContact} discarded${discardReason ? ` — ${discardReason}` : ""}`, {
      action: {
        label: "Undo",
        onClick: () => toast.info("Undo not available in demo mode"),
      },
      duration: 5000,
    });
  }

  function handleRegenerate() {
    if (!selectedMessage) return;
    if (regenerateMessage) {
      regenerateMessage(selectedMessage.id);
    } else {
      toast.info("Regenerating tone...");
    }
  }

  function handleReroute() {
    if (!selectedMessage) return;
    const paths = ["Sarah Chen → Elena Rodriguez", "Marcus Williams → David Park"];
    const nextPath = paths[Math.floor(Math.random() * paths.length)];
    toast.info(`Re-routing via ${nextPath}…`, {
      action: {
        label: "Confirm",
        onClick: () => toast.success(`Re-routed via ${nextPath}`),
      },
    });
  }

  function handleGroupApprove(connectorName: string) {
    const groupMsgs = groups.get(connectorName) ?? [];
    for (const msg of groupMsgs) approveMessage(msg.id, msg.body ?? "");
    toast.success(
      `${groupMsgs.length} draft${groupMsgs.length > 1 ? "s" : ""} approved via ${connectorName}`,
    );
    const remaining = pendingMessages.filter((m) => !groupMsgs.some((g) => g.id === m.id));
    if (remaining.length > 0) setSelectedId(remaining[0].id);
    else setSelectedId(null);
  }

  function toggleGroupCollapse(connectorName: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(connectorName)) next.delete(connectorName);
      else next.add(connectorName);
      return next;
    });
  }

  function handleSaveDraft() {
    setSaveState("saved");
    toast.success("Draft saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }

  function handleAiRewrite() {
    if (!aiPrompt.trim() || !selectedMessage) return;
    setAiLoading(true);
    setTimeout(() => {
      const instruction = aiPrompt.toLowerCase();
      let newBody = editedBody;
      if (instruction.includes("shorter") || instruction.includes("shorten")) {
        const sentences = editedBody.split(/[.!?]+/).filter(Boolean);
        newBody =
          sentences.slice(0, Math.max(2, Math.floor(sentences.length * 0.6))).join(". ") + ".";
      } else if (instruction.includes("formal") || instruction.includes("professional")) {
        newBody = editedBody
          .replace(/hi |hey /gi, "Dear ")
          .replace(/\bwant to\b/gi, "would like to")
          .replace(/\bthanks\b/gi, "Thank you");
      } else if (instruction.includes("casual") || instruction.includes("friendly")) {
        newBody = editedBody.replace(/Dear /gi, "Hey ").replace(/would like to/gi, "want to");
      } else {
        newBody = editedBody + `\n\n[Rewritten per instruction: ${aiPrompt}]`;
      }
      setEditedBody(newBody);
      setSaveState("unsaved");
      setAiLoading(false);
      setAiPrompt("");
      setAiPromptOpen(false);
      toast.success("Message rewritten by AI");
    }, 1200);
  }

  if (!loading && pendingMessages.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <EmptyState
          variant="done"
          title="Approval queue is clear"
          description="New AI drafts will appear here when signal-driven outreach is ready for review."
        />
      </div>
    );
  }

  const connector = selectedMessage ? getConnectorName(selectedMessage) : "";
  const warmthScore = selectedMessage ? getWarmthScore(selectedMessage) : 0;
  const isDirectOutreachSelected = connector === "Direct Outreach";

  return (
    <main className="flex-1 flex h-full relative" style={{ backgroundColor: "var(--background)" }}>
      {/* ── Left Pane: Queue List (35%, max 400px) ── */}
      <div
        className="w-[35%] min-w-[320px] max-w-[400px] border-r flex flex-col"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
      >
        {/* Queue Header */}
        <div className="border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="h-12 flex items-center justify-between px-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Pending Intros
              <span
                className="ml-2 text-xs font-normal"
                style={{ color: "var(--muted-foreground)" }}
              >
                {pendingMessages.length} of {allPending.length}
              </span>
            </h2>
            <button
              type="button"
              className="p-1.5 rounded transition-colors"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Filters — row 1 */}
          <div className="px-3 pb-1.5 flex gap-1.5">
            <select
              value={filterRep}
              onChange={(e) => setFilterRep(e.target.value)}
              className="flex-1 h-7 rounded px-2 text-[11px] border bg-transparent outline-none"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
                backgroundColor: "var(--background)",
              }}
              title="Filter by rep / connector"
            >
              <option value="all">All connectors</option>
              {repOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="flex-1 h-7 rounded px-2 text-[11px] border bg-transparent outline-none"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
                backgroundColor: "var(--background)",
              }}
              title="Filter by account"
            >
              <option value="all">All accounts</option>
              {accountOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="w-24 h-7 rounded px-2 text-[11px] border bg-transparent outline-none"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
                backgroundColor: "var(--background)",
              }}
              title="Filter by channel"
            >
              <option value="all">Channel</option>
              {channelOptions.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          {/* Filters — row 2: warmth + SLA */}
          <div className="px-3 pb-3 flex gap-1.5 items-center">
            <div
              className="flex-1 flex items-center gap-2 border rounded h-7 px-2"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
            >
              <Flame className="w-3 h-3 shrink-0" style={{ color: "#10b981" }} />
              <input
                type="range"
                min={0}
                max={90}
                step={10}
                value={filterWarmthMin}
                onChange={(e) => setFilterWarmthMin(+e.target.value)}
                className="flex-1 h-1 cursor-pointer"
                style={{ accentColor: "#10b981" }}
                title={`Min warmth: ${filterWarmthMin}`}
              />
              <span
                className="text-[10px] tabular-nums w-6 text-right"
                style={{ color: "var(--muted-foreground)" }}
              >
                {filterWarmthMin > 0 ? `${filterWarmthMin}+` : "All"}
              </span>
            </div>
            <select
              value={filterSlaHours}
              onChange={(e) => setFilterSlaHours(e.target.value)}
              className="w-28 h-7 rounded px-2 text-[11px] border bg-transparent outline-none"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
                backgroundColor: "var(--background)",
              }}
              title="Filter by SLA urgency"
            >
              <option value="all">All SLA</option>
              <option value="6">Expires &lt;6h</option>
              <option value="12">Expires &lt;12h</option>
              <option value="24">Expires &lt;24h</option>
            </select>
          </div>

          {/* Info note */}
          {!noteDismissed && (
            <div
              className="mx-3 mb-3 flex items-start gap-2 rounded-md border p-2.5"
              style={{
                backgroundColor: "rgba(59,130,246,0.06)",
                borderColor: "rgba(59,130,246,0.25)",
              }}
            >
              <Info className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
              <p
                className="text-[10.5px] leading-relaxed flex-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                The queue populates automatically once signal detection runs — every entry has been
                AI-drafted from a verified buying signal and a warm relationship path.
              </p>
              <button
                type="button"
                onClick={() => setNoteDismissed(true)}
                className="text-zinc-500 hover:text-zinc-300"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Queue Scrollable List */}
        <div className="flex-1 overflow-y-auto">
          {pendingMessages.length === 0 ? (
            <div className="px-4 py-16">
              <EmptyState
                variant="no-results"
                title="No pending drafts"
                description="All caught up."
              />
            </div>
          ) : (
            Array.from(groups.entries()).map(([connectorName, groupMessages]) => {
              const isDirectOutreach = connectorName === "Direct Outreach";
              const isCollapsed = collapsedGroups.has(connectorName);
              return (
                <div key={connectorName}>
                  {/* Group Header (sticky) */}
                  <div
                    className="px-3 py-2 border-b sticky top-0 z-10 flex items-center gap-2"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapse(connectorName)}
                      className="flex items-center gap-1.5 flex-1 min-w-0"
                    >
                      {isCollapsed ? (
                        <ChevronRight
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      ) : (
                        <ChevronDown
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      )}
                      {isDirectOutreach ? (
                        <ArrowRight
                          className="w-3 h-3 shrink-0"
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      ) : null}
                      <span
                        className="text-[11px] font-semibold truncate uppercase tracking-wider"
                        style={{
                          color: isDirectOutreach ? "var(--muted-foreground)" : "var(--foreground)",
                        }}
                      >
                        {isDirectOutreach ? "Direct Outreach" : `Via ${connectorName}`}
                      </span>
                      <span
                        className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--border)",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {groupMessages.length}
                      </span>
                    </button>
                    {!isDirectOutreach && !isCollapsed && (
                      <button
                        type="button"
                        onClick={() => handleGroupApprove(connectorName)}
                        className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded transition-colors"
                        style={{
                          backgroundColor: "rgba(16,185,129,0.1)",
                          color: "#10b981",
                          border: "1px solid rgba(16,185,129,0.2)",
                        }}
                        title={`Approve all ${groupMessages.length} drafts via ${connectorName}`}
                      >
                        Approve all
                      </button>
                    )}
                  </div>

                  {/* Group Items */}
                  {!isCollapsed &&
                    groupMessages.map((msg) => {
                      const isSelected = selectedMessage?.id === msg.id;
                      const ws = getWarmthScore(msg);
                      const contextTag = msg.warm_path?.path_explanation
                        ?.split(" ")
                        .slice(0, 3)
                        .join(" ");
                      const hoursLeft = expiresInHours(msg.id);
                      const sla = slaTone(hoursLeft);

                      return (
                        <button
                          key={msg.id}
                          type="button"
                          onClick={() => handleSelect(msg.id)}
                          className={cn(
                            "w-full text-left p-4 border-b cursor-pointer transition-colors",
                            isSelected
                              ? "border-l-[4px] border-l-blue-500"
                              : "border-l-4 border-l-transparent hover:border-l-muted",
                          )}
                          style={{
                            borderBottomColor: "var(--border)",
                            backgroundColor: isSelected ? "var(--card)" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "var(--card)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h3
                              className="font-semibold text-sm"
                              style={{ color: "var(--foreground)" }}
                            >
                              {msg.contact?.name ?? "Unknown Contact"}
                            </h3>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 border px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0",
                                sla.cls,
                                sla.urgent && "animate-pulse",
                              )}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {sla.label}
                            </span>
                          </div>
                          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                            {msg.contact?.title ?? "Prospect"}
                            {msg.account?.name ? ` at ${msg.account.name}` : ""}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isDirectOutreach ? (
                              <span
                                className="border px-2 py-0.5 rounded text-xs flex items-center gap-1"
                                style={{ borderColor: "rgba(99,102,241,0.3)", color: "#818cf8" }}
                              >
                                <ArrowRight className="w-3 h-3" />
                                Direct
                              </span>
                            ) : ws > 0 ? (
                              <span
                                className="border px-2 py-0.5 rounded text-xs flex items-center gap-1"
                                style={{ borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}
                              >
                                <Flame className="w-3 h-3" />
                                {ws} Warmth
                              </span>
                            ) : null}
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] capitalize"
                              style={{
                                backgroundColor: "var(--border)",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              {msg.channel.replace("_", " ")}
                            </span>
                            {contextTag && !isDirectOutreach && (
                              <span
                                className="px-2 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: "var(--border)",
                                  color: "var(--muted-foreground)",
                                }}
                              >
                                {contextTag}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Pane: Review Dashboard (flex-1) ── */}
      <div
        className="flex-1 flex flex-col overflow-y-auto"
        style={{ backgroundColor: "var(--background)" }}
      >
        {/* Sticky TopAppBar */}
        <div
          className="h-12 border-b flex items-center justify-between px-6 sticky top-0 z-20"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
        >
          <div className="flex items-center gap-4">
            {selectedMessage ? (
              <>
                <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Review Request: {selectedMessage.contact?.name}
                </h2>
                <span
                  className="border px-2 py-0.5 rounded text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                >
                  ID: REQ-{selectedMessage.id.slice(0, 6).toUpperCase()}
                </span>
              </>
            ) : (
              <h2 className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
                Select a draft to review
              </h2>
            )}
          </div>
          {selectedMessage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="h-8 px-3 border rounded text-xs flex items-center gap-1.5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--card)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <HistoryIcon className="w-3.5 h-3.5" />
                View History
              </button>
              <button
                type="button"
                className="h-8 w-8 border rounded flex items-center justify-center transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--card)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content Canvas */}
        {selectedMessage ? (
          <div className="p-6 max-w-[800px] mx-auto w-full flex flex-col gap-8">
            {/* ── Path Context Banner ── */}
            <div
              className={cn("grid gap-1", isDirectOutreachSelected ? "grid-cols-1" : "grid-cols-3")}
            >
              {/* Target Card */}
              <div
                className={cn(
                  "border rounded-lg p-4 flex flex-col justify-between",
                  isDirectOutreachSelected ? "" : "col-span-2",
                )}
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Target
                    </span>
                    {isDirectOutreachSelected && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: "rgba(99,102,241,0.08)",
                          color: "#818cf8",
                          borderColor: "rgba(99,102,241,0.2)",
                        }}
                      >
                        Direct Outreach — no warm path
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mt-1" style={{ color: "var(--foreground)" }}>
                    {selectedMessage.contact?.name}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                    {selectedMessage.contact?.title}
                    {selectedMessage.account?.name ? ` at ${selectedMessage.account.name}` : ""}
                  </p>
                </div>
                <div className="mt-4">
                  <a
                    href={selectedMessage.contact?.linkedin_url ?? "#"}
                    className="text-xs flex items-center gap-1 transition-colors"
                    style={{ color: "#2563eb" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#2563eb")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    LinkedIn
                  </a>
                </div>
              </div>

              {/* Path Connector Card — only for warm paths */}
              {!isDirectOutreachSelected && (
                <div
                  className="col-span-1 border rounded-lg p-4 flex flex-col justify-between relative overflow-hidden"
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                >
                  <div className="absolute top-2 right-2 opacity-5 pointer-events-none" aria-hidden>
                    <GitFork className="w-16 h-16" style={{ color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <span
                      className="text-xs uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Strongest Path
                    </span>
                    {connector && (
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{
                            backgroundColor: "rgba(79,70,229,0.2)",
                            borderColor: "rgba(79,70,229,0.3)",
                            color: "#818cf8",
                          }}
                        >
                          {getInitials(connector).slice(0, 1)}
                        </div>
                        <span
                          className="font-medium text-sm truncate"
                          style={{ color: "var(--foreground)" }}
                        >
                          {connector}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <span
                      className="text-xs border px-2 py-0.5 rounded flex items-center gap-1 w-fit"
                      style={{ borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}
                    >
                      <Flame className="w-3 h-3" />
                      {warmthScore} Warmth
                    </span>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      {selectedMessage.warm_path?.path_explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Message Editor ── */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <h3
                  className="text-sm font-semibold flex items-center gap-2"
                  style={{ color: "var(--foreground)" }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: "#2563eb" }} />
                  AI Draft Generation
                </h3>
                <div className="flex items-center gap-3">
                  {saveState === "unsaved" && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Unsaved
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="text-xs font-semibold px-2 py-0.5 rounded border transition-colors"
                        style={{ borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b" }}
                      >
                        Save
                      </button>
                    </div>
                  )}
                  {saveState === "saved" && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-500">Saved</span>
                    </div>
                  )}
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Editing as {isDirectOutreachSelected ? "yourself" : connector}
                  </span>
                </div>
              </div>
              <div
                className="border rounded-lg overflow-hidden flex flex-col"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                {/* Formatting Toolbar */}
                <div
                  className="h-10 border-b flex items-center px-2 gap-1"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
                >
                  <ToolbarButton label="B" title="Bold" />
                  <ToolbarButton label="I" title="Italic" italic />
                  <ToolbarButton icon={<ExternalLink className="w-3.5 h-3.5" />} title="Link" />
                  <div className="w-px h-4 mx-1" style={{ backgroundColor: "var(--border)" }} />
                  <ToolbarButton label="•" title="Bullet list" />
                  <ToolbarButton label="1." title="Numbered list" />
                </div>

                {/* Subject Line */}
                <div
                  className="border-b px-4 py-2 flex items-center gap-2"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
                >
                  <span className="text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    Subject:
                  </span>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => {
                      setEditedSubject(e.target.value);
                      setSaveState("unsaved");
                    }}
                    className="flex-1 bg-transparent border-none p-0 text-sm outline-none"
                    style={{ color: "var(--foreground)" }}
                  />
                </div>

                {/* Body Textarea */}
                <div className="p-4 min-h-[200px]" style={{ backgroundColor: "var(--background)" }}>
                  <textarea
                    rows={9}
                    value={editedBody}
                    onChange={(e) => {
                      setEditedBody(e.target.value);
                      setSaveState("unsaved");
                    }}
                    className="w-full bg-transparent border-none p-0 text-sm outline-none resize-none leading-relaxed"
                    style={{ color: "var(--foreground)" }}
                    placeholder="Draft message here..."
                  />
                </div>

                {/* AI Rewrite Panel */}
                <div className="border-t" style={{ borderColor: "var(--border)" }}>
                  {!aiPromptOpen ? (
                    <button
                      type="button"
                      onClick={() => setAiPromptOpen(true)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors"
                      style={{ color: "var(--muted-foreground)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--card)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Sparkles
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: "#2563eb" }}
                      />
                      <span>Rewrite with AI</span>
                      <span className="ml-auto text-[10px] opacity-60">
                        e.g. "make it shorter", "more formal"
                      </span>
                    </button>
                  ) : (
                    <div
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ backgroundColor: "rgba(37,99,235,0.04)" }}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: "#2563eb" }} />
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAiRewrite();
                          if (e.key === "Escape") {
                            setAiPromptOpen(false);
                            setAiPrompt("");
                          }
                        }}
                        placeholder='e.g. "shorten to 3 sentences" or "make more casual"'
                        autoFocus
                        className="flex-1 bg-transparent text-xs outline-none"
                        style={{ color: "var(--foreground)" }}
                      />
                      <button
                        type="button"
                        onClick={handleAiRewrite}
                        disabled={!aiPrompt.trim() || aiLoading}
                        className="w-6 h-6 flex items-center justify-center rounded transition-colors disabled:opacity-40"
                        style={{ backgroundColor: "#2563eb", color: "#fff" }}
                      >
                        {aiLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPromptOpen(false);
                          setAiPrompt("");
                        }}
                        className="w-5 h-5 flex items-center justify-center"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Footer */}
                <div
                  className="px-4 py-2 flex items-center justify-between border-t"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: "#10b981" }}
                    />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      Draft optimized for high response rate
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="text-xs flex items-center gap-1 transition-colors"
                    style={{ color: "#2563eb" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#2563eb")}
                    disabled={generatingIds?.has(selectedMessage.id)}
                  >
                    <RefreshCw
                      className={cn(
                        "w-3 h-3",
                        generatingIds?.has(selectedMessage.id) && "animate-spin",
                      )}
                    />
                    Regenerate Tone
                  </button>
                </div>
              </div>
            </div>

            {/* ── Quality Scorer ── */}
            <QualityScorer message={{ ...selectedMessage, body: editedBody }} />

            {/* ── Research Card ── */}
            <ResearchCard message={selectedMessage} />

            {/* ── Action Console ── */}
            <div
              className="flex items-center justify-between pt-4 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReroute}
                  className="h-8 px-4 border rounded text-xs transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--card)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Re-route Path
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="h-8 px-4 border rounded text-xs transition-colors flex items-center gap-1"
                  style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--muted-foreground)";
                  }}
                >
                  <X className="w-3 h-3" />
                  Discard
                </button>
              </div>
              <button
                type="button"
                onClick={handleApprove}
                className="h-8 px-6 rounded font-semibold text-xs flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: "#10b981",
                  color: "#000",
                  boxShadow: "0 0 16px rgba(16,185,129,0.25)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#34d399")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
              >
                <Check className="w-3.5 h-3.5" />
                Approve &amp; Send via {connector}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              variant="empty"
              title="Select a draft"
              description="Choose a prospect from the queue to review and approve."
            />
          </div>
        )}
      </div>

      {/* Discard Reason Modal */}
      {discardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDiscardModalOpen(false)}
            aria-hidden
          />
          <div
            className="relative rounded-xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>
                Discard this draft?
              </h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Select a reason (optional) — this helps improve signal scoring.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {["Wrong timing", "Not ICP fit", "Already contacted", "Path too weak", "Other"].map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDiscardReason(discardReason === reason ? "" : reason)}
                    className="w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors"
                    style={{
                      borderColor:
                        discardReason === reason ? "rgba(239,68,68,0.4)" : "var(--border)",
                      backgroundColor:
                        discardReason === reason ? "rgba(239,68,68,0.08)" : "transparent",
                      color: discardReason === reason ? "#ef4444" : "var(--foreground)",
                    }}
                  >
                    {reason}
                  </button>
                ),
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscardModalOpen(false)}
                className="flex-1 h-9 border rounded text-sm transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscardConfirm}
                className="flex-1 h-9 rounded font-semibold text-sm transition-colors"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function ToolbarButton({
  label,
  icon,
  title,
  italic,
}: {
  label?: string;
  icon?: React.ReactNode;
  title: string;
  italic?: boolean;
}) {
  return (
    <button
      className="w-7 h-7 flex items-center justify-center rounded text-xs transition-colors"
      style={{ color: "var(--muted-foreground)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--foreground)";
        e.currentTarget.style.backgroundColor = "var(--border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--muted-foreground)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
      title={title}
      type="button"
    >
      {icon ?? <span className={cn("font-medium", italic && "italic")}>{label}</span>}
    </button>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <title>History</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
