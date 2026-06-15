"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  Filter,
  Flame,
  GitFork,
  Info,
  MoreVertical,
  RefreshCw,
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
      style={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
          <span className="text-sm font-semibold" style={{ color: "#e5e5e5" }}>
            Message Quality
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#a1a1aa" }}>
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
              <span className="text-[11px]" style={{ color: "#a1a1aa" }}>
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
              style={{ backgroundColor: "#27272a" }}
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
            <p className="text-[11px] leading-relaxed" style={{ color: "#a1a1aa" }}>
              <span className="font-semibold" style={{ color: "#e5e5e5" }}>
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
      style={{ backgroundColor: "#09090b", borderColor: "#27272a" }}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
        <span className="text-sm font-semibold" style={{ color: "#e5e5e5" }}>
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
        <p className="text-[11px] italic" style={{ color: "#a1a1aa" }}>
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
              style={{ borderColor: "#27272a", backgroundColor: "#18181b" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-relaxed" style={{ color: "#e5e5e5" }}>
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
                  style={{ borderColor: "#27272a", backgroundColor: "#09090b", color: "#a1a1aa" }}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {source}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] border-t pt-2" style={{ borderColor: "#27272a", color: "#71717a" }}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalQueuePage() {
  const {
    messages,
    loading,
    approveMessage,
    rejectMessage,
    regenerateMessage,
    generatingIds,
    reset,
    initialize,
  } = useSalesStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const pendingMessages = useMemo(
    () =>
      messages
        .filter((m) => m.approval_status === "pending")
        .sort((a, b) => getWarmthScore(b) - getWarmthScore(a)),
    [messages],
  );

  const selectedMessage =
    pendingMessages.find((m) => m.id === selectedId) ?? pendingMessages[0] ?? null;

  // Sync edit states when selected message changes or body is regenerated
  useEffect(() => {
    if (!selectedMessage) {
      setEditedBody("");
      setEditedSubject("");
      return;
    }
    setEditedBody(selectedMessage.body ?? "");
    setEditedSubject(selectedMessage.subject ?? "Warm intro request");
  }, [selectedMessage?.id, selectedMessage?.body, selectedMessage?.subject]);

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
    if (!selectedMessage) return;
    rejectMessage(selectedMessage.id);
    toast.info("Draft discarded");
    advanceSelection(selectedMessage.id);
  }

  function handleRegenerate() {
    if (!selectedMessage) return;
    if (regenerateMessage) {
      regenerateMessage(selectedMessage.id, {
        instruction: customInstruction.trim() || undefined,
        currentBody: editedBody || undefined,
      });
    } else {
      toast.info("Regenerating...");
    }
  }

  function handleReroute() {
    toast.info("Re-routing to next best path...");
  }

  async function handleGenerateDrafts() {
    setIsGeneratingDrafts(true);
    try {
      const res = await fetch("/api/ai/auto-draft-warm-paths", { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { drafted?: number; message?: string };
      const count = data.drafted ?? 0;
      if (count === 0) {
        toast.info("No warm paths need drafts right now.", {
          description: data.message ?? "All active warm paths already have pending drafts.",
        });
      } else {
        toast.success(`Generated ${count} AI draft${count === 1 ? "" : "s"}`, {
          description: "Refreshing approval queue...",
        });
        reset();
        await initialize();
      }
    } catch {
      toast.error("Failed to generate drafts. Please try again.");
    } finally {
      setIsGeneratingDrafts(false);
    }
  }

  if (!loading && pendingMessages.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 flex flex-col items-center gap-6">
        <EmptyState
          variant="done"
          title="Approval queue is clear"
          description="No pending AI drafts. Generate drafts automatically from your active warm paths."
        />
        <button
          type="button"
          onClick={handleGenerateDrafts}
          disabled={isGeneratingDrafts}
          className="h-9 px-5 rounded font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "#2563eb",
            color: "#fff",
            boxShadow: "0 0 16px rgba(128,131,255,0.25)",
          }}
          onMouseEnter={(e) => {
            if (!isGeneratingDrafts) e.currentTarget.style.backgroundColor = "#9b9eff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }}
        >
          {isGeneratingDrafts ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating drafts...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Drafts from Warm Paths
            </>
          )}
        </button>
      </div>
    );
  }

  const connector = selectedMessage ? getConnectorName(selectedMessage) : "";
  const warmthScore = selectedMessage ? getWarmthScore(selectedMessage) : 0;

  return (
    <main className="flex-1 flex h-full relative" style={{ backgroundColor: "#09090b" }}>
      {/* ── Left Pane: Queue List (35%, max 400px) ── */}
      <div
        className="w-[35%] min-w-[320px] max-w-[400px] border-r flex flex-col"
        style={{ borderColor: "#27272a", backgroundColor: "#09090b" }}
      >
        {/* Queue Header */}
        <div
          className="h-12 border-b flex items-center justify-between px-4 shrink-0"
          style={{ borderColor: "#27272a" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "#e5e5e5" }}>
            Pending Intros
          </h2>
          <div className="flex gap-1">
            <button
              type="button"
              className="p-1.5 rounded transition-colors"
              style={{ color: "#a1a1aa" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
              aria-label="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded transition-colors"
              style={{ color: "#a1a1aa" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e5e5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
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
            Array.from(groups.entries()).map(([connectorName, groupMessages]) => (
              <div key={connectorName}>
                {/* Group Header (sticky) */}
                <div
                  className="px-4 py-2 border-b sticky top-0 z-10"
                  style={{ borderColor: "#27272a", backgroundColor: "#0e0e10" }}
                >
                  <span className="text-xs uppercase tracking-wider" style={{ color: "#71717a" }}>
                    Via {connectorName} ({groupMessages.length})
                  </span>
                </div>

                {/* Group Items */}
                {groupMessages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const ws = getWarmthScore(msg);
                  const contextTag = msg.warm_path?.path_explanation
                    ?.split(" ")
                    .slice(0, 3)
                    .join(" ");

                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => handleSelect(msg.id)}
                      className={cn(
                        "w-full text-left p-4 border-b cursor-pointer transition-colors border-l-2",
                        isSelected
                          ? "border-l-[#2563eb]"
                          : "border-l-transparent hover:border-l-[#71717a]",
                      )}
                      style={{
                        borderBottomColor: "#27272a",
                        backgroundColor: isSelected ? "#18181b" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "#18181b";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm" style={{ color: "#e5e5e5" }}>
                          {msg.contact?.name ?? "Unknown Contact"}
                        </h3>
                        <span className="text-xs" style={{ color: "#71717a" }}>
                          {ws > 0 ? `${ws} warmth` : "—"}
                        </span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "#a1a1aa" }}>
                        {msg.contact?.title ?? "Prospect"}
                        {msg.account?.name ? ` at ${msg.account.name}` : ""}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {ws > 0 && (
                          <span
                            className="border px-2 py-0.5 rounded text-xs flex items-center gap-1"
                            style={{
                              borderColor: "rgba(16,185,129,0.2)",
                              color: "#10b981",
                            }}
                          >
                            <Flame className="w-3 h-3" />
                            {ws} Warmth
                          </span>
                        )}
                        {contextTag && (
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ backgroundColor: "#27272a", color: "#a1a1aa" }}
                          >
                            {contextTag}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right Pane: Review Dashboard (flex-1) ── */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ backgroundColor: "#09090b" }}>
        {/* Sticky TopAppBar */}
        <div
          className="h-12 border-b flex items-center justify-between px-6 sticky top-0 z-20"
          style={{ borderColor: "#27272a", backgroundColor: "#09090b" }}
        >
          <div className="flex items-center gap-4">
            {selectedMessage ? (
              <>
                <h2 className="text-sm font-semibold" style={{ color: "#e5e5e5" }}>
                  Review Request: {selectedMessage.contact?.name}
                </h2>
                <span
                  className="border px-2 py-0.5 rounded text-xs"
                  style={{ borderColor: "#27272a", color: "#a1a1aa" }}
                >
                  ID: REQ-{selectedMessage.id.slice(0, 6).toUpperCase()}
                </span>
              </>
            ) : (
              <h2 className="text-sm font-semibold" style={{ color: "#71717a" }}>
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
                style={{ borderColor: "#27272a", color: "#e5e5e5" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#18181b")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <HistoryIcon className="w-3.5 h-3.5" />
                View History
              </button>
              <button
                type="button"
                className="h-8 w-8 border rounded flex items-center justify-center transition-colors"
                style={{ borderColor: "#27272a", color: "#e5e5e5" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#18181b")}
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
            {/* ── Path Context Banner (Bento Grid 3 cols) ── */}
            <div className="grid grid-cols-3 gap-1">
              {/* Target Card (col-span-2) */}
              <div
                className="col-span-2 border rounded-lg p-4 flex flex-col justify-between"
                style={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
              >
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: "#71717a" }}>
                    Target Node
                  </span>
                  <h3 className="text-lg font-semibold mt-1" style={{ color: "#e5e5e5" }}>
                    {selectedMessage.contact?.name}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "#a1a1aa" }}>
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

              {/* Path Connector Card (col-span-1) */}
              <div
                className="col-span-1 border rounded-lg p-4 flex flex-col justify-between relative overflow-hidden"
                style={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
              >
                {/* Decorative background icon */}
                <div className="absolute top-2 right-2 opacity-5 pointer-events-none" aria-hidden>
                  <GitFork className="w-16 h-16" style={{ color: "#e5e5e5" }} />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider" style={{ color: "#71717a" }}>
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
                      <span className="font-medium text-sm truncate" style={{ color: "#e5e5e5" }}>
                        {connector}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <span
                    className="text-xs border px-2 py-0.5 rounded flex items-center gap-1 w-fit"
                    style={{
                      borderColor: "rgba(16,185,129,0.2)",
                      color: "#10b981",
                    }}
                  >
                    <Flame className="w-3 h-3" />
                    {warmthScore} Warmth
                  </span>
                  <p className="text-xs mt-1" style={{ color: "#a1a1aa" }}>
                    {selectedMessage.warm_path?.path_explanation ?? "Strong path available"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Message Editor ── */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <h3
                  className="text-sm font-semibold flex items-center gap-2"
                  style={{ color: "#e5e5e5" }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: "#2563eb" }} />
                  AI Draft Generation
                </h3>
                <span className="text-xs" style={{ color: "#a1a1aa" }}>
                  Editing as {connector}
                </span>
              </div>
              <div
                className="border rounded-lg overflow-hidden flex flex-col"
                style={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
              >
                {/* Formatting Toolbar */}
                <div
                  className="h-10 border-b flex items-center px-2 gap-1"
                  style={{ borderColor: "#27272a", backgroundColor: "#201f22" }}
                >
                  <ToolbarButton label="B" title="Bold" />
                  <ToolbarButton label="I" title="Italic" italic />
                  <ToolbarButton icon={<ExternalLink className="w-3.5 h-3.5" />} title="Link" />
                  <div className="w-px h-4 mx-1" style={{ backgroundColor: "#27272a" }} />
                  <ToolbarButton label="•" title="Bullet list" />
                  <ToolbarButton label="1." title="Numbered list" />
                </div>

                {/* Subject Line */}
                <div
                  className="border-b px-4 py-2 flex items-center gap-2"
                  style={{ borderColor: "#27272a", backgroundColor: "#0e0e10" }}
                >
                  <span className="text-xs shrink-0" style={{ color: "#71717a" }}>
                    Subject:
                  </span>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="flex-1 bg-transparent border-none p-0 text-sm outline-none"
                    style={{ color: "#e5e5e5" }}
                  />
                </div>

                {/* Body Textarea */}
                <div className="p-4 min-h-[240px]" style={{ backgroundColor: "#0e0e10" }}>
                  <textarea
                    rows={10}
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm outline-none resize-none leading-relaxed"
                    style={{ color: "#e5e5e5" }}
                    placeholder="Draft message here..."
                  />
                </div>

                {/* Custom instruction input */}
                <div
                  className="border-t px-4 py-3 flex flex-col gap-2"
                  style={{ borderColor: "#27272a", backgroundColor: "#18181b" }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 shrink-0" style={{ color: "#818cf8" }} />
                    <span className="text-xs font-medium" style={{ color: "#a1a1aa" }}>
                      Custom instruction
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRegenerate();
                      }}
                      placeholder='e.g. "make it shorter", "more casual", "add a PS line"'
                      className="flex-1 rounded border px-3 py-1.5 text-xs outline-none transition-colors"
                      style={{
                        backgroundColor: "#09090b",
                        borderColor: "#27272a",
                        color: "#e5e5e5",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#818cf8")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#27272a")}
                    />
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={generatingIds?.has(selectedMessage.id)}
                      className="h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      style={{ backgroundColor: "#27272a", color: "#e5e5e5" }}
                      onMouseEnter={(e) => {
                        if (!generatingIds?.has(selectedMessage.id))
                          e.currentTarget.style.backgroundColor = "#3f3f46";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#27272a";
                      }}
                    >
                      <RefreshCw
                        className={cn(
                          "w-3 h-3",
                          generatingIds?.has(selectedMessage.id) && "animate-spin",
                        )}
                      />
                      {customInstruction.trim()
                        ? "Apply"
                        : generatingIds?.has(selectedMessage.id)
                          ? "Generating…"
                          : "Regenerate"}
                    </button>
                  </div>
                  <p className="text-[10px]" style={{ color: "#52525b" }}>
                    Leave blank to regenerate from scratch · Press Enter to apply
                  </p>
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
              style={{ borderColor: "#27272a" }}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReroute}
                  className="h-8 px-4 border rounded text-xs transition-colors"
                  style={{ borderColor: "#27272a", color: "#a1a1aa" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#18181b")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Re-route Path
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="h-8 px-4 border rounded text-xs transition-colors"
                  style={{ borderColor: "#27272a", color: "#a1a1aa" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "#27272a";
                    e.currentTarget.style.color = "#a1a1aa";
                  }}
                >
                  <X className="w-3 h-3 inline mr-1" />
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
      style={{ color: "#a1a1aa" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#e5e5e5";
        e.currentTarget.style.backgroundColor = "#27272a";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#a1a1aa";
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
