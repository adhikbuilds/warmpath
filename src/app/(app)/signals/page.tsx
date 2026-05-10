"use client";

import {
  Archive,
  Bot,
  Building2,
  ChevronDown,
  ChevronUp,
  Filter,
  GitFork,
  Link2Off,
  Linkedin,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sliders,
  Sparkles,
  ThumbsUp,
  Trophy,
  UserCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buildRelationshipGraph, computeEdgeWarmth } from "@/lib/graph";
import { formatRelativeTime, signalTypeColor, signalTypeLabel } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { Account, RelationshipEdge, RelationshipType, Signal, WarmPath } from "@/types";

// ─── Signal type icons & one-liners ──────────────────────────────────────────


const SIGNAL_ONELINER: Record<string, string> = {
  funding: "New capital = new budget. Strike before the spend plan is locked.",
  leadership_change: "New exec = new vendor reviews. First mover wins.",
  website_visit: "They found you. Don't let the moment go cold.",
  pricing_page_visit: "Pricing page visit = active evaluation. Act within 24 hours.",
  job_posting: "Hiring signals = they're solving the exact problem you solve.",
  g2_review: "Actively comparing solutions. Warm outreach now before they decide.",
  intent_topic_surge: "Research spike detected. They're in buying mode.",
  champion_job_change: "Your champion moved. New role, new opportunity.",
  competitor_hiring: "Competitor is scaling they're feeling pressure. Your opening.",
  linkedin_post: "They shared the pain publicly. Respond with a specific solution.",
  tech_stack_change: "Stack change = integration opportunity. Time to reach out.",
  contract_renewal: "Renewal cycle starting. Warmth matters most in this window.",
  product_launch: "They're in growth mode GTM tooling investment follows.",
  relationship_decay:
    "Connection going cold. A genuine check-in now costs nothing losing the path costs pipeline.",
};

// ─── LinkedIn Feed ─────────────────────────────────────────────────────────────

type LinkedInIntentTag =
  | "pain_point"
  | "product_evaluation"
  | "competitor_mention"
  | "expansion_signal"
  | "positive_sentiment"
  | "hiring_signal";

const INTENT_TAG_STYLES: Record<LinkedInIntentTag, string> = {
  pain_point: "bg-red-500/10 text-red-600 border-red-500/20",
  product_evaluation: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  competitor_mention: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  expansion_signal: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  positive_sentiment: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  hiring_signal: "bg-brand/10 text-brand border-brand/20",
};

const INTENT_TAG_LABELS: Record<LinkedInIntentTag, string> = {
  pain_point: "Pain point",
  product_evaluation: "Evaluating tools",
  competitor_mention: "Competitor mention",
  expansion_signal: "Expansion signal",
  positive_sentiment: "Positive sentiment",
  hiring_signal: "Hiring signal",
};

interface LinkedInPost {
  id: string;
  contactName: string;
  contactTitle: string;
  accountName: string;
  avatarInitial: string;
  postedAt: string;
  content: string;
  likes: number;
  comments: number;
  intentTags: LinkedInIntentTag[];
  matchesValueProp: boolean;
  valuePropsMatch?: string;
}

/** Derive LinkedInPost display objects from real store signals of type "linkedin_post". */
function signalsToLinkedInPosts(
  linkedInSignals: Signal[],
  accounts: Account[],
): LinkedInPost[] {
  return linkedInSignals.map((signal) => {
    const account = accounts.find((a) => a.id === signal.account_id);
    // Infer intent tags from signal description / title keywords
    const text = `${signal.title} ${signal.description}`.toLowerCase();
    const intentTags: LinkedInIntentTag[] = [];
    if (text.includes("pain") || text.includes("struggle") || text.includes("problem")) {
      intentTags.push("pain_point");
    }
    if (text.includes("evaluat") || text.includes("demo") || text.includes("compar")) {
      intentTags.push("product_evaluation");
    }
    if (text.includes("competitor") || text.includes("apollo") || text.includes("migrat")) {
      intentTags.push("competitor_mention");
    }
    if (text.includes("hiring") || text.includes("headcount") || text.includes("scaling")) {
      intentTags.push("hiring_signal");
    }
    if (text.includes("expand") || text.includes("growth") || text.includes("series")) {
      intentTags.push("expansion_signal");
    }
    if (intentTags.length === 0) {
      intentTags.push("positive_sentiment");
    }
    const matchesValueProp = signal.urgency_score >= 60;
    return {
      id: signal.id,
      contactName: signal.source ?? account?.name ?? "Contact",
      contactTitle: "",
      accountName: account?.name ?? "Unknown",
      avatarInitial: (signal.source ?? account?.name ?? "?")?.[0]?.toUpperCase() ?? "?",
      postedAt: signal.detected_at,
      content: signal.description,
      likes: Math.round(signal.urgency_score * 2.2),
      comments: Math.round(signal.confidence_score * 0.7),
      intentTags,
      matchesValueProp,
      valuePropsMatch: matchesValueProp ? signal.title : undefined,
    };
  });
}

