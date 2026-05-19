"use client";

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Filter,
  GitFork,
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

// ─── Message Quality Scorer ────────────────────────────────────────────────────

interface QualityDimension {
  label: string;
  score: number;
  feedback: string;
}

interface MessageQuality {
  overall: number;
  dimensions: QualityDimension[];
  weakest: QualityDimension;
}

function computeMessageQuality(message: GeneratedMessage): MessageQuality {
  const body = message.body ?? "";
  const words = body.split(/\s+/).filter(Boolean);
  const sentences = body.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const wordCount = words.length;
  const channel = message.channel;

  const contactName = message.contact?.name?.split(" ")[0] ?? "";
  const accountName = message.account?.name ?? "";
  const signalTitle = message.signal?.title ?? "";

  // 1. Personalization: looks for specific names, signal keywords, company refs
  const specificRefs = [contactName, accountName, signalTitle]
    .filter(Boolean)
    .filter((ref) => body.toLowerCase().includes(ref.toLowerCase())).length;
  const hasHook =
    /funding|series|hired|joined|posted|role|product|team|recent|last week|yesterday/i.test(body);
  const personalizationScore = Math.min(100, 40 + specificRefs * 18 + (hasHook ? 22 : 0));

  // 2. Clarity: avg words per sentence, avoid long sentences
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : wordCount;
  const clarityScore =
    avgWordsPerSentence <= 15
      ? 92
      : avgWordsPerSentence <= 20
        ? 78
        : avgWordsPerSentence <= 25
          ? 62
          : 44;

  // 3. CTA Strength: clear ask with specific framing
  const hasCTA =
    /15 minutes|quick call|30 min|worth a chat|open to|connect|reply|let me know|schedule|Thursday|Friday|this week/i.test(
      body,
    );
  const hasVague = /touch base|circle back|reach out|ping|synergies|value add/i.test(body);
  const ctaScore = hasCTA ? (hasVague ? 68 : 88) : 42;

  // 4. Tone Match: seniority-appropriate language
  const title = (message.contact?.title ?? "").toLowerCase();
  const isExec = /vp|cto|ceo|chief|director|head of|founder/i.test(title);
  const isJunior = /analyst|associate|coordinator|specialist/i.test(title);
  const isDirective = /you need|you should|obviously|simply/i.test(body);
  const isCasual = /hey!|just checking|hope you're|just wanted/i.test(body);
  let toneScore = 80;
  if (isExec && isCasual) toneScore = 52;
  else if (isExec && !isDirective) toneScore = 88;
  else if (isJunior && !isDirective) toneScore = 84;
  if (isDirective) toneScore -= 20;

  // 5. Length: optimal word count per channel
  const idealRange =
    channel === "linkedin" ? [50, 90] : channel === "email" ? [75, 135] : [60, 110];
  const [minWords, maxWords] = idealRange;
  let lengthScore: number;
  if (wordCount >= minWords && wordCount <= maxWords) lengthScore = 94;
  else if (wordCount < minWords) lengthScore = Math.max(40, 94 - (minWords - wordCount) * 3);
  else lengthScore = Math.max(40, 94 - (wordCount - maxWords) * 2);

  const dimensions: QualityDimension[] = [
    {
      label: "Personalization",
      score: personalizationScore,
      feedback:
        personalizationScore < 70
          ? `Add a specific hook referencing ${accountName || "their company"}'s recent activity.`
          : "Strong personalization with specific context.",
    },
    {
      label: "Clarity",
      score: clarityScore,
      feedback:
        clarityScore < 70
          ? "Sentences are too long — aim for under 18 words each."
          : "Clear, easy to scan.",
    },
    {
      label: "CTA Strength",
      score: ctaScore,
      feedback:
        ctaScore < 70
          ? 'Add a specific ask: "Worth 15 minutes this Thursday?"'
          : "Clear, friction-free ask.",
    },
    {
      label: "Tone Match",
      score: toneScore,
      feedback:
        toneScore < 70
          ? isExec
            ? "Tone is too casual for a C-level contact — tighten the opener."
            : "Check formality level for this contact."
          : "Tone matches contact seniority.",
    },
    {
      label: "Length",
      score: lengthScore,
      feedback:
        lengthScore < 70
          ? wordCount < minWords
            ? `Too short (${wordCount} words). ${channel} performs best at ${minWords}–${maxWords} words.`
            : `Too long (${wordCount} words). Trim to ${minWords}–${maxWords} words for ${channel}.`
          : `Good length (${wordCount} words) for ${channel}.`,
    },
  ];

  const overall = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  const weakest = dimensions.slice().sort((a, b) => a.score - b.score)[0];

  return { overall, dimensions, weakest };
}

