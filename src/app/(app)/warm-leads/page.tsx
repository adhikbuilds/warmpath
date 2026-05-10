"use client";

import {
  ArrowUpDown,
  Building2,
  CheckCircle,
  CheckCircle2,
  Filter,
  GitFork,
  Kanban,
  Loader2,
  MessageSquare,
  PartyPopper,
  Rows3,
  Sparkles,
  Target,
  TriangleAlert,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { GenerateMessageInput } from "@/lib/ai";
import { getAIProvider } from "@/lib/ai";
import { buildRelationshipGraph } from "@/lib/graph";
import { cn, formatRelativeTime, signalTypeColor, signalTypeLabel } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { Account, Contact, Signal, WarmPath } from "@/types";

type SortKey = "opportunity_score" | "warmth_score" | "intent_score" | "fit_score";

type PipelineStage =
  | "active"
  | "intro_sent"
  | "intro_accepted"
  | "message_sent"
  | "replied"
  | "meeting_booked";

interface PipelineItem {
  id: string;
  accountName: string;
  contactName: string;
  contactTitle: string;
  warmth: number;
  stage: PipelineStage;
  introBy: string;
  daysInStage: number;
  urgencySignal: string;
  pathNodes?: string[];
  pathExplanation?: string;
}

const STAGE_ORDER: PipelineStage[] = [
  "active",
  "intro_sent",
  "intro_accepted",
  "message_sent",
  "replied",
  "meeting_booked",
];

const COLUMN_HINTS: Record<PipelineStage, string> = {
  active: "Find the warmest path",
  intro_sent: "Waiting on your team",
  intro_accepted: "Ready to message",
  message_sent: "Awaiting their reply",
  replied: "Schedule the meeting",
  meeting_booked: "Prep the briefing",
};

const STAGE_LABELS: Record<PipelineStage, string> = {
  active: "Identified",
  intro_sent: "Intro Requested",
  intro_accepted: "Intro Accepted",
  message_sent: "Message Sent",
  replied: "Replied",
  meeting_booked: "Meeting Booked",
};

const STAGE_THEME: Record<
  PipelineStage,
  {
    band: string;
    soft: string;
    border: string;
    text: string;
    cardBorder: string;
    emptyBorder: string;
  }
> = {
  active: {
    band: "bg-[#cc785c]",
    soft: "bg-[#cc785c]/8",
    border: "border-[#cc785c]/25",
    text: "text-[#cc785c]",
    cardBorder: "border-l-[#cc785c]",
    emptyBorder: "border-[#cc785c]/20",
  },
  intro_sent: {
    band: "bg-[#e8a55a]",
    soft: "bg-[#e8a55a]/8",
    border: "border-[#e8a55a]/25",
    text: "text-[#b87f3a]",
    cardBorder: "border-l-[#e8a55a]",
    emptyBorder: "border-[#e8a55a]/20",
  },
  intro_accepted: {
    band: "bg-[#5db872]",
    soft: "bg-[#5db872]/8",
    border: "border-[#5db872]/25",
    text: "text-[#3a8f4e]",
    cardBorder: "border-l-[#5db872]",
    emptyBorder: "border-[#5db872]/20",
  },
  message_sent: {
    band: "bg-[#5db8a6]",
    soft: "bg-[#5db8a6]/8",
    border: "border-[#5db8a6]/25",
    text: "text-[#3a8f7e]",
    cardBorder: "border-l-[#5db8a6]",
    emptyBorder: "border-[#5db8a6]/20",
  },
  replied: {
    band: "bg-[#4a8a6a]",
    soft: "bg-[#4a8a6a]/8",
    border: "border-[#4a8a6a]/25",
    text: "text-[#2d6b4e]",
    cardBorder: "border-l-[#4a8a6a]",
    emptyBorder: "border-[#4a8a6a]/20",
  },
  meeting_booked: {
    band: "bg-[#7b6ea8]",
    soft: "bg-[#7b6ea8]/8",
    border: "border-[#7b6ea8]/25",
    text: "text-[#5c5180]",
    cardBorder: "border-l-[#7b6ea8]",
    emptyBorder: "border-[#7b6ea8]/20",
  },
};

const NEXT_STAGE: Record<PipelineStage, PipelineStage | null> = {
  active: "intro_sent",
  intro_sent: "intro_accepted",
  intro_accepted: "message_sent",
  message_sent: "replied",
  replied: "meeting_booked",
  meeting_booked: null,
};

/** Build PipelineItem list from store warm paths, accounts, contacts, and signals. */
function buildPipelineItems(
  warmPaths: WarmPath[],
  accounts: Account[],
  contacts: Contact[],
  signals: Signal[],
): PipelineItem[] {
  return warmPaths.map((wp) => {
    const account = accounts.find((a) => a.id === wp.account_id);
    const contact = contacts.find((c) => c.id === wp.contact_id);
    const topSignal = signals
      .filter((s) => s.account_id === wp.account_id)
      .sort((a, b) => b.urgency_score - a.urgency_score)[0];
    const pathNodes = wp.path_nodes.map((n) => n.name);
    // Map WarmPath status to PipelineStage "active" covers the unstarted state
    const stage: PipelineStage =
      wp.status === "active" ||
      wp.status === "intro_sent" ||
      wp.status === "intro_accepted" ||
      wp.status === "message_sent" ||
      wp.status === "replied"
        ? wp.status
        : "active";
    return {
      id: wp.id,
      accountName: account?.name ?? "Unknown",
      contactName: contact?.name ?? "Unknown",
      contactTitle: contact?.title ?? "",
      warmth: wp.warmth_score,
      stage,
      introBy: wp.recommended_intro_person,
      daysInStage: 0,
      urgencySignal: topSignal ? signalTypeLabel(topSignal.type) : "Active signal",
      pathNodes,
      pathExplanation: wp.path_explanation,
    };
  });
}

// ─── Compose Sheet ────────────────────────────────────────────────────────────

type ComposeChannel = "email" | "linkedin" | "warm_intro";

const CHANNEL_LABELS: Record<ComposeChannel, string> = {
  email: "Email",
  linkedin: "LinkedIn DM",
  warm_intro: "Warm intro",
};

interface ComposeSheetProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  contact: Contact | null;
  signal: Signal | null;
  warmPath: WarmPath | null;
}