function LinkedInFeed() {
  const { signals, accounts } = useSalesStore();
  const [generatingCommentId, setGeneratingCommentId] = useState<string | null>(null);
  const [generatedComments, setGeneratedComments] = useState<Record<string, string>>({});
  const [savedHooks, setSavedHooks] = useState<Set<string>>(new Set());

  const linkedInSignals = signals.filter((s) => s.type === "linkedin_post");
  const posts = signalsToLinkedInPosts(linkedInSignals, accounts);

  const matchingPosts = posts.filter((p) => p.matchesValueProp);
  const otherPosts = posts.filter((p) => !p.matchesValueProp);

  async function generateComment(postId: string, contactName: string) {
    setGeneratingCommentId(postId);
    await new Promise((r) => setTimeout(r, 1400));
    const post = posts.find((p) => p.id === postId);
    const tag = post?.intentTags[0];
    const firstName = contactName.split(" ")[0];
    const tagComments: Partial<Record<LinkedInIntentTag, string>> = {
      pain_point: `This is such a common pain point, ${firstName}. One pattern that's worked: treating the workflow as the output rather than the bottleneck. Curious what your current setup looks like.`,
      product_evaluation: `Great timing happy to show you something we've been building around relationship graph intelligence for outbound. It's a different lens than most tools in the space. Worth 20 minutes?`,
      competitor_mention: `Heard this exact feedback recently. The contact data problem is pretty solved the relationship intelligence layer is where most tools still fall short. Curious what "uses our network" looks like to you.`,
      expansion_signal: `Interesting signals from your direction consistent with what we're seeing across high-growth teams. The mechanism is: warm intros compress the trust-building phase. Would love to compare notes.`,
      positive_sentiment: `Really appreciate you sharing this perspective, ${firstName}. We're seeing the same shift would love to compare notes when you have a moment.`,
      hiring_signal: `Scaling fast is exciting! A lot of teams in your position are rethinking their outbound motion at the same time. Would love to share what's been working for similar-stage companies.`,
    };
    setGeneratedComments((prev) => ({
      ...prev,
      [postId]:
        (tag && tagComments[tag]) ??
        `Great insight, ${firstName}. Would love to connect and chat more about this.`,
    }));
    setGeneratingCommentId(null);
  }

  function saveAsHook(postId: string, contactName: string) {
    setSavedHooks((prev) => new Set([...prev, postId]));
    toast.success(`Hook saved will be included in next outreach to ${contactName}`, {
      description: "Visible in the research card when generating messages.",
    });
  }

  function renderPost(post: LinkedInPost) {
    const isGenerating = generatingCommentId === post.id;
    const hasComment = !!generatedComments[post.id];
    const isSaved = savedHooks.has(post.id);

    return (
      <Card
        key={post.id}
        className={`border-border/60 transition-all ${post.matchesValueProp ? "border-l-2 border-l-brand" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {post.avatarInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold">{post.contactName}</p>
                    <span className="text-[9px] border border-border/50 rounded px-1 text-muted-foreground ml-1">
                      1st
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {post.contactTitle} · {post.accountName}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {formatRelativeTime(post.postedAt)}
                </span>
              </div>
            </div>
          </div>
          {post.matchesValueProp && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-brand/10 text-brand border-brand/20 font-medium">
                ⚡ Matches: {post.valuePropsMatch}
              </span>
            </div>
          )}
          <div className="mt-2 text-[11px] leading-relaxed text-foreground/80 bg-muted/30 rounded-lg p-2.5 mb-3">
            {post.content}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {post.intentTags.map((tag) => (
              <span
                key={tag}
                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${INTENT_TAG_STYLES[tag]}`}
              >
                {INTENT_TAG_LABELS[tag]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground">
            <ThumbsUp className="w-3 h-3" />
            {post.likes}
            <MessageSquare className="w-3 h-3 ml-1" />
            {post.comments}
          </div>
          {hasComment && (
            <div className="mb-3 bg-muted/50 rounded-lg p-3 border border-border/40">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">
                Draft comment
              </p>
              <p className="text-xs leading-relaxed">{generatedComments[post.id]}</p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedComments[post.id] ?? "");
                    toast.success("Copied to clipboard");
                  }}
                >
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px]"
                  onClick={() => generateComment(post.id, post.contactName)}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1"
              disabled={isGenerating}
              onClick={() => generateComment(post.id, post.contactName)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Writing…
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3" />
                  {hasComment ? "Regenerate comment" : "Generate comment"}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant={isSaved ? "default" : "ghost"}
              className={`h-7 text-[11px] gap-1 ${isSaved ? "" : "text-brand hover:bg-brand/10"}`}
              onClick={() => saveAsHook(post.id, post.contactName)}
              disabled={isSaved}
            >
              <GitFork className="w-3 h-3" />
              {isSaved ? "Hook saved" : "Use as hook"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {matchingPosts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand uppercase tracking-wider">
              ⚡ Matches your value prop · {matchingPosts.length}
            </span>
          </div>
          {matchingPosts.map(renderPost)}
        </section>
      )}
      {otherPosts.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Other posts
          </p>
          {otherPosts.map(renderPost)}
        </section>
      )}
    </div>
  );
}

// ─── Warm path reveal ─────────────────────────────────────────────────────────

const REL_LABELS: Record<RelationshipType, string> = {
  intro_history: "Prior intro",
  coworker_connection: "Ex-colleagues",
  calendar_meeting: "Met in person",
  email_history: "Email history",
  warm_path: "Warm connection",
  crm_owner: "CRM owner",
  linkedin_connection: "LinkedIn",
};

interface RevealNode {
  id: string;
  name: string;
}

interface RevealPath {
  nodes: RevealNode[];
  warmth: number;
}

