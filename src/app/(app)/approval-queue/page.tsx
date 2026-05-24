"use client";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  Filter,
  Flame,
  GitFork,
  Info,
  Linkedin,
  Mail,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_CONFIG } from "@/lib/constants";
import { cn, formatRelativeTime, getInitials, scoreBgColor, signalTypeLabel } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { GeneratedMessage } from "@/types";

const CHANNEL_TABS = ["all", "email", "linkedin", "warm_intro"] as const;

// ─── Message Quality Scorer (Story 6.1) ──────────────────────────────────────

function scoreMessage(msg: GeneratedMessage) {
  // Personalization: count specific hooks (company name, contact name, signal references)
  const personalization = Math.min(
    100,
    (msg.personalization_reason ? 40 : 0) +
      (msg.factual_claims?.length ?? 0) * 15 +
      (msg.supporting_sources?.length ?? 0) * 10,
  );

  // Clarity: based on body length (75-125 words is optimal for email, 50-80 for LinkedIn)
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

  // CTA Strength: check for question marks, specific asks
  const hasQuestion = msg.body?.includes("?") ?? false;
  const hasCTA =
    /15 min|30 min|this week|thursday|friday|tuesday|wednesday|monday|call|chat|meet/i.test(
      msg.body ?? "",
    );
  const ctaStrength = hasQuestion && hasCTA ? 88 : hasQuestion ? 70 : hasCTA ? 65 : 45;

  // Tone Match: based on seniority in subject line or body
  const toneMatch =
    msg.channel === "warm_intro" ? 92 : /dear|sincerely|formally/i.test(msg.body ?? "") ? 55 : 82;

  // Length score
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
  if (score >= 80) return "#5db872";
  if (score >= 60) return "#e8a55a";
  return "#ef4444";
}

