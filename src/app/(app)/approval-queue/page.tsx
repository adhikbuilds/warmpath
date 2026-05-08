"use client";

import {
  Building2,
  Check,
  Filter,
  GitFork,
  Linkedin,
  Mail,
  RefreshCw,
  Search,
  Sparkles,
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
}: {
  message: GeneratedMessage;
  selected: boolean;
  onSelect: () => void;
  onApprove: () => void;
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
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Warmth Score</p>
        <div className="text-4xl font-bold leading-none">{warmthScore}</div>
        <Badge variant="outline" className={cn("mt-3 border", scoreBgColor(warmthScore))}>
          {warmthLabel(warmthScore)}
        </Badge>
      </div>

      <div className="flex items-start justify-end">
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onApprove();
          }}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          Approve
        </Button>
      </div>
    </div>
  );
}

export default function ApprovalQueuePage() {
  const {
    messages,
    loading,
    approveMessage,
    rejectMessage,
    regenerateMessage,
    generatingIds,
    workspace,
  } = useSalesStore();

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
              <h1 className="text-4xl font-bold tracking-tight">Approval Queue</h1>
              <Badge variant="secondary" className="h-8 rounded-full px-3 text-sm">
                {pendingMessages.length}
              </Badge>
            </div>
            <p className="max-w-2xl text-base text-muted-foreground">
              Review AI-generated warm outreach grounded in account signals, relationship context,
              and the current workspace knowledge base for {workspace.name || "your team"}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
            <Card size="sm" className="bg-muted/15 shadow-none">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Pending
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

          <Button
            className="h-11 gap-2 bg-brand px-5 text-brand-foreground hover:bg-brand/90"
            onClick={handleApproveAll}
            disabled={filteredMessages.length === 0}
          >
            <Check className="h-4 w-4" />
            Approve All ({filteredMessages.length})
          </Button>
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
                  <span>{tab === "all" ? "All" : (CHANNEL_CONFIG[tab]?.label ?? tab)}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    {counts[tab]}
                  </span>
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
                    onApprove={() => approveMessage(message.id)}
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