function ComposeSheet({ open, onClose, account, contact, signal, warmPath }: ComposeSheetProps) {
  const { addMessageToQueue, kbItems } = useSalesStore();
  const router = useRouter();
  const [channel, setChannel] = useState<ComposeChannel>(warmPath ? "warm_intro" : "email");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [introRequest, setIntroRequest] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [personalizationReason, setPersonalizationReason] = useState("");
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [factualClaims, setFactualClaims] = useState<string[]>([]);
  const [supportingSources, setSupportingSources] = useState<string[]>([]);
  const didGenerate = useRef(false);

  useEffect(() => {
    if (!open || !account || !contact) return;
    if (didGenerate.current) return;
    didGenerate.current = true;

    setIsGenerating(true);
    setGenerated(false);
    const ai = getAIProvider();
    const input: GenerateMessageInput = {
      account,
      contact,
      signal: signal ?? undefined,
      warmPath: warmPath ?? undefined,
      channel,
      kbItems,
    };
    ai.generateMessage(input).then((result) => {
      setBody(result.body);
      setSubject(result.subject ?? "");
      setIntroRequest(result.intro_request ?? "");
      setPersonalizationReason(result.personalization_reason);
      setConfidenceScore(result.confidence_score);
      setFactualClaims(result.factual_claims);
      setSupportingSources(result.supporting_sources);
      setIsGenerating(false);
      setGenerated(true);
    });
  }, [open, account, contact, signal, warmPath, channel, kbItems]);

  function handleClose() {
    didGenerate.current = false;
    setBody("");
    setSubject("");
    setIntroRequest("");
    setGenerated(false);
    onClose();
  }

  function handleAddToQueue() {
    if (!account || !contact) return;
    addMessageToQueue({
      account_id: account.id,
      contact_id: contact.id,
      warm_path_id: warmPath?.id,
      signal_id: signal?.id,
      channel,
      subject: subject || undefined,
      body,
      intro_request: introRequest || undefined,
      status: "draft",
      approval_status: "pending",
      generated_by_ai: true,
      confidence_score: confidenceScore,
      personalization_reason: personalizationReason,
      factual_claims: factualClaims,
      supporting_sources: supportingSources,
      risk_flags: [],
    });
    toast.success(`Added to approval queue`, {
      description: `${account.name} · ${CHANNEL_LABELS[channel]}`,
      action: { label: "Review now", onClick: () => router.push("/approval-queue") },
    });
    handleClose();
  }

  if (!account || !contact) return null;

  const warmthScore = warmPath?.warmth_score ?? contact.warmth_score ?? 0;
  const via = warmPath?.recommended_intro_person;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4 text-brand" />
            Draft outreach
          </SheetTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{contact.name}</span>
            <span>·</span>
            <span>{contact.title}</span>
            <span>·</span>
            <span>{account.name}</span>
          </div>
        </SheetHeader>

        <div className="px-6 space-y-4 pb-8">
          {/* Warm path context */}
          {via && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Path
              </span>
              {warmPath?.path_nodes?.map((node, idx) => (
                <span key={node.id} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="text-muted-foreground/40">→</span>}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                      idx === 0
                        ? "bg-brand/10 text-brand"
                        : idx === (warmPath?.path_nodes?.length ?? 0) - 1
                          ? "bg-[#7b6ea8]/10 text-[#5c5180]"
                          : "bg-[#5db8a6]/10 text-[#3a8f7e]"
                    }`}
                  >
                    {node.name.split(" ")[0]}
                  </span>
                </span>
              )) ?? (
                <>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-brand/10 text-brand">
                    You
                  </span>
                  <span className="text-muted-foreground/40">→</span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#5db8a6]/10 text-[#3a8f7e]">
                    {via}
                  </span>
                  <span className="text-muted-foreground/40">→</span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#7b6ea8]/10 text-[#5c5180]">
                    {contact.name.split(" ")[0]}
                  </span>
                </>
              )}
              <span className="ml-1 text-[10px] text-muted-foreground">warmth {warmthScore}</span>
            </div>
          )}

          {/* Signal trigger */}
          {signal && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40">
              <Zap className="w-3.5 h-3.5 text-brand flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-medium mr-1.5 ${signalTypeColor(signal.type)}`}>
                  {signalTypeLabel(signal.type)}
                </span>
                <span className="text-[11px] text-muted-foreground">{signal.title}</span>
              </div>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatRelativeTime(signal.detected_at)}
              </span>
            </div>
          )}

          {/* Channel selector */}
          <div className="flex items-center gap-1.5">
            {(["email", "linkedin", "warm_intro"] as ComposeChannel[])
              .filter((c) => c !== "warm_intro" || !!via)
              .map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    channel === c
                      ? "bg-foreground text-background border-foreground"
                      : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {CHANNEL_LABELS[c]}
                </button>
              ))}
          </div>

          {/* Generated content */}
          {isGenerating && (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span className="text-sm text-muted-foreground">Drafting personalized message…</span>
            </div>
          )}

          {generated && (
            <div className="space-y-3">
              {subject && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Subject
                  </p>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}

              {channel === "warm_intro" && introRequest && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Message to {via ?? "connector"}
                  </p>
                  <Textarea
                    value={introRequest}
                    onChange={(e) => setIntroRequest(e.target.value)}
                    className="resize-none text-xs h-28"
                  />
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {channel === "warm_intro" ? "Follow-up to prospect" : "Message body"}
                </p>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="resize-none text-xs h-48"
                />
              </div>

              {personalizationReason && (
                <p className="text-[11px] text-muted-foreground italic border-l-2 border-brand/30 pl-3 leading-relaxed">
                  {personalizationReason}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {generated && (
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 gap-1.5" onClick={handleAddToQueue}>
                <CheckCircle className="w-3.5 h-3.5" />
                Add to approval queue
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Discard
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WarmthBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "#f59e0b" : value >= 60 ? "#3b82f6" : value >= 40 ? "#64748b" : "#334155";
  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
      style={{ background: color }}
    />
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80
      ? "text-brand bg-brand/10 border-brand/20"
      : value >= 60
        ? "text-[#5db8a6] bg-[#5db8a6]/10 border-[#5db8a6]/20"
        : "text-muted-foreground bg-muted/50 border-border/40";
  return (
    <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${color}`}>
      <span className="font-medium">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

function ContactAvatar({ name, warmth }: { name: string; warmth: number }) {
  const bg =
    warmth >= 70
      ? "bg-brand/20 text-brand"
      : warmth >= 40
        ? "bg-[#5db8a6]/20 text-[#3a8f7e]"
        : "bg-muted text-muted-foreground";
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${bg}`}
    >
      {name[0]}
    </div>
  );
}

function WarmthMeter({ value }: { value: number }) {
  const color = value >= 70 ? "#f59e0b" : value >= 40 ? "#3b82f6" : "#64748b";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function WarmLeadsPage() {
  const {
    accounts,
    contacts,
    signals,
    warmPaths,
    relationshipEdges,
    teamMembers,
    createFollowUpTask,
  } = useSalesStore();

  const [view, setView] = useState<"list" | "pipeline">("list");
  const [focusMode, setFocusMode] = useState(false);

  // Compose sheet state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeAccount, setComposeAccount] = useState<(typeof accounts)[0] | null>(null);
  const [composeContact, setComposeContact] = useState<(typeof contacts)[0] | null>(null);
  const [composeSignal, setComposeSignal] = useState<(typeof signals)[0] | null>(null);
  const [composeWarmPath, setComposeWarmPath] = useState<(typeof warmPaths)[0] | null>(null);

  // List view state
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("opportunity_score");
  const [industryFilter, setIndustryFilter] = useState("all");

  // Pipeline view state initialised from real store warm paths
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>(() =>
    buildPipelineItems(warmPaths, accounts, contacts, signals),
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [introDialogOpen, setIntroDialogOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

  const selectedCard = pipelineItems.find((p) => p.id === selectedCardId) ?? null;

  const { graph, sourceIds } = useMemo(() => {
    const teamNodes = teamMembers.map((tm) => ({
      id: tm.id,
      name: tm.name,
      type: "team_member" as const,
    }));
    const g = buildRelationshipGraph(relationshipEdges, teamNodes);
    return { graph: g, sourceIds: teamMembers.map((t) => t.id) };
  }, [relationshipEdges, teamMembers]);

  const industries = ["all", ...new Set(accounts.map((a) => a.industry))];

  const filteredAccounts = accounts
    .filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.industry.toLowerCase().includes(search.toLowerCase());
      const matchIndustry = industryFilter === "all" || a.industry === industryFilter;
      if (!matchSearch || !matchIndustry) return false;
      if (focusMode && view === "list") {
        const hasWarmPath = warmPaths.some((wp) => wp.account_id === a.id);
        const hasUrgentSignal = signals.some((s) => s.account_id === a.id && s.urgency_score >= 70);
        return hasWarmPath && hasUrgentSignal;
      }
      return true;
    })
    .sort((a, b) => b[sortKey] - a[sortKey]);

  function advanceStage(id: string) {
    setPipelineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = NEXT_STAGE[item.stage];
        if (!next) return item;

        if (next === "intro_sent") {
          createFollowUpTask({
            type: "follow_up",
            title: `Check if ${item.introBy} sent intro to ${item.contactName}`,
            description: `Intro request was just sent. Follow up with ${item.introBy} in 3 days to confirm they forwarded the intro to ${item.contactName} at ${item.accountName}.`,
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            warm_path_id: item.id,
            contact_name: item.contactName,
            account_name: item.accountName,
            introducer_name: item.introBy,
          });
          toast.success(`Intro request sent 3-day follow-up task created`);
        } else if (next === "intro_accepted") {
          toast.success(`Intro accepted by ${item.contactName} draft your follow-up now!`, {
            duration: 6000,
            action: {
              label: "Draft message",
              onClick: () => toast.info("Opening message editor…"),
            },
          });
        } else {
          toast.success(`Moved ${item.contactName} to ${STAGE_LABELS[next]}`);
        }

        return { ...item, stage: next, daysInStage: 0 };
      }),
    );
  }

  function dropToStage(targetStage: PipelineStage) {
    if (!draggingId) return;
    const item = pipelineItems.find((p) => p.id === draggingId);
    if (!item || item.stage === targetStage) return;

    setPipelineItems((prev) =>
      prev.map((p) => (p.id === draggingId ? { ...p, stage: targetStage, daysInStage: 0 } : p)),
    );
    toast.success(`Moved ${item.contactName} → ${STAGE_LABELS[targetStage]}`);

    if (targetStage === "intro_sent") {
      createFollowUpTask({
        type: "follow_up",
        title: `Check if ${item.introBy} sent intro to ${item.contactName}`,
        description: `Follow up with ${item.introBy} to confirm they forwarded the intro to ${item.contactName} at ${item.accountName}.`,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        warm_path_id: item.id,
        contact_name: item.contactName,
        account_name: item.accountName,
        introducer_name: item.introBy,
      });
    } else if (targetStage === "intro_accepted") {
      toast.success(`Intro accepted draft your follow-up now!`, {
        duration: 5000,
        action: { label: "Draft message", onClick: () => toast.info("Opening message editor…") },
      });
    }

    setDraggingId(null);
    setDragOverStage(null);
  }

  const filteredPipelineItems = pipelineItems.filter((item) => {
    const matchTeam =
      teamFilter === "all" ||
      (teamFilter === "you" ? item.introBy === "You" : item.introBy === teamFilter);
    const matchUrgency = urgencyFilter === "all" || item.daysInStage <= 2;
    if (!matchTeam || !matchUrgency) return false;
    if (focusMode && view === "pipeline") {
      const inFocusStage = item.stage === "active" || item.stage === "intro_sent";
      return inFocusStage;
    }
    return true;
  });

  const columnCounts = STAGE_ORDER.reduce(
    (acc, stage) => {
      acc[stage] = filteredPipelineItems.filter((p) => p.stage === stage).length;
      return acc;
    },
    {} as Record<PipelineStage, number>,
  );

  const metricsInFlight = pipelineItems.filter(
    (p) => p.stage !== "active" && p.stage !== "meeting_booked",
  ).length;
  const metricsAccepted = pipelineItems.filter((p) => p.stage === "intro_accepted").length;
  const metricsBooked = pipelineItems.filter((p) => p.stage === "meeting_booked").length;

  function handleCardClick(id: string) {
    setSelectedCardId(id);
    setSheetOpen(true);
  }

  const introTemplate = selectedCard
    ? `Subject: Quick intro ${selectedCard.contactName} at ${selectedCard.accountName}

Hi ${selectedCard.introBy},

Would you be open to a quick intro to ${selectedCard.contactName} at ${selectedCard.accountName}?
We've been tracking their expansion signals and think there's a strong fit for WarmPath.
Happy to give you more context first.

Thanks,
[Your name]`
    : "";

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            Warm Leads
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked by opportunity score warmth × intent × fit. Agent monitors 50+ signals 24/7.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                view === "list"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Rows3 className="w-3.5 h-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setView("pipeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border-l border-border/60 ${
                view === "pipeline"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Pipeline
            </button>
          </div>
          <Button
            size="sm"
            variant={focusMode ? "default" : "outline"}
            className="h-8 gap-1.5"
            onClick={() => setFocusMode((f) => !f)}
          >
            <Target className="w-3.5 h-3.5" />
            {focusMode ? "Focus: ON" : "Focus mode"}
          </Button>
          {view === "list" && (
            <Button size="sm" onClick={() => toast.info("Creating campaign from warm leads…")}>
              Create campaign
            </Button>
          )}
        </div>
      </div>

      {/* ── LIST VIEW ──────────────────────────────────────────────────────────── */}
      {view === "list" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-2.5 flex-wrap animate-fade-up delay-1">
            <div className="relative flex-1 max-w-xs">
              <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search accounts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i === "all" ? "All industries" : i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-[190px] h-8 text-sm">
                <ArrowUpDown className="w-3 h-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opportunity_score">Hottest first</SelectItem>
                <SelectItem value="warmth_score">Strongest warm path</SelectItem>
                <SelectItem value="intent_score">Highest intent</SelectItem>
                <SelectItem value="fit_score">Best ICP fit</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Leads grid */}
          <div className="grid gap-2.5 animate-fade-up delay-2">
            {filteredAccounts.length === 0 ? (
              <EmptyState
                variant="no-results"
                title="No accounts found"
                description="Try adjusting your search or industry filter."
                action={{
                  label: "Clear filters",
                  onClick: () => {
                    setSearch("");
                    setIndustryFilter("all");
                  },
                }}
              />
            ) : (
              filteredAccounts.map((account, idx) => {
                const accountContacts = contacts.filter((c) => c.account_id === account.id);
                const accountSignals = signals.filter((s) => s.account_id === account.id);
                const topContact = accountContacts.sort(
                  (a, b) => b.warmth_score - a.warmth_score,
                )[0];
                const topSignal = accountSignals.sort(
                  (a, b) => b.urgency_score - a.urgency_score,
                )[0];

                const computedPath =
                  topContact && sourceIds.length > 0
                    ? (() => {
                        let best = null;
                        for (const sid of sourceIds) {
                          const paths = graph.findPaths(sid, topContact.id, 3, 1);
                          if (
                            paths.length > 0 &&
                            (!best || paths[0].warmth > (best as { warmth: number }).warmth)
                          ) {
                            best = paths[0];
                          }
                        }
                        return best;
                      })()
                    : null;

                const hasWarmPath = !!computedPath;
                const storeWarmPath = warmPaths.find((wp) => wp.account_id === account.id);

                return (
                  <Card
                    key={account.id}
                    className={`border-border/60 hover:border-border/80 transition-all animate-fade-up relative overflow-hidden ${
                      account.warmth_score >= 80 ? "warm-glow" : ""
                    }`}
                    style={{ animationDelay: `${idx * 0.035}s` }}
                  >
                    <WarmthBar value={account.warmth_score} />
                    <CardContent className="p-4 pl-5">
                      <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-sm font-bold text-muted-foreground">
                          {account.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div>
                              <Link
                                href={`/accounts/${account.id}`}
                                className="font-semibold text-sm hover:underline"
                              >
                                {account.name}
                              </Link>
                              <span className="text-xs text-muted-foreground ml-2">
                                {account.industry}
                              </span>
                              <span className="text-xs text-muted-foreground mx-1.5">·</span>
                              <span className="text-xs text-muted-foreground">
                                {account.employee_count} employees
                              </span>
                              <span className="text-xs text-muted-foreground mx-1.5">·</span>
                              <span className="text-xs text-muted-foreground">
                                {account.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <ScorePill label="Fit" value={account.fit_score} />
                              <ScorePill label="Intent" value={account.intent_score} />
                              <ScorePill label="Warmth" value={account.warmth_score} />
                            </div>
                          </div>
                          {topContact && (
                            <p className="text-[11px] text-muted-foreground mb-1.5">
                              Target:{" "}
                              <span className="text-foreground font-medium">{topContact.name}</span>
                              {" · "}
                              {topContact.title}
                            </p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            {topSignal && (
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-brand" />
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${signalTypeColor(topSignal.type)}`}
                                >
                                  {signalTypeLabel(topSignal.type)}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {topSignal.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  · {formatRelativeTime(topSignal.detected_at)}
                                </span>
                              </div>
                            )}
                            {computedPath ? (
                              <div className="flex flex-col gap-0.5 ml-auto">
                                <div className="flex items-center gap-1.5">
                                  <GitFork className="w-3 h-3 text-brand flex-shrink-0" />
                                  <span className="text-[11px] text-brand font-medium">
                                    {computedPath.warmth} warmth
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {computedPath.nodes.map((n, ni) => (
                                      <span key={n.id} className="flex items-center gap-1">
                                        {ni > 0 && (
                                          <span className="text-muted-foreground/40 text-[10px]">
                                            →
                                          </span>
                                        )}
                                        <span
                                          className={`text-[11px] ${
                                            ni === 0
                                              ? "text-brand"
                                              : ni === computedPath.nodes.length - 1
                                                ? "text-[#7b6ea8]"
                                                : "text-[#5db8a6]"
                                          }`}
                                        >
                                          {n.name.split(" ")[0]}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">
                                  {storeWarmPath?.path_explanation?.slice(0, 55) ??
                                    "No direct connection"}
                                </p>
                              </div>
                            ) : topContact ? (
                              <div className="flex flex-col gap-0.5 ml-auto">
                                <div className="flex items-center gap-1.5">
                                  <GitFork className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                                  <span className="text-[11px] text-muted-foreground">
                                    No warm path cold outreach only
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">
                                  No direct connection
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 px-3"
                            onClick={() => toast.success(`Message drafted for ${account.name}`)}
                            disabled={!hasWarmPath}
                          >
                            <MessageSquare className="w-3 h-3" />
                            {hasWarmPath ? "Generate" : "Cold"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-3" asChild>
                            <Link href={`/accounts/${account.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── PIPELINE VIEW ─────────────────────────────────────────────────────── */}
      {view === "pipeline" && (
        <>
          <div className="animate-fade-up delay-1 rounded-[28px] border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border/60 bg-muted/15 px-5 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Kanban className="w-4 h-4 text-brand" />
                    <h2 className="text-base font-semibold">Warm Pipeline Board</h2>
                    <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-semibold text-white">
                      {filteredPipelineItems.length} active cards
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Track every intro from identified contact to booked meeting. Drag cards between
                    stages as outreach progresses.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[460px]">
                  <div className="rounded-2xl border border-border/60 bg-background px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      In Flight
                    </p>
                    <p className="mt-1 text-2xl font-bold">{metricsInFlight}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Accepted
                    </p>
                    <p className="mt-1 text-2xl font-bold">{metricsAccepted}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Meetings
                    </p>
                    <p className="mt-1 text-2xl font-bold">{metricsBooked}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-border/60 px-5 py-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[180px] h-9 text-sm bg-background">
                    <SelectValue placeholder="Team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All team members</SelectItem>
                    <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                    <SelectItem value="Mark Johnson">Mark Johnson</SelectItem>
                    <SelectItem value="you">You</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-[180px] h-9 text-sm bg-background">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All urgency</SelectItem>
                    <SelectItem value="high">High urgency only</SelectItem>
                  </SelectContent>
                </Select>
                <div className="ml-auto text-xs text-muted-foreground">
                  {filteredPipelineItems.length} path
                  {filteredPipelineItems.length !== 1 ? "s" : ""} in pipeline
                </div>
              </div>
            </div>

            <div className="overflow-x-auto bg-[#fbfbfc] pb-5 pt-4 animate-fade-up delay-2">
              <div className="flex min-w-max gap-3 px-4">
                {STAGE_ORDER.map((stage) => {
                  const stageItems = filteredPipelineItems.filter((p) => p.stage === stage);
                  const theme = STAGE_THEME[stage];
                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: kanban drop zone
                    <div
                      key={stage}
                      className={`w-[278px] flex-shrink-0 transition-all ${
                        dragOverStage === stage && draggingId ? "opacity-90" : ""
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverStage(stage);
                      }}
                      onDragLeave={() => setDragOverStage(null)}
                      onDrop={() => dropToStage(stage)}
                    >
                      <div
                        className={cn(
                          "rounded-[20px] border bg-white p-3 transition-colors",
                          theme.border,
                          dragOverStage === stage && draggingId && "ring-2 ring-brand/20",
                        )}
                      >
                        <div
                          className={cn(
                            "mb-3 rounded-xl px-3 py-2 text-white shadow-sm",
                            theme.band,
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{STAGE_LABELS[stage]}</span>
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                              {columnCounts[stage]}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-white/85">{COLUMN_HINTS[stage]}</p>
                        </div>

                        <div className="space-y-2">
                          {stageItems.length === 0 && !draggingId && (
                            <div
                              className={cn(
                                "flex h-20 items-center justify-center rounded-xl border border-dashed bg-background text-center",
                                theme.emptyBorder,
                              )}
                            >
                              <span className="text-[11px] text-muted-foreground">
                                No cards yet
                              </span>
                            </div>
                          )}
                          {stageItems.length === 0 && draggingId && (
                            <div
                              className={cn(
                                "rounded-xl border border-dashed bg-background p-5 text-center transition-colors",
                                dragOverStage === stage
                                  ? "border-brand/40 bg-brand/5"
                                  : theme.emptyBorder,
                              )}
                            >
                              <p className="text-[11px] text-muted-foreground/70">Drop here</p>
                            </div>
                          )}

                          {stageItems.map((item) => {
                            const nextStage = NEXT_STAGE[item.stage];
                            const isStale = item.daysInStage > 7;
                            const isDragging = draggingId === item.id;
                            return (
                              // biome-ignore lint/a11y/noStaticElementInteractions: draggable kanban card
                              // biome-ignore lint/a11y/useKeyWithClickEvents: drag handles keyboard via buttons inside
                              <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => {
                                  setDraggingId(item.id);
                                  e.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => {
                                  setDraggingId(null);
                                  setDragOverStage(null);
                                }}
                                className={cn(
                                  "cursor-grab rounded-xl border border-border/60 bg-white p-3 text-left shadow-sm transition-all active:cursor-grabbing",
                                  theme.cardBorder,
                                  "border-l-[3px]",
                                  isDragging
                                    ? "scale-95 border-brand/40 opacity-40 shadow-lg"
                                    : "hover:-translate-y-0.5 hover:border-border/90 hover:shadow-md",
                                )}
                                onClick={() => handleCardClick(item.id)}
                              >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                      {item.contactName}
                                    </p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                      {item.contactTitle}
                                    </p>
                                  </div>
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-1 text-[10px] font-semibold",
                                      item.warmth >= 80
                                        ? "bg-emerald-100 text-emerald-700"
                                        : item.warmth >= 65
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-slate-100 text-slate-600",
                                    )}
                                  >
                                    {item.warmth}
                                  </span>
                                </div>

                                <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <Building2 className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{item.accountName}</span>
                                </div>

                                <div className="mb-2 rounded-lg bg-muted/25 px-2.5 py-2">
                                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                    Warm Path
                                  </p>
                                  <p className="mt-1 text-[11px] font-medium text-foreground">
                                    via {item.introBy}
                                  </p>
                                  {item.pathNodes && item.pathNodes.length > 0 && (
                                    <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                                      {item.pathNodes.join(" → ")}
                                    </p>
                                  )}
                                </div>

                                <div className="mb-2">
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-2 py-1 text-[10px] font-medium",
                                      theme.soft,
                                      theme.text,
                                    )}
                                  >
                                    {item.urgencySignal}
                                  </span>
                                </div>

                                <div className="mb-3 flex items-center justify-between gap-2 text-[10px]">
                                  <span
                                    className={
                                      isStale ? "font-medium text-red-500" : "text-muted-foreground"
                                    }
                                  >
                                    {item.daysInStage === 0
                                      ? "Just moved"
                                      : `${item.daysInStage} day${item.daysInStage !== 1 ? "s" : ""} in stage`}
                                  </span>
                                  {isStale && (
                                    <TriangleAlert className="h-3.5 w-3.5 text-red-500" />
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 flex-1 text-[10px]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.info(`Drafting message for ${item.contactName}…`);
                                    }}
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    Draft
                                  </Button>
                                  {nextStage ? (
                                    <Button
                                      size="sm"
                                      className="h-7 flex-1 text-[10px]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        advanceStage(item.id);
                                      }}
                                    >
                                      Move
                                    </Button>
                                  ) : (
                                    <div className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-[10px] font-medium text-emerald-700">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Booked
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── DETAIL SHEET ──────────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px] overflow-y-auto">
          {selectedCard && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <ContactAvatar name={selectedCard.contactName} warmth={selectedCard.warmth} />
                  <div>
                    <SheetTitle className="text-base">{selectedCard.contactName}</SheetTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedCard.contactTitle} · {selectedCard.accountName}
                    </p>
                  </div>
                </div>
              </SheetHeader>

              <div className="px-6 space-y-5">
                {/* Intro accepted banner */}
                {selectedCard.stage === "intro_accepted" && (
                  <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <PartyPopper className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-600">Intro accepted!</p>
                      <p className="text-[11px] text-emerald-700/80 mt-0.5">
                        {selectedCard.contactName} accepted the intro from {selectedCard.introBy}.
                        Draft a follow-up message now while the connection is warm.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() =>
                          toast.info(`Drafting follow-up for ${selectedCard.contactName}…`)
                        }
                      >
                        Draft follow-up message
                      </Button>
                    </div>
                  </div>
                )}

                {/* Warmth score */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Warmth score
                  </p>
                  <WarmthMeter value={selectedCard.warmth} />
                </div>

                {/* Warm path */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Warm path
                  </p>
                  {selectedCard.pathNodes && selectedCard.pathNodes.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedCard.pathNodes.map((node, idx) => (
                        <span key={node} className="flex items-center gap-1.5">
                          {idx > 0 && <span className="text-muted-foreground/40 text-xs">→</span>}
                          <span
                            className={`text-xs px-2 py-1 rounded border font-medium ${
                              idx === 0
                                ? "bg-brand/10 text-brand border-brand/20"
                                : idx === selectedCard.pathNodes!.length - 1
                                  ? "bg-[#7b6ea8]/10 text-[#5c5180] border-[#7b6ea8]/20"
                                  : "bg-[#5db8a6]/10 text-[#3a8f7e] border-[#5db8a6]/20"
                            }`}
                          >
                            {node}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No path data available</p>
                  )}
                  {selectedCard.pathExplanation && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {selectedCard.pathExplanation}
                    </p>
                  )}
                </div>

                {/* Current stage */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Current stage
                  </p>
                  <span className="text-xs px-2 py-1 rounded bg-muted border border-border/60 font-medium">
                    {STAGE_LABELS[selectedCard.stage]}
                  </span>
                </div>

                {/* Conversation timeline */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Timeline
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        text: `Intro requested to ${selectedCard.introBy}`,
                        when: `${selectedCard.daysInStage + 3} days ago`,
                      },
                      {
                        text: `${selectedCard.introBy} forwarded intro`,
                        when: `${Math.max(1, selectedCard.daysInStage + 1)} days ago`,
                      },
                      selectedCard.stage !== "active" && selectedCard.stage !== "intro_sent"
                        ? {
                            text: `Intro accepted by ${selectedCard.contactName}`,
                            when: `${selectedCard.daysInStage} days ago`,
                          }
                        : null,
                    ]
                      .filter(Boolean)
                      .map((entry) => (
                        <div key={entry!.text} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs">{entry!.text}</p>
                            <p className="text-[10px] text-muted-foreground">{entry!.when}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Urgency signal */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                    Urgency signal
                  </p>
                  <span className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-600 border border-violet-500/20">
                    {selectedCard.urgencySignal}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  <Dialog open={introDialogOpen} onOpenChange={setIntroDialogOpen}>
                    <Button className="w-full" size="sm" onClick={() => setIntroDialogOpen(true)}>
                      Draft intro request
                    </Button>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Intro request to {selectedCard.introBy}</DialogTitle>
                      </DialogHeader>
                      <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-border/40">
                        {introTemplate}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            navigator.clipboard.writeText(introTemplate);
                            toast.success("Copied to clipboard");
                          }}
                        >
                          Copy to clipboard
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            advanceStage(selectedCard.id);
                            setIntroDialogOpen(false);
                            setSheetOpen(false);
                            toast.success(
                              `Marked as sent moved to ${STAGE_LABELS["intro_sent"]}`,
                            );
                          }}
                        >
                          Mark as sent
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      toast.info(`Drafting follow-up for ${selectedCard.contactName}…`)
                    }
                  >
                    Draft follow-up
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      toast.success("Outcome logged");
                      setSheetOpen(false);
                    }}
                  >
                    Log outcome
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