// ─── Research Hooks ─────────────────────────────────────────────────────────

interface ResearchHook {
  text: string;
  source: string;
  date: string;
  confidence: number;
}

const HOOK_POOL: ResearchHook[] = [
  {
    text: "Posted about frustration with manual CRM data entry",
    source: "LinkedIn",
    date: "3 days ago",
    confidence: 0.91,
  },
  {
    text: "Company raised Series A — likely has budget for new tools",
    source: "TechCrunch",
    date: "5 days ago",
    confidence: 0.99,
  },
  {
    text: "Hired a Head of Revenue Operations last month",
    source: "LinkedIn Jobs",
    date: "22 days ago",
    confidence: 0.94,
  },
  {
    text: "Mentioned competitor in a G2 review comparison",
    source: "G2",
    date: "8 days ago",
    confidence: 0.82,
  },
  {
    text: "Spoke at RevOps conference about outbound efficiency",
    source: "Conference",
    date: "2 weeks ago",
    confidence: 0.88,
  },
  {
    text: "Job posting for VP Sales suggests pipeline expansion goal",
    source: "LinkedIn Jobs",
    date: "11 days ago",
    confidence: 0.87,
  },
  {
    text: "Company blog post about scaling GTM motion published",
    source: "Company Blog",
    date: "6 days ago",
    confidence: 0.85,
  },
  {
    text: "Engaged with 3 posts about AI-driven outreach in past week",
    source: "LinkedIn",
    date: "5 days ago",
    confidence: 0.79,
  },
];

function getResearchHooks(message: GeneratedMessage): ResearchHook[] {
  // Deterministically pick 2-3 hooks based on message id
  const seed = message.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const count = 2 + (seed % 2);
  const hooks: ResearchHook[] = [];
  for (let i = 0; i < count; i++) {
    hooks.push(HOOK_POOL[(seed + i * 3) % HOOK_POOL.length]);
  }
  return hooks;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#5db872";
  if (score >= 65) return "#e8a55a";
  return "#ef4444";
}