function WarmPathReveal({
  path,
  edges,
  loading,
}: {
  path: RevealPath | null;
  edges: RelationshipEdge[];
  loading: boolean;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    if (!path || loading) return;
    const t = setTimeout(() => setStep(1), 60);
    return () => clearTimeout(t);
  }, [path, loading]);

  useEffect(() => {
    if (!path || step === 0 || step >= path.nodes.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 230);
    return () => clearTimeout(t);
  }, [step, path]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
        <span className="text-xs text-muted-foreground">Computing warm path…</span>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="py-2 space-y-1">
        <p className="text-xs text-muted-foreground">No warm path in your network.</p>
        <p className="text-[11px] text-muted-foreground/60">
          Cold outreach only connect with someone at this company first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {path.nodes.map((node, i) => {
        const next = i < path.nodes.length - 1 ? path.nodes[i + 1] : null;
        const edge = next
          ? edges.find(
              (e) =>
                (e.from_id === node.id && e.to_id === next.id) ||
                (e.from_id === next.id && e.to_id === node.id),
            )
          : null;

        const nodeVisible = step > i;
        const edgeVisible = step > i + 1;

        const nodeColor =
          i === 0
            ? "bg-brand/15 text-brand ring-2 ring-brand/25"
            : i === path.nodes.length - 1
              ? "bg-violet-500/15 text-violet-600 ring-2 ring-violet-500/25"
              : "bg-blue-500/15 text-blue-600 ring-2 ring-blue-500/25";

        return (
          <div key={node.id}>
            <div
              className="flex items-center gap-2.5"
              style={{
                opacity: nodeVisible ? 1 : 0,
                transform: nodeVisible ? "translateX(0)" : "translateX(-10px)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
              }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${nodeColor}`}
              >
                {node.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight truncate">{node.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {i === 0 ? "You" : i === path.nodes.length - 1 ? "Target" : "Connector"}
                </p>
              </div>
              {i === 0 && nodeVisible && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 font-medium flex-shrink-0">
                  {path.warmth} warmth
                </span>
              )}
            </div>

            {next && (
              <div className="ml-4 py-1 flex items-start gap-2.5">
                <div
                  className="w-0.5 rounded-full flex-shrink-0 ml-3"
                  style={{
                    height: edge ? "26px" : "18px",
                    background: nodeVisible
                      ? "linear-gradient(to bottom, rgba(100,116,139,0.35), rgba(100,116,139,0.08))"
                      : "transparent",
                    transition: "background 0.3s ease",
                  }}
                />
                {edge && (
                  <div
                    className="mt-0.5"
                    style={{ opacity: edgeVisible ? 1 : 0, transition: "opacity 0.3s ease 0.1s" }}
                  >
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted border border-border/40">
                      {REL_LABELS[edge.relationship_type] ?? "Connected"}
                    </span>
                    {edge.evidence && (
                      <p className="text-[10px] text-muted-foreground/55 mt-0.5 max-w-[175px]">
                        {edge.evidence}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IntelPanel({ signalId }: { signalId: string | null }) {
  const router = useRouter();
  const { signals, accounts, contacts, warmPaths, teamMembers, relationshipEdges, addMessageToQueue } = useSalesStore();
  const [loading, setLoading] = useState(false);
  const [revealPath, setRevealPath] = useState<RevealPath | null>(null);
  const [targetContact, setTargetContact] = useState<{ name: string; title: string } | null>(null);

  const { graph, sourceIds } = useMemo(() => {
    const teamNodes = teamMembers.map((tm) => ({
      id: tm.id,
      name: tm.name,
      type: "team_member" as const,
    }));
    const g = buildRelationshipGraph(relationshipEdges, teamNodes);
    return { graph: g, sourceIds: teamMembers.map((t) => t.id) };
  }, [relationshipEdges, teamMembers]);

  useEffect(() => {
    if (!signalId) {
      setRevealPath(null);
      setTargetContact(null);
      return;
    }
    setLoading(true);
    setRevealPath(null);
    setTargetContact(null);

    const t = setTimeout(() => {
      const signal = signals.find((s) => s.id === signalId);
      if (!signal) {
        setLoading(false);
        return;
      }
      const account = accounts.find((a) => a.id === signal.account_id);
      if (!account) {
        setLoading(false);
        return;
      }
      const topContact = contacts
        .filter((c) => c.account_id === account.id)
        .sort((a, b) => b.warmth_score - a.warmth_score)[0];
      if (!topContact) {
        setLoading(false);
        return;
      }
      setTargetContact({ name: topContact.name, title: topContact.title });
      let best: RevealPath | null = null;
      for (const sid of sourceIds) {
        const paths = graph.findPaths(sid, topContact.id, 3, 1);
        if (paths.length > 0 && (!best || paths[0].warmth > best.warmth)) best = paths[0];
      }
      setRevealPath(best);
      setLoading(false);
    }, 460);

    return () => clearTimeout(t);
  }, [signalId]);

  const signal = signals.find((s) => s.id === signalId) ?? null;
  const account = signal ? accounts.find((a) => a.id === signal.account_id) : null;

  if (!signal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-5">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <GitFork className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Select a signal</p>
          <p className="text-[11px] text-muted-foreground/55 mt-0.5">
            Click any signal to reveal its warm path
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Signal header */}
      <div className="p-3.5 border-b border-border/40 space-y-2">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0 mt-0.5">
            {account?.name?.[0] ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs">{account?.name}</span>
              <Badge variant="outline" className={`text-[10px] ${signalTypeColor(signal.type)}`}>
                {signalTypeLabel(signal.type)}
              </Badge>
            </div>
            <p className="text-xs font-medium mt-0.5 leading-tight">{signal.title}</p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Zap className="w-3 h-3 text-brand flex-shrink-0 mt-0.5" />
          <span className="text-[11px] text-muted-foreground leading-snug">
            {signal.recommended_action}
          </span>
        </div>
      </div>

      {/* Warm path reveal */}
      <div className="p-3.5 border-b border-border/40 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <GitFork className="w-3 h-3 text-brand" />
          <span className="text-[11px] font-semibold">Warm Path</span>
          {targetContact && !loading && (
            <span className="text-[11px] text-muted-foreground truncate">
              → {targetContact.name}
            </span>
          )}
        </div>
        <WarmPathReveal path={revealPath} edges={relationshipEdges} loading={loading} />
      </div>

      {/* Target */}
      {targetContact && !loading && (
        <div className="p-3.5 border-b border-border/40 space-y-2">
          <div className="flex items-center gap-1.5">
            <UserCircle className="w-3 h-3 text-violet-500" />
            <span className="text-[11px] font-semibold">Target Contact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
              {targetContact.name[0]}
            </div>
            <div>
              <p className="text-xs font-semibold">{targetContact.name}</p>
              <p className="text-[11px] text-muted-foreground">{targetContact.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-3.5 space-y-2 mt-auto">
        {!loading && (
          <>
            {revealPath ? (
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => {
                  if (!signal || !account) return;
                  const topContact = contacts.find((c) => c.account_id === account.id);
                  const warmPath = warmPaths.find((wp) => wp.account_id === account.id);
                  addMessageToQueue({
                    account_id: account.id,
                    contact_id: topContact?.id ?? "",
                    warm_path_id: warmPath?.id,
                    signal_id: signal.id,
                    channel: "warm_intro",
                    subject: `Intro request — ${account.name}`,
                    body: `Hi,\n\nI wanted to reach out about ${account.name} following their ${signal.title}.\n\n${signal.description}\n\nWould you be open to a quick intro?`,
                    intro_request: `Would you mind connecting me with someone at ${account.name}? The timing looks great based on their recent activity.`,
                    status: "draft",
                    approval_status: "pending",
                    generated_by_ai: true,
                    confidence_score: 0.88,
                    personalization_reason: signal.description ?? signal.title,
                    factual_claims: [signal.title],
                    supporting_sources: ["WarmPath signal monitor"],
                    risk_flags: [],
                  });
                  toast.success(`Intro request drafted for ${account.name}`);
                  router.push("/approval-queue");
                }}
              >
                <Bot className="w-3.5 h-3.5" />
                Draft intro request
              </Button>
            ) : null}
            <Button
              variant={revealPath ? "outline" : "default"}
              className="w-full gap-2"
              size="sm"
              onClick={() => {
                if (!signal || !account) return;
                const topContact = contacts.find((c) => c.account_id === account.id);
                const warmPath = revealPath ? warmPaths.find((wp) => wp.account_id === account.id) : undefined;
                addMessageToQueue({
                  account_id: account.id,
                  contact_id: topContact?.id ?? "",
                  warm_path_id: warmPath?.id,
                  signal_id: signal.id,
                  channel: revealPath ? "email" : "email",
                  subject: `${signal.title} — ${account.name}`,
                  body: `Hi ${topContact?.name?.split(" ")[0] ?? "there"},\n\nI noticed ${signal.title.toLowerCase()} at ${account.name} and wanted to reach out.\n\n${signal.description}\n\nWould love to connect and share how we've helped similar companies.\n\nBest,\nAdhik`,
                  status: "draft",
                  approval_status: "pending",
                  generated_by_ai: true,
                  confidence_score: revealPath ? 0.85 : 0.72,
                  personalization_reason: signal.description ?? signal.title,
                  factual_claims: [signal.title],
                  supporting_sources: ["WarmPath signal monitor"],
                  risk_flags: [],
                });
                toast.success(`Outreach drafted for ${account.name} — review in Approval Queue`);
                router.push("/approval-queue");
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {revealPath ? "Draft warm email" : "Draft cold outreach"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Composite priority score ─────────────────────────────────────────────────
// act_now_score = urgency × (account.opportunity_score/100) × warmth_multiplier
// warmth_multiplier = warmPath.warmth_score/100 if path exists, else 0.3

function computeActNow(
  urgency: number,
  opportunityScore: number,
  warmthScore: number,
  hasWarmPath: boolean,
): number {
  const warmMultiplier = hasWarmPath ? warmthScore / 100 : 0.3;
  return Math.round(urgency * (opportunityScore / 100) * warmMultiplier);
}

// ─── Warmth badge ─────────────────────────────────────────────────────────────

function WarmthBadge({ hasWarmPath, warmthScore }: { hasWarmPath: boolean; warmthScore: number }) {
  if (hasWarmPath && warmthScore >= 60)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-brand/30 bg-brand/10 text-brand">
        <GitFork className="w-2.5 h-2.5" />
        Warm path · {warmthScore}
      </span>
    );
  if (hasWarmPath)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-500">
        <GitFork className="w-2.5 h-2.5" />
        Cold path · {warmthScore}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
      No path
    </span>
  );
}

// ─── Champion parse helpers ───────────────────────────────────────────────────

function parseChampTitle(title: string) {
  const m = title.match(/^(.+) moved from (.+) to (.+)$/);
  return m ? { name: m[1], oldCo: m[2], newCo: m[3] } : null;
}

function parseChampDesc(desc: string) {
  const m = desc.match(/joined (.+) as (.+?)\.?$/);
  return m ? { newCo: m[1], newTitle: m[2] } : null;
}

// ─── Champion Outreach Sheet ──────────────────────────────────────────────────

interface ChampionOutreachSheetProps {
  signal: Signal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

function ChampionOutreachSheet({
  signal,
  open,
  onOpenChange,
  userName,
}: ChampionOutreachSheetProps) {
  if (!signal) return null;

  const titleParsed = parseChampTitle(signal.title);
  const descParsed = parseChampDesc(signal.description);

  const contactName = titleParsed?.name ?? "Champion";
  const firstName = contactName.split(" ")[0];
  const oldCo = titleParsed?.oldCo ?? "their previous company";
  const newCo = titleParsed?.newCo ?? descParsed?.newCo ?? "their new company";
  const newTitle = descParsed?.newTitle ?? "their new role";
  const userFirstName = userName.split(" ")[0];

  const subject = `Congrats on the move to ${newCo}!`;
  const body = `Hey ${firstName},

Saw that you just joined ${newCo} as ${newTitle} congrats on the new role!

We'd crossed paths when you were at ${oldCo}, and I've always had a lot of respect for the work you were doing there.

Thought I'd reach out because a lot of ${newTitle} leaders we talk to are thinking about how to build warm pipeline without burning their new team's reputation on cold outreach. Given your background, I thought you might have a take on it.

No agenda at all if you're open to reconnecting once you've settled in, would love a quick catch-up.

Best,
${userFirstName}`;

  const fullMessage = `Subject: ${subject}\n\n${body}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-violet-500" />
            Reach out to {contactName}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {oldCo} → {newCo} · {newTitle}
          </p>
        </SheetHeader>

        <div className="px-6 space-y-4 pb-6">
          {/* Draft message */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pre-drafted message
            </p>
            <p className="text-xs font-semibold text-foreground">Subject: {subject}</p>
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {body}
            </div>
          </div>

          {/* Note */}
          <p className="text-[11px] text-muted-foreground italic border-l-2 border-violet-500/40 pl-3">
            This message references your existing relationship, not WarmPath. Keep it authentic.
          </p>

          {/* Actions */}
          <div className="flex gap-2 flex-col">
            <button
              type="button"
              className="w-full h-9 rounded-md bg-brand text-brand-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(fullMessage).then(() => {
                  toast.success("Copied!");
                });
              }}
            >
              Copy message
            </button>
            <button
              type="button"
              className="w-full h-9 rounded-md border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/60 transition-colors"
              onClick={() => {
                const encoded = encodeURIComponent(contactName);
                window.open(
                  `https://www.linkedin.com/search/results/people/?keywords=${encoded}`,
                  "_blank",
                  "noopener",
                );
              }}
            >
              <Linkedin className="w-3.5 h-3.5" />
              Open LinkedIn
            </button>
            <button
              type="button"
              className="w-full h-9 rounded-md border border-violet-500/30 text-violet-600 dark:text-violet-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-500/10 transition-colors"
              onClick={() => toast.success(`Account created for ${newCo} check Accounts`)}
            >
              Auto-create account for {newCo}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Decay Re-engage Sheet ────────────────────────────────────────────────────

interface DecayReEngageSheetProps {
  edge: RelationshipEdge | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DecayReEngageSheet({ edge, userName, open, onOpenChange }: DecayReEngageSheetProps) {
  if (!edge) return null;

  const isFromTeam = edge.from_type === "team_member" || edge.from_type === "user";
  const contactName = isFromTeam ? edge.to_name : edge.from_name;
  const firstName = contactName.split(" ")[0];
  const days = Math.round((Date.now() - new Date(edge.last_interaction_at).getTime()) / 86_400_000);

  const subject = "Checking in how's everything going?";
  const body = `Hey ${firstName},

Hope you're doing well! It's been a while since we last connected and I've been meaning to reach out.

${edge.evidence ? `Came across your recent work on ${edge.evidence.slice(0, 60)}…` : `Saw you've been busy really impressive what you've been building.`}

Would love to catch up no agenda, just reconnecting. Are you open for a quick 15-min call sometime?

Best,
${userName}`;

  const fullMessage = `Subject: ${subject}\n\n${body}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Link2Off className="w-4 h-4 text-brand" />
            Re-engage {contactName}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Last interaction {days}d ago · warmth score {computeEdgeWarmth(edge)}
          </p>
        </SheetHeader>

        <div className="px-6 space-y-4 pb-6">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pre-drafted check-in
            </p>
            <p className="text-xs font-semibold text-foreground">Subject: {subject}</p>
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {body}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground italic border-l-2 border-brand/40 pl-3">
            This message doesn't mention WarmPath or sales. Keep it authentic.
          </p>

          <div className="flex gap-2 flex-col">
            <Button
              className="w-full gap-2"
              onClick={() => {
                navigator.clipboard.writeText(fullMessage).then(() => {
                  toast.success("Copied to clipboard");
                });
              }}
            >
              Copy message
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                const encoded = encodeURIComponent(contactName);
                window.open(
                  `https://www.linkedin.com/search/results/people/?keywords=${encoded}`,
                  "_blank",
                  "noopener",
                );
              }}
            >
              <Linkedin className="w-3.5 h-3.5" />
              Open LinkedIn
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Action line ─────────────────────────────────────────────────────────────

function getActionLine(
  signal: Signal,
  account: Account | undefined,
  warmPath: WarmPath | undefined,
): string {
  const via = warmPath?.recommended_intro_person;
  const name = account?.name ?? "this account";
  switch (signal.type) {
    case "funding":
      return via
        ? `Ask ${via} to intro you to ${name} before their headcount doubles`
        : `Reach out to ${name} fresh funding means new budget`;
    case "job_posting":
      return via
        ? `${name} is hiring ${via} may know the hiring manager`
        : `${name} is scaling fast ideal timing to reach out`;
    case "leadership_change":
      return `New leadership at ${name} a warm intro now resets any past friction`;
    case "intent_topic_surge":
      return `${name} is actively researching your category strike now`;
    case "champion_job_change":
      return `Your champion moved to ${name} they're already an advocate`;
    default:
      return via
        ? `Warm path available via ${via} reach out now`
        : `New signal at ${name} warrants outreach`;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const router = useRouter();
  const { signals, accounts, warmPaths, contacts, relationshipEdges, addMessageToQueue } = useSalesStore();

  const [view, setView] = useState<"signals" | "linkedin">("signals");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [urgencyMin, setUrgencyMin] = useState(0);
  const [warmOnly, setWarmOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [decaySheetEdge, setDecaySheetEdge] = useState<RelationshipEdge | null>(null);
  const [decaySheetOpen, setDecaySheetOpen] = useState(false);
  const [champSheetSignal, setChampSheetSignal] = useState<(typeof enriched)[0] | null>(null);
  const [champSheetOpen, setChampSheetOpen] = useState(false);
  const [informedOpen, setInformedOpen] = useState(false);

  // 5-minute auto-refresh
  useEffect(() => {
    refreshTimerRef.current = setInterval(
      () => {
        // In real app: invalidate TanStack Query cache
        // For now, just a silent no-op tick
      },
      5 * 60 * 1000,
    );
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, []);

  const ARCHIVE_DAYS = 30;

  // ── Synthesize relationship_decay signals from edges ──────────────────────
  const decaySignals = useMemo(() => {
    const now = Date.now();
    return relationshipEdges
      .filter((e) => {
        const days = (now - new Date(e.last_interaction_at).getTime()) / 86_400_000;
        return days > 45;
      })
      .map((e) => {
        const days = Math.round((now - new Date(e.last_interaction_at).getTime()) / 86_400_000);
        return {
          id: `decay-${e.id}`,
          type: "relationship_decay" as const,
          account_id: "",
          title: `Connection cooling: ${e.from_name} → ${e.to_name}`,
          description: `Last interaction was ${days} days ago. This connection bridges warm paths to target accounts. Re-engage before the relationship goes cold.`,
          urgency_score: Math.min(95, 50 + Math.round(days / 3)),
          detected_at: e.last_interaction_at,
          recommended_action: `Send a genuine check-in to ${e.from_name.split(" ")[0]} not sales, just reconnecting.`,
          source: "relationship_graph",
          confidence_score: 90,
          edge: e,
        } as unknown as Signal & { edge: RelationshipEdge };
      });
  }, [relationshipEdges]);

  // Merge decay signals in when filter is "all" or "relationship_decay"
  const allSignals = useMemo(() => {
    if (typeFilter === "all" || typeFilter === "relationship_decay") {
      return [...signals, ...(decaySignals as Signal[])];
    }
    return signals;
  }, [signals, decaySignals, typeFilter]);

  const enriched = useMemo(() => {
    const now = Date.now();
    return allSignals.map((signal) => {
      const account = accounts.find((a) => a.id === signal.account_id);
      const warmPath = warmPaths.find((wp) => wp.account_id === signal.account_id);
      const contact = contacts.find((c) => c.account_id === signal.account_id);
      const agedays = (now - new Date(signal.detected_at).getTime()) / (1000 * 60 * 60 * 24);
      const hasWarmPath = !!warmPath;
      const warmthScore = warmPath?.warmth_score ?? 0;
      const actNow = computeActNow(
        signal.urgency_score,
        account?.opportunity_score ?? 50,
        warmthScore,
        hasWarmPath,
      );
      return {
        signal,
        account,
        contact,
        warmPath,
        hasWarmPath,
        warmthScore,
        actNow,
        isArchived: agedays > ARCHIVE_DAYS,
      };
    });
  }, [allSignals, accounts, warmPaths, contacts]);

  const filtered = useMemo(() => {
    return enriched
      .filter((e) => {
        const matchSearch =
          !search ||
          e.signal.title.toLowerCase().includes(search.toLowerCase()) ||
          e.account?.name.toLowerCase().includes(search.toLowerCase() ?? "");
        const matchType = typeFilter === "all" || e.signal.type === typeFilter;
        const matchUrgency = e.signal.urgency_score >= urgencyMin;
        const matchWarm = !warmOnly || e.hasWarmPath;
        const matchArchive = showArchived ? e.isArchived : !e.isArchived;
        return matchSearch && matchType && matchUrgency && matchWarm && matchArchive;
      })
      .sort((a, b) => b.actNow - a.actNow);
  }, [enriched, search, typeFilter, urgencyMin, warmOnly, showArchived]);

  const actNowSignals = filtered.filter((s) => s.signal.urgency_score >= 80);
  const watchSignals = filtered.filter(
    (s) => s.signal.urgency_score >= 50 && s.signal.urgency_score < 80,
  );
  const informedSignals = filtered.filter((s) => s.signal.urgency_score < 50);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsRefreshing(false);
    toast.success("Signal feed refreshed monitoring 50+ sources");
  };

  // Stats
  const live = enriched.filter((e) => !e.isArchived);
  const highUrgency = live.filter((e) => e.signal.urgency_score >= 85).length;
  const withWarmPath = live.filter((e) => e.hasWarmPath).length;
  const archivedCount = enriched.filter((e) => e.isArchived).length;

  const champSignals = live.filter((e) => e.signal.type === "champion_job_change");

  // ── Inline card renderer (needs component closures) ──────────────────────
  function renderSignalCard({
    signal,
    account,
    contact,
    warmPath,
    hasWarmPath,
    warmthScore,
    actNow,
    isArchived,
  }: (typeof filtered)[0]) {
    // Special rendering for relationship_decay signals
    if ((signal.type as string) === "relationship_decay") {
      const decaySignal = decaySignals.find((d) => d.id === signal.id);
      const edge = decaySignal?.edge ?? null;
      return (
        <Card
          key={signal.id}
          className={`border-l-2 border-l-brand transition-all ${isArchived ? "opacity-60" : ""} border-brand/20 bg-brand/[0.02]`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Link2Off className="w-5 h-5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${signalTypeColor(signal.type)}`}
                    >
                      {signalTypeLabel(signal.type)}
                    </Badge>
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wide">
                      Re-engage now
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(signal.detected_at)}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1 text-brand">{signal.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {signal.description}
                </p>
                <div className="flex items-start gap-1.5 mb-3">
                  <Sparkles className="w-3 h-3 text-brand flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground italic">
                    {signal.recommended_action}
                  </p>
                </div>
                {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation wrapper */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation wrapper */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1 border-brand/30 bg-brand hover:bg-brand/90 text-white"
                    onClick={() => {
                      if (edge) {
                        setDecaySheetEdge(edge);
                        setDecaySheetOpen(true);
                      } else {
                        toast.success("Opening check-in draft…");
                      }
                    }}
                  >
                    <Link2Off className="w-3 h-3" />
                    Re-engage
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Special rendering for champion_job_change signals
    if (signal.type === "champion_job_change") {
      const titleParsed = parseChampTitle(signal.title);
      const descParsed = parseChampDesc(signal.description);
      const contactName = titleParsed?.name ?? contact?.name ?? "Champion";
      const newCo = titleParsed?.newCo ?? descParsed?.newCo ?? account?.name ?? "their new company";
      const newTitle = descParsed?.newTitle ?? "";
      const thisEntry = enriched.find((e) => e.signal.id === signal.id) ?? null;
      return (
        <Card
          key={signal.id}
          className={`border-l-2 border-l-violet-500 transition-all ${isArchived ? "opacity-60" : ""} border-violet-500/20 bg-violet-500/[0.02]`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/20"
                    >
                      Champion move
                    </Badge>
                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">
                      Reach out now
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(signal.detected_at)}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1 text-violet-700 dark:text-violet-300">
                  {contactName} moved to {newCo}
                  {newTitle && <span className="font-normal"> as {newTitle}</span>}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {signal.description}
                </p>
                <div className="flex items-start gap-1.5 mb-3">
                  <Sparkles className="w-3 h-3 text-violet-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground italic">
                    Your existing relationship gives you a warm-path advantage at their new company.
                    Strike while the move is fresh.
                  </p>
                </div>
                {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation wrapper */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation wrapper */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => {
                      setChampSheetSignal(thisEntry);
                      setChampSheetOpen(true);
                    }}
                  >
                    <Trophy className="w-3 h-3" />
                    Reach out
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <Link href={`/accounts/${signal.account_id}`}>View account</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Standard signal card
    const urgency: "high" | "medium" | "low" =
      signal.urgency_score >= 85 ? "high" : signal.urgency_score >= 70 ? "medium" : "low";
    const urgencyBorder =
      urgency === "high"
        ? "border-l-red-500"
        : urgency === "medium"
          ? "border-l-brand"
          : "border-l-border/40";
    const oneLiner = SIGNAL_ONELINER[signal.type] ?? "This signal indicates buying intent.";
    const actionLine = getActionLine(signal, account, warmPath);
    const isSelected = signal.id === selectedSignalId;

    return (
      <Card
        key={signal.id}
        onClick={() => setSelectedSignalId(isSelected ? null : signal.id)}
        className={`border-l-2 ${urgencyBorder} cursor-pointer transition-all ${isArchived ? "opacity-60" : ""} ${isSelected ? "border-brand/40 bg-brand/5 shadow-sm" : "border-border/60 hover:border-border"}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand">
              {account?.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/accounts/${signal.account_id}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {account?.name ?? "Unknown account"}
                  </Link>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${signalTypeColor(signal.type)}`}
                  >
                    {signalTypeLabel(signal.type)}
                  </Badge>
                  {urgency === "high" && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                      Act now
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-center">
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        actNow >= 60
                          ? "text-red-500"
                          : actNow >= 35
                            ? "text-brand"
                            : "text-muted-foreground"
                      }`}
                    >
                      {actNow}
                    </div>
                    <div className="text-[9px] text-muted-foreground">act-now</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(signal.detected_at)}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium mb-1">{signal.title}</p>
              <div className="flex items-start gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground italic">{oneLiner}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <WarmthBadge hasWarmPath={hasWarmPath} warmthScore={warmthScore} />
                {contact && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {contact.name} · {contact.title}
                  </span>
                )}
                {warmPath && (
                  <span className="text-[10px] text-muted-foreground">
                    via {warmPath.recommended_intro_person}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-foreground mt-1 mb-2">→ {actionLine}</p>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation wrapper */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation wrapper */}
              <div
                className="flex items-center gap-2 flex-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    if (!account) return;
                    addMessageToQueue({
                      account_id: signal.account_id,
                      contact_id: contact?.id ?? "",
                      warm_path_id: warmPath?.id,
                      signal_id: signal.id,
                      channel: hasWarmPath ? "warm_intro" : "email",
                      subject: `${signal.title} — ${account.name}`,
                      body: `Hi ${contact?.name?.split(" ")[0] ?? "there"},\n\nI noticed ${signal.title.toLowerCase()} at ${account.name} and wanted to reach out.\n\n${signal.description}\n\nWould love to connect and share how we've helped similar companies.\n\nBest,\nAdhik`,
                      status: "draft",
                      approval_status: "pending",
                      generated_by_ai: true,
                      confidence_score: hasWarmPath ? 0.88 : 0.74,
                      personalization_reason: signal.description ?? signal.title,
                      factual_claims: [signal.title],
                      supporting_sources: ["WarmPath signal monitor"],
                      risk_flags: [],
                    });
                    toast.success(`Outreach drafted for ${account.name}`, {
                      description: "Review and approve it in the Approval Queue.",
                    });
                    router.push("/approval-queue");
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  Generate outreach
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                  <Link href={`/accounts/${signal.account_id}`}>View account</Link>
                </Button>
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "ghost"}
                  className={`h-7 text-xs gap-1 ml-auto ${
                    isSelected ? "" : "text-brand hover:bg-brand/10"
                  }`}
                  onClick={() => setSelectedSignalId(isSelected ? null : signal.id)}
                >
                  <GitFork className="w-3 h-3" />
                  {isSelected ? "Intel open" : "Reveal path →"}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!account) return;
                    addMessageToQueue({
                      account_id: signal.account_id,
                      contact_id: contact?.id ?? "",
                      warm_path_id: warmPath?.id,
                      signal_id: signal.id,
                      channel: hasWarmPath ? "warm_intro" : "email",
                      subject: `Re: ${signal.title} at ${account.name}`,
                      body: `Hi ${contact?.name?.split(" ")[0] ?? "there"},\n\nSaw that ${account.name} ${signal.title.toLowerCase()} — great timing to connect.\n\n${signal.description}\n\nWould you be open to a brief call?\n\nBest,\nAdhik`,
                      status: "draft",
                      approval_status: "pending",
                      generated_by_ai: true,
                      confidence_score: 0.8,
                      personalization_reason: signal.description ?? signal.title,
                      factual_claims: [signal.title],
                      supporting_sources: ["WarmPath signal monitor"],
                      risk_flags: [],
                    });
                    toast.success(`Message drafted for ${account.name}`);
                    router.push("/approval-queue");
                  }}
                >
                  Draft message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success("Added to campaign");
                  }}
                >
                  Add to campaign
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 48px)" }}>
      {/* Top section: header, alerts, stats, filters */}
      <div className="px-6 pt-4 pb-3 flex-shrink-0 border-b border-border/40 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              {view === "linkedin" ? (
                <Linkedin className="w-4 h-4 text-blue-500" />
              ) : (
                <Zap className="w-4 h-4 text-brand" />
              )}
              {view === "linkedin" ? "LinkedIn Feed" : "Signal Feed"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {view === "linkedin"
                ? "AI-tagged posts from target contacts. Generate comments or save as outreach hooks."
                : "Ranked by act-now score = urgency × opportunity × warmth. Refreshes every 5 min."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setView("signals")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                  view === "signals"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Zap className="w-3 h-3" />
                Signals
              </button>
              <button
                type="button"
                onClick={() => setView("linkedin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border-l border-border/60 transition-colors ${
                  view === "linkedin"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Linkedin className="w-3 h-3" />
                LinkedIn
              </button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5 h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Scanning…" : "Refresh"}
            </Button>
            <Button size="sm" asChild>
              <Link href="/campaigns/new">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                New campaign
              </Link>
            </Button>
          </div>
        </div>

        {/* Champion job change alert Story 1.4 */}
        {champSignals.length > 0 && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 animate-fade-up">
            <div className="flex items-start gap-3">
              <Trophy className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  {champSignals.length} champion job change{champSignals.length > 1 ? "s" : ""}{" "}
                  detected
                </p>
                <div className="mt-2 space-y-2">
                  {champSignals.slice(0, 2).map(({ signal, account: _account, contact }) => (
                    <div key={signal.id} className="flex items-center gap-3">
                      <div className="flex-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {contact?.name ?? "Champion"}
                        </span>{" "}
                        moved to a new role your relationship gives you a warm-path advantage at
                        their new company.
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 flex-shrink-0"
                        onClick={() => {
                          setChampSheetSignal(
                            champSignals.find((e) => e.signal.id === signal.id) ?? null,
                          );
                          setChampSheetOpen(true);
                        }}
                      >
                        Reach out
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Live signals", value: live.length, color: "text-foreground" },
            { label: "High urgency", value: highUrgency, color: "text-red-500" },
            { label: "Warm path coverage", value: withWarmPath, color: "text-brand" },
            { label: "Archived (30d+)", value: archivedCount, color: "text-muted-foreground" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-3 text-center">
                <div className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Input
              placeholder="Search signals or accounts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
          </div>

          {/* Signal type buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            {[
              "all",
              "funding",
              "job_posting",
              "champion_job_change",
              "pricing_page_visit",
              "leadership_change",
            ].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {t === "all" ? "All" : signalTypeLabel(t)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Urgency slider */}
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                Min urgency: {urgencyMin > 0 ? urgencyMin : "All"}
              </span>
              <input
                type="range"
                min={0}
                max={80}
                step={10}
                value={urgencyMin}
                onChange={(e) => setUrgencyMin(Number(e.target.value))}
                className="w-20 h-1 accent-brand"
              />
            </div>

            {/* Warm-path-only toggle */}
            <button
              type="button"
              onClick={() => setWarmOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium transition-colors ${
                warmOnly
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border/60 text-muted-foreground hover:border-border"
              }`}
            >
              <GitFork className="w-3 h-3" />
              Warm path only
            </button>

            {/* Archived toggle */}
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium transition-colors ${
                showArchived
                  ? "border-border bg-muted text-foreground"
                  : "border-border/60 text-muted-foreground hover:border-border"
              }`}
            >
              <Archive className="w-3 h-3" />
              {showArchived ? "Showing archived" : "Show archived"}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {filtered.length} signal{filtered.length !== 1 ? "s" : ""} · sorted by act-now score
        </p>
      </div>
      {/* end top section */}

      {/* LinkedIn feed view */}
      {view === "linkedin" && <LinkedInFeed />}

      {/* Split pane signals view */}
      {view === "signals" && (
        <div className="flex flex-1 min-h-0">
          {/* Signal list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-w-0">
            {filtered.length === 0 ? (
              <EmptyState
                variant="empty"
                title={showArchived ? "No archived signals" : "No signals match your filters"}
                description={
                  showArchived
                    ? "Signals older than 30 days will appear here."
                    : "Try widening your filters or connect integrations to unlock real-time signals."
                }
              />
            ) : (
              <div className="space-y-5">
                {/* ── Act now section ── */}
                {actNowSignals.length > 0 && (
                  <section className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600">Act now</span>
                        <Badge variant="outline" className="text-[10px]">
                          {actNowSignals.length}
                        </Badge>
                      </div>
                    </div>
                    {actNowSignals.map(renderSignalCard)}
                  </section>
                )}

                {/* ── Watch section ── */}
                {watchSignals.length > 0 && (
                  <section className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>👀</span>
                        <span className="text-sm font-semibold text-brand">Watch</span>
                        <Badge variant="outline" className="text-[10px]">
                          {watchSignals.length}
                        </Badge>
                      </div>
                    </div>
                    {watchSignals.map(renderSignalCard)}
                  </section>
                )}

                {/* ── Keep informed section (collapsible) ── */}
                {informedSignals.length > 0 && (
                  <section className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>📁</span>
                        <span className="text-sm font-semibold text-muted-foreground">
                          Keep informed
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {informedSignals.length}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInformedOpen((v) => !v)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {informedOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {informedOpen && informedSignals.map(renderSignalCard)}
                  </section>
                )}

                {/* ── Fallback for decay-only or zero-group signals ── */}
                {actNowSignals.length === 0 &&
                  watchSignals.length === 0 &&
                  informedSignals.length === 0 &&
                  filtered.map(renderSignalCard)}
              </div>
            )}
          </div>
          {/* end signal list */}

          {/* Intel panel */}
          <div className="w-[340px] flex-shrink-0 border-l border-border/50 flex flex-col bg-card/20">
            <div className="px-4 py-2.5 border-b border-border/40 flex-shrink-0">
              <h2 className="text-xs font-semibold flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-brand" />
                Live Intel
              </h2>
            </div>
            <IntelPanel signalId={selectedSignalId} />
          </div>
        </div>
      )}
      {/* end signals split pane */}

      {/* Decay re-engage sheet */}
      <DecayReEngageSheet
        edge={decaySheetEdge}
        userName="You"
        open={decaySheetOpen}
        onOpenChange={setDecaySheetOpen}
      />

      {/* Champion outreach sheet */}
      <ChampionOutreachSheet
        signal={champSheetSignal?.signal ?? null}
        open={champSheetOpen}
        onOpenChange={setChampSheetOpen}
        userName="Demo User"
      />
    </div>
  );
}