function qualityBadgeClass(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  return "bg-red-500/10 text-red-700 border-red-500/20";
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
    <div className="rounded-2xl border border-[#464554]/60 bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#4edea3]" />
          <span className="text-sm font-semibold">Message Quality</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#c7c4d7]">{q.wordCount} words</span>
          <Badge
            variant="outline"
            className={`text-xs font-bold px-2 py-0.5 ${qualityBadgeClass(q.overall)}`}
          >
            {q.overall}/100
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {dimensions.map((dim) => (
          <div key={dim.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#c7c4d7]">{dim.label}</span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: qualityColor(dim.score) }}
              >
                {dim.score}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${dim.score}%`, backgroundColor: qualityColor(dim.score) }}
              />
            </div>
          </div>
        ))}
      </div>

      {weakest.score < 80 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#c7c4d7] leading-relaxed">
              <span className="font-semibold text-[#e5e1e4]">Tip ({weakest.label}): </span>
              {tips[weakest.label]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Research Card (Story 3.1) ────────────────────────────────────────────────

function ResearchCard({ message }: { message: GeneratedMessage }) {
  const claims = (message.factual_claims ?? []).slice(0, 3);
  const sources = (message.supporting_sources ?? []).slice(0, 2);
  const hasContent = !!message.personalization_reason || claims.length > 0;

  return (
    <div className="rounded-2xl border border-[#464554]/60 bg-background p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#4edea3]" />
        <span className="text-sm font-semibold">Personalization Hooks</span>
        <Badge
          variant="outline"
          className="text-[10px] ml-auto bg-amber-500/8 text-amber-700 border-amber-500/20"
        >
          Verify before approving
        </Badge>
      </div>

      {!hasContent ? (
        <p className="text-[11px] text-[#c7c4d7] italic">
          No research hooks — add specifics to increase reply rate.
        </p>
      ) : (
        <div className="space-y-2">
          {message.personalization_reason && (
            <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 leading-relaxed">
                {message.personalization_reason}
              </p>
            </div>
          )}

          {claims.map((claim) => (
            <div
              key={claim}
              className="flex items-start gap-2 rounded-xl border border-[#464554]/50 bg-muted/20 p-3"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#e5e1e4] leading-relaxed">{claim}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Verified</span>
              </div>
            </div>
          ))}

          {sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {sources.map((source) => (
                <span
                  key={source}
                  className="inline-flex items-center gap-1 rounded-full border border-[#464554]/50 bg-background px-2.5 py-1 text-[10px] text-[#c7c4d7]"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {source}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-[#c7c4d7] border-t border-[#464554]/40 pt-2">
        Messages with 2+ specific hooks get 2.4× more replies
      </p>
    </div>
  );
}

function channelIcon(channel: GeneratedMessage["channel"]) {
  if (channel === "linkedin") return Linkedin;
  if (channel === "warm_intro") return GitFork;
  return Mail;
}

function getWarmthScore(message: GeneratedMessage) {
  return message.warm_path?.warmth_score ?? message.contact?.warmth_score ?? 0;
}

function warmthLabel(score: number) {
  if (score >= 85) return "Very Hot";
  if (score >= 70) return "Hot";
  if (score >= 55) return "Warm";
  return "Cooling";
}

function signalSummary(message: GeneratedMessage) {
  if (message.signal) {
    return [message.signal.title, message.signal.description]
      .filter(Boolean)
      .slice(0, 2) as string[];
  }
  if (message.factual_claims.length > 0) return message.factual_claims.slice(0, 2);
  return ["Relationship path available", "Draft ready for manager review"];
}

function nextBestStep(message: GeneratedMessage) {
  if (message.channel === "linkedin") return "Send connection request with personalized note";
  if (message.channel === "warm_intro") return "Approve intro request and route through connector";
  return "Approve email and queue follow-up sequence";
}

function whyThisProspect(message: GeneratedMessage) {
  return (
    message.personalization_reason ||
    message.signal?.description ||
    message.warm_path?.path_explanation ||
    "Strong account fit with active signal context and a viable warm path."
  );
}

function WarmPathTrail({ message }: { message: GeneratedMessage }) {
  const pathNodes = message.warm_path?.path_nodes ?? [];
  const ChannelIcon = channelIcon(message.channel);

  if (pathNodes.length === 0) {
    return (
      <div className="text-sm text-[#c7c4d7]">
        {CHANNEL_CONFIG[message.channel]?.label ?? message.channel} follow-up path
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {pathNodes.slice(0, 3).map((node, index) => (
          <div key={node.id} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-[#c7c4d7]/40">→</span>}
            <span className="rounded-full border border-[#464554]/60 bg-background px-2.5 py-1 text-xs font-medium">
              {node.name.split(" ")[0]}
            </span>
          </div>
        ))}
        <span className="text-[#c7c4d7]/40">→</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-[#8083ff]/8 px-2.5 py-1 text-xs font-medium text-[#4edea3]">
          <ChannelIcon className="h-3 w-3" />
          {CHANNEL_CONFIG[message.channel]?.label ?? message.channel}
        </span>
      </div>
      <p className="text-xs text-[#c7c4d7]">
        {message.warm_path?.path_explanation ||
          "Best available path ranked by connection strength and recency."}
      </p>
    </div>
  );
}

function QueueRow({
  message,
  selected,
  onSelect,
  onApprove,
  onReject,
}: {
  message: GeneratedMessage;
  selected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const ContactIcon = channelIcon(message.channel);
  const warmthScore = getWarmthScore(message);
  const signals = signalSummary(message);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "grid w-full gap-5 border-b border-[#464554]/50 px-5 py-5 text-left transition-colors last:border-b-0 hover:bg-muted/20 xl:grid-cols-[1.2fr_1fr_1fr_0.5fr_0.5fr]",
        selected && "bg-[#8083ff]/5",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-[#e5e1e4]">
          {getInitials(message.contact?.name ?? "WP")}
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-background bg-background shadow-sm">
            <ContactIcon className="h-3.5 w-3.5 text-[#4edea3]" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">
            {message.contact?.name ?? "Unknown Contact"}
          </p>
          <p className="text-sm text-[#c7c4d7]">{message.contact?.title ?? "Prospect"}</p>
          <Badge
            variant="outline"
            className="mt-1 text-[10px] bg-[#8083ff]/5 text-[#4edea3] border-brand/15 font-normal"
          >
            1:1 for {message.contact?.name?.split(" ")[0] ?? "this prospect"}
          </Badge>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-[#c7c4d7]">
            <Building2 className="h-3.5 w-3.5" />
            <span>{message.account?.name ?? "Unassigned account"}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Buying Signals</p>
        <ul className="space-y-1.5 text-sm text-[#c7c4d7]">
          {signals.map((signal) => (
            <li key={signal} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#8083ff]" />
              <span>{signal}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Warm Path</p>
        <WarmPathTrail message={message} />
        {message.channel === "warm_intro" && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 text-[11px] text-amber-700">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span>
              <span className="font-semibold">
                {message.warm_path?.recommended_intro_person ?? "Connector"}
              </span>{" "}
              must personally approve this intro — never auto-sent
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Warmth Score</p>
        <div className="text-4xl font-bold leading-none">{warmthScore}</div>
        <Badge variant="outline" className={cn("mt-3 border", scoreBgColor(warmthScore))}>
          {warmthLabel(warmthScore)}
        </Badge>
      </div>

      <div className="flex items-start justify-end gap-1">
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onApprove();
          }}
          className="bg-[#8083ff] text-[#4edea3]-foreground hover:bg-[#8083ff]/90"
        >
          Approve
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#c7c4d7] hover:text-red-500 hover:bg-red-500/10 transition-colors"
          onClick={(event) => {
            event.stopPropagation();
            onReject();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ApprovalQueuePage() {
  const { messages, loading, approveMessage, rejectMessage, regenerateMessage, generatingIds } =
    useSalesStore();

  const [activeTab, setActiveTab] = useState<(typeof CHANNEL_TABS)[number]>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const pendingMessages = useMemo(
    () =>
      messages
        .filter((message) => message.approval_status === "pending")
        .sort((a, b) => getWarmthScore(b) - getWarmthScore(a)),
    [messages],
  );

  const filteredMessages = useMemo(() => {
    return pendingMessages.filter((message) => {
      const matchesTab = activeTab === "all" || message.channel === activeTab;
      const haystack = [
        message.contact?.name,
        message.contact?.title,
        message.account?.name,
        message.signal?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [activeTab, pendingMessages, query]);

  const selectedMessage =
    filteredMessages.find((message) => message.id === selectedId) ?? filteredMessages[0] ?? null;

  useEffect(() => {
    if (!selectedMessage) {
      setSelectedId(null);
      setDraftBody("");
      return;
    }

    setSelectedId(selectedMessage.id);
    setDraftBody(selectedMessage.body);
  }, [selectedMessage?.body, selectedMessage?.id]);

  const counts = useMemo(() => {
    return CHANNEL_TABS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab] =
        tab === "all"
          ? pendingMessages.length
          : pendingMessages.filter((message) => message.channel === tab).length;
      return acc;
    }, {});
  }, [pendingMessages]);

  const averageWarmth =
    pendingMessages.length > 0
      ? Math.round(
          pendingMessages.reduce((total, message) => total + getWarmthScore(message), 0) /
            pendingMessages.length,
        )
      : 0;

  const averageConfidence =
    pendingMessages.length > 0
      ? Math.round(
          (pendingMessages.reduce((total, message) => total + message.confidence_score, 0) /
            pendingMessages.length) *
            100,
        )
      : 0;

  const hasWarmIntro = filteredMessages.some((m) => m.channel === "warm_intro");

  async function handleApproveAll() {
    if (filteredMessages.length === 0) return;
    await Promise.all(filteredMessages.map((message) => approveMessage(message.id)));
    toast.success(`Approved ${filteredMessages.length} drafts`);
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

  return (
    <div className="flex h-full overflow-hidden bg-[#131315]">
      {/* Left Pane: Queue List (35%) */}
      <div className="w-[35%] min-w-[320px] max-w-[400px] border-r border-[#464554] bg-[#131315] flex flex-col z-10 overflow-y-auto">
        {/* Queue Header */}
        <div className="h-12 border-b border-[#464554] flex items-center justify-between px-4 shrink-0 bg-[#131315]">
          <h2 className="text-sm font-semibold text-[#e5e1e4]">Pending Intros</h2>
          <div className="flex gap-2">
            <button className="p-1 text-[#c7c4d7] hover:text-[#e5e1e4] transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-1 text-[#c7c4d7] hover:text-[#e5e1e4] transition-colors">
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Queue Scrollable List */}
        <div className="flex-1 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="px-4 py-16">
              <EmptyState
                variant="no-results"
                title="No drafts match"
                description="Try another channel or search query."
              />
            </div>
          ) : (
            filteredMessages.map((message) => {
              const ContactIcon = channelIcon(message.channel);
              const warmthScore = getWarmthScore(message);
              const isSelected = selectedMessage?.id === message.id;

              return (
                <div
                  key={message.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(message.id)}
                  className={cn(
                    "p-4 border-b border-[#464554] cursor-pointer transition-colors hover:bg-[#201f22] flex flex-col gap-2",
                    isSelected ? "bg-[#201f22] border-l-2 border-l-[#8083ff]" : "border-l-2 border-l-transparent",
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-[#e5e1e4]">
                        {message.contact?.name ?? "Unknown"}
                      </h3>
                      <p className="text-xs text-[#c7c4d7]">
                        {message.contact?.title ?? "Prospect"}
                      </p>
                    </div>
                    <span className="text-xs text-[#c7c4d7]">
                      {warmthScore > 0 && `${warmthScore} warmth`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 px-2 py-0.5 rounded text-xs">
                      <Flame className="w-3 h-3" />
                      {warmthScore} Warmth
                    </span>
                    {message.warm_path?.recommended_intro_person && (
                      <span className="inline-flex items-center bg-[#353437] text-[#c7c4d7] px-2 py-0.5 rounded text-xs">
                        {message.warm_path.recommended_intro_person}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Review Dashboard (65%) */}
      <div className="flex-1 flex flex-col bg-[#131315] relative overflow-y-auto">
        {/* TopAppBar Context */}
        <div className="h-12 border-b border-[#464554] bg-[#131315] flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {selectedMessage ? (
              <>
                <h2 className="text-sm font-semibold text-[#e5e1e4]">
                  Review Request: {selectedMessage.contact?.name}
                </h2>
                <span className="bg-[#353437] text-[#c7c4d7] px-2 py-0.5 rounded text-xs border border-[#464554]">
                  ID: {selectedMessage.id.slice(0, 8)}
                </span>
              </>
            ) : (
              <h2 className="text-sm font-semibold text-[#c7c4d7]">Select a draft to review</h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedMessage && (
              <>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="h-8 px-3 flex items-center justify-center border border-[#464554] text-[#e5e1e4] rounded text-xs hover:bg-[#201f22] transition-colors"
                >
                  <HistoryIcon className="w-4 h-4 mr-1" />
                  History
                </button>
                <button className="h-8 w-8 flex items-center justify-center border border-[#464554] text-[#e5e1e4] rounded hover:bg-[#201f22] transition-colors">
                  <Zap className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Canvas */}
        {selectedMessage ? (
          <div className="p-6 max-w-[800px] flex flex-col gap-6 flex-1 overflow-y-auto">
            {/* Path Context Banner (Bento Style) */}
            <div className="grid grid-cols-3 gap-4">
              {/* Target Card */}
              <div className="col-span-2 bg-[#201f22] border border-[#464554] rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#c7c4d7] uppercase tracking-wider">
                      Target Node
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#e5e1e4]">
                    {selectedMessage.contact?.name}
                  </h3>
                  <p className="text-sm text-[#c7c4d7] mt-1">
                    {selectedMessage.contact?.title} at {selectedMessage.account?.name}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href="#"
                    className="text-[#8083ff] hover:text-[#b3b4ff] text-xs flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> LinkedIn
                  </a>
                </div>
              </div>

              {/* Path Connector */}
              <div className="col-span-1 bg-[#201f22] border border-[#464554] rounded p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <GitFork className="w-16 h-16" />
                </div>
                <div>
                  <span className="text-xs text-[#c7c4d7] uppercase tracking-wider">
                    Strongest Path
                  </span>
                  {selectedMessage.warm_path?.recommended_intro_person && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-[#464554] bg-[#8083ff]/20 flex items-center justify-center text-xs font-bold text-[#8083ff]">
                        {selectedMessage.warm_path.recommended_intro_person[0]}
                      </div>
                      <span className="font-medium text-[#e5e1e4]">
                        {selectedMessage.warm_path.recommended_intro_person}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1 bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 px-2 py-0.5 rounded text-xs">
                    <Flame className="w-3 h-3" />
                    {warmthLabel(getWarmthScore(selectedMessage))}
                  </span>
                  <p className="text-xs text-[#c7c4d7] mt-1">
                    {selectedMessage.warm_path?.path_explanation || "Strong path available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Editor Section */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <h3 className="text-sm font-semibold text-[#e5e1e4] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8083ff]" />
                  AI Draft Generation
                </h3>
                <span className="text-xs text-[#c7c4d7]">Editing as {selectedMessage.contact?.name?.split(" ")[0]}</span>
              </div>
              <div className="bg-[#201f22] border border-[#464554] rounded overflow-hidden flex flex-col shadow-sm">
                {/* Formatting Toolbar */}
                <div className="h-10 border-b border-[#464554] bg-[#201f22] flex items-center px-2 gap-1">
                  <button className="w-8 h-8 flex items-center justify-center text-[#c7c4d7] hover:text-[#e5e1e4] hover:bg-[#353437] rounded transition-colors">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-[#c7c4d7] hover:text-[#e5e1e4] hover:bg-[#353437] rounded transition-colors">
                    <Users className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-[#c7c4d7] hover:text-[#e5e1e4] hover:bg-[#353437] rounded transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-[#464554] mx-1" />
                  <button className="w-8 h-8 flex items-center justify-center text-[#c7c4d7] hover:text-[#e5e1e4] hover:bg-[#353437] rounded transition-colors">
                    <Zap className="w-4 h-4" />
                  </button>
                </div>

                {/* Subject Line */}
                <div className="border-b border-[#464554] px-4 py-2 bg-[#1c1b1d] flex items-center gap-2">
                  <span className="text-xs text-[#c7c4d7]">Subject:</span>
                  <input
                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm text-[#e5e1e4] outline-none placeholder-[#c7c4d7]"
                    type="text"
                    defaultValue={selectedMessage.subject || ""}
                    placeholder="Enter subject..."
                  />
                </div>

                {/* Editor Body */}
                <div className="p-4 bg-[#1c1b1d] min-h-[240px]">
                  <Textarea
                    value={draftBody}
                    onChange={(event) => setDraftBody(event.target.value)}
                    className="w-full h-full bg-transparent border-none p-0 focus:ring-0 text-sm text-[#e5e1e4] resize-none outline-none leading-relaxed placeholder-[#c7c4d7]"
                    placeholder="Draft message here..."
                  />
                </div>

                {/* AI Footer */}
                <div className="px-4 py-2 bg-[#201f22] flex items-center justify-between border-t border-[#464554]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                    <span className="text-xs text-[#c7c4d7]">
                      Draft optimized for high response rate
                    </span>
                  </div>
                  <button className="text-xs text-[#8083ff] hover:text-[#b3b4ff] flex items-center gap-1 transition-colors">
                    <RefreshCw className="w-3 h-3" />
                    Regenerate Tone
                  </button>
                </div>
              </div>
            </div>

            {/* Research Card */}
            <ResearchCard message={selectedMessage} />

            {/* Quality Scorer */}
            <QualityScorer message={selectedMessage} />

            {/* Action Console */}
            <div className="flex items-center justify-between pt-4 border-t border-[#464554] mt-auto">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-[#464554] text-[#c7c4d7] hover:bg-[#201f22]"
                  onClick={() => setSelectedId(null)}
                >
                  Re-route Path
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-[#464554] text-[#c7c4d7] hover:bg-[#201f22]"
                  onClick={() => {
                    rejectMessage(selectedMessage.id);
                    toast.success("Rejected");
                  }}
                >
                  Discard
                </Button>
              </div>
              <Button
                className="text-xs h-8 px-4 bg-[#4edea3] text-[#002114] font-semibold hover:bg-[#5ffab5] transition-colors shadow-[0_0_15px_rgba(78,222,163,0.2)]"
                onClick={() => {
                  approveMessage(selectedMessage.id, draftBody);
                  toast.success("Approved & sent!");
                }}
              >
                <Check className="w-3 h-3 mr-1.5" />
                Approve &amp; Send
              </Button>
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
    </div>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