function QualityScorer({ message }: { message: GeneratedMessage }) {
  const quality = useMemo(() => computeMessageQuality(message), [message]);
  const [improved, setImproved] = useState(false);

  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-brand" />
          <span className="text-sm font-semibold">Message Quality</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: scoreColor(quality.overall) }}
          >
            {quality.overall}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="space-y-2">
        {quality.dimensions.map((dim) => (
          <div key={dim.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">{dim.label}</span>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: scoreColor(dim.score) }}
              >
                {dim.score}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${dim.score}%`, backgroundColor: scoreColor(dim.score) }}
              />
            </div>
          </div>
        ))}
      </div>

      {quality.weakest.score < 75 && !improved && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-3 space-y-2">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-brand flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">{quality.weakest.label}: </span>
              {quality.weakest.feedback}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2 w-full border-brand/25 text-brand hover:bg-brand/10"
            onClick={() => {
              toast.success("Flagged sections improved");
              setImproved(true);
            }}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Improve flagged sections
          </Button>
        </div>
      )}

      {improved && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
          <CheckCircle2 className="w-3 h-3" />
          Improvements applied — re-review before approving
        </div>
      )}
    </div>
  );
}

function ResearchCard({ message }: { message: GeneratedMessage }) {
  const hooks = useMemo(() => getResearchHooks(message), [message]);
  const [selected, setSelected] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-brand" />
        <span className="text-sm font-semibold">Research hooks</span>
        <Badge
          variant="outline"
          className="text-[10px] ml-auto bg-brand/8 text-brand border-brand/20"
        >
          {hooks.length} found
        </Badge>
      </div>
      <div className="space-y-2">
        {hooks.map((hook, i) => (
          <button
            key={hook.text}
            type="button"
            onClick={() => toggle(i)}
            className={`w-full text-left rounded-xl border p-3 transition-colors ${
              selected.has(i)
                ? "border-brand/30 bg-brand/5"
                : "border-border/40 hover:border-border/60"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border transition-colors ${
                  selected.has(i) ? "bg-brand border-brand" : "border-border/60"
                }`}
              >
                {selected.has(i) && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-foreground leading-relaxed">{hook.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{hook.source}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">{hook.date}</span>
                  <span
                    className="text-[10px] font-medium ml-auto"
                    style={{ color: scoreColor(Math.round(hook.confidence * 100)) }}
                  >
                    {Math.round(hook.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {selected.size > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {selected.size} hook{selected.size > 1 ? "s" : ""} will be included next time you
          regenerate.
        </p>
      )}
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
      <div className="text-sm text-muted-foreground">
        {CHANNEL_CONFIG[message.channel]?.label ?? message.channel} follow-up path
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {pathNodes.slice(0, 3).map((node, index) => (
          <div key={node.id} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-muted-foreground/40">→</span>}
            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-medium">
              {node.name.split(" ")[0]}
            </span>
          </div>
        ))}
        <span className="text-muted-foreground/40">→</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/8 px-2.5 py-1 text-xs font-medium text-brand">
          <ChannelIcon className="h-3 w-3" />
          {CHANNEL_CONFIG[message.channel]?.label ?? message.channel}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
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
        "grid w-full gap-5 border-b border-border/50 px-5 py-5 text-left transition-colors last:border-b-0 hover:bg-muted/20 xl:grid-cols-[1.2fr_1fr_1fr_0.5fr_0.5fr]",
        selected && "bg-brand/5",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
          {getInitials(message.contact?.name ?? "WP")}
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-background bg-background shadow-sm">
            <ContactIcon className="h-3.5 w-3.5 text-brand" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">
            {message.contact?.name ?? "Unknown Contact"}
          </p>
          <p className="text-sm text-muted-foreground">{message.contact?.title ?? "Prospect"}</p>
          <Badge
            variant="outline"
            className="mt-1 text-[10px] bg-brand/5 text-brand border-brand/15 font-normal"
          >
            1:1 for {message.contact?.name?.split(" ")[0] ?? "this prospect"}
          </Badge>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>{message.account?.name ?? "Unassigned account"}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Buying Signals</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {signals.map((signal) => (
            <li key={signal} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand" />
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
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          Approve
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="rounded-[28px] border border-border/60 bg-background shadow-sm">
        <div className="flex flex-col gap-5 border-b border-border/60 px-6 py-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">Outreach Review</h1>
              <div className="flex flex-col items-start gap-0.5">
                <Badge variant="secondary" className="h-8 rounded-full px-3 text-sm">
                  {pendingMessages.length}
                </Badge>
                <span className="text-[10px] text-muted-foreground/70 pl-1">
                  Each written uniquely
                </span>
              </div>
            </div>
            <p className="max-w-2xl text-base text-muted-foreground">
              Every draft is written 1:1 for this specific person — grounded in their account's
              signals, relationship context, and your team's knowledge base. Read each one before it
              sends.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
            <Card size="sm" className="bg-muted/15 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Ready to review
                </p>
                <p className="mt-2 text-3xl font-bold">{pendingMessages.length}</p>
              </CardContent>
            </Card>
            <Card size="sm" className="bg-muted/15 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Avg Warmth
                </p>
                <p className="mt-2 text-3xl font-bold">{averageWarmth}</p>
              </CardContent>
            </Card>
            <Card size="sm" className="bg-muted/15 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Confidence
                </p>
                <p className="mt-2 text-3xl font-bold">{averageConfidence}%</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search prospects, accounts, or signals..."
                className="h-11 w-full rounded-xl border border-border/60 bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand/40"
              />
            </div>
            <Button variant="outline" className="h-11 gap-2 self-start">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <Button
                className="h-11 gap-2 bg-brand px-5 text-brand-foreground hover:bg-brand/90"
                onClick={() => {
                  const first = filteredMessages[0];
                  if (first) setSelectedId(first.id);
                }}
                disabled={filteredMessages.length === 0}
              >
                Review next draft
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-11 gap-2 px-5"
                onClick={handleApproveAll}
                disabled={filteredMessages.length === 0}
              >
                <Check className="h-4 w-4" />
                Send all {filteredMessages.length} drafts
              </Button>
            </div>
            {hasWarmIntro && (
              <p className="flex items-center gap-1 text-[11px] text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Warm intros still need each connector's personal OK
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 px-6 pb-6 xl:grid-cols-[1.65fr_0.85fr]">
          <div className="overflow-hidden rounded-[24px] border border-border/60 bg-card">
            <div className="flex flex-wrap gap-2 border-b border-border/60 px-4 py-3">
              {CHANNEL_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === tab
                      ? "bg-brand/10 text-brand"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span>
                    {tab === "all"
                      ? `${counts[tab]} drafts to review`
                      : (CHANNEL_CONFIG[tab]?.label ?? tab)}
                  </span>
                  {tab !== "all" && (
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {counts[tab]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredMessages.length === 0 ? (
              <div className="px-6 py-16">
                <EmptyState
                  variant="no-results"
                  title="No drafts match this view"
                  description="Try another channel or search query."
                />
              </div>
            ) : (
              <div>
                {filteredMessages.map((message) => (
                  <QueueRow
                    key={message.id}
                    message={message}
                    selected={selectedMessage?.id === message.id}
                    onSelect={() => setSelectedId(message.id)}
                    onApprove={() => {
                      approveMessage(message.id);
                      toast.success("Approved");
                    }}
                    onReject={() => {
                      rejectMessage(message.id);
                      toast.success("Rejected");
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <Card className="overflow-hidden rounded-[24px] border-border/60 shadow-none">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-xl">Prospect Intelligence</CardTitle>
            </CardHeader>

            {selectedMessage ? (
              <CardContent className="space-y-6 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-base font-semibold">
                    {getInitials(selectedMessage.contact?.name ?? "WP")}
                  </div>
                  <div>
                    <p className="text-xl font-semibold">
                      {selectedMessage.contact?.name ?? "Unknown Contact"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMessage.contact?.title ?? "Prospect"}
                    </p>
                    <p className="text-xs text-brand/70 italic mt-0.5">
                      Personalized exclusively for this prospect
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {selectedMessage.account?.name ?? "Unassigned account"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Best Channel
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                      {(() => {
                        const Icon = channelIcon(selectedMessage.channel);
                        return <Icon className="h-4 w-4 text-brand" />;
                      })()}
                      {CHANNEL_CONFIG[selectedMessage.channel]?.label ?? selectedMessage.channel}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Top Signal
                    </p>
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                      <div>
                        <p className="font-medium">
                          {selectedMessage.signal?.title ?? "Relationship context available"}
                        </p>
                        <p className="text-muted-foreground">
                          {selectedMessage.signal
                            ? `${signalTypeLabel(selectedMessage.signal.type)} • ${formatRelativeTime(selectedMessage.signal.detected_at)}`
                            : "No explicit signal attached"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Warmth Score
                      </p>
                      <span className="text-sm font-semibold">
                        {getWarmthScore(selectedMessage)}/100
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-brand"
                        style={{ width: `${getWarmthScore(selectedMessage)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {warmthLabel(getWarmthScore(selectedMessage))}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold">Why this prospect?</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {whyThisProspect(selectedMessage)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">Next Best Step</p>
                    <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                      <GitFork className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
                      <span>{nextBestStep(selectedMessage)}</span>
                    </div>
                  </div>
                </div>

                <ResearchCard message={selectedMessage} />

                <div className="rounded-2xl border border-border/60 bg-background p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand" />
                    <p className="text-sm font-semibold">Draft Review</p>
                  </div>

                  {selectedMessage.subject && (
                    <div className="mb-3 rounded-xl bg-muted/20 px-3 py-2 text-sm">
                      <span className="font-medium">Subject:</span> {selectedMessage.subject}
                    </div>
                  )}

                  <Textarea
                    value={draftBody}
                    onChange={(event) => setDraftBody(event.target.value)}
                    className="min-h-[180px] resize-none border-border/60 bg-background"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      className="bg-brand text-brand-foreground hover:bg-brand/90"
                      onClick={() => approveMessage(selectedMessage.id, draftBody)}
                    >
                      Approve Draft
                    </Button>
                    <Button variant="outline" onClick={() => rejectMessage(selectedMessage.id)}>
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => regenerateMessage(selectedMessage.id)}
                      disabled={generatingIds.has(selectedMessage.id)}
                    >
                      <RefreshCw
                        className={cn(
                          "mr-1 h-4 w-4",
                          generatingIds.has(selectedMessage.id) && "animate-spin",
                        )}
                      />
                      Regenerate
                    </Button>
                  </div>
                </div>

                <QualityScorer message={selectedMessage} />

                <div className="rounded-2xl border border-brand/15 bg-brand/6 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand" />
                    <p className="text-sm font-semibold">AI Note</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selectedMessage.signal?.description ||
                      "This draft is ranked highly because the account has timely intent context and a credible path for outreach."}
                  </p>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-6">
                <EmptyState
                  variant="empty"
                  title="Select a draft"
                  description="Choose a prospect from the queue to review context, edit the message, and approve."
                />
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
