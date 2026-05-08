"use client";

import {
  ArrowLeft,
  Bot,
  Building2,
  ChevronRight,
  GitFork,
  GripVertical,
  Loader2,
  Plus,
  Rocket,
  Send,
  Sparkles,
  Target,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSalesStore } from "@/stores/salesStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

interface SequenceStep {
  id: string;
  day: number;
  channel: string;
  objective: string;
  branchIfReplied: boolean;
}

interface CampaignConfig {
  name: string;
  goal: string;
  industries: string[];
  companySizes: string[];
  channels: string[];
  selectedAccountIds: string[];
  sequence: SequenceStep[];
  launched: boolean;
}

// ─── Static options ───────────────────────────────────────────────────────────

const GOALS = [
  { id: "book_meetings", label: "Book meetings", icon: "MTG" },
  { id: "revive_leads", label: "Revive stalled leads", icon: "REV" },
  { id: "new_segment", label: "Enter new market segment", icon: "SEG" },
  { id: "expand_accounts", label: "Expand existing accounts", icon: "EXP" },
  { id: "event_invite", label: "Drive event attendance", icon: "EVT" },
];

const INDUSTRIES = [
  "AI / SaaS",
  "FinTech",
  "HealthTech",
  "eCommerce",
  "DevTools",
  "MarTech",
  "HRTech",
  "LegalTech",
  "PropTech",
  "EdTech",
];

const SIZES = [
  { id: "1-50", label: "1–50 (Seed)" },
  { id: "51-200", label: "51–200 (Series A)" },
  { id: "201-500", label: "201–500 (Series B)" },
  { id: "501-1000", label: "501–1,000 (Late stage)" },
  { id: "1001+", label: "1,000+ (Enterprise)" },
];

const RESEARCH_STATUSES = [
  { label: "Researching LinkedIn Posts", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { label: "Scheduled & Going", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { label: "Analyzing Signals", color: "text-brand bg-brand/10 border-brand/20" },
  { label: "Warm path found", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  { label: "Drafting outreach", color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
];

// ─── Wizard step component ────────────────────────────────────────────────────

type WizardStep = "goal" | "industry" | "size" | "warmth_routing" | "sequence" | "confirm";

const STEP_ORDER: WizardStep[] = [
  "goal",
  "industry",
  "size",
  "warmth_routing",
  "sequence",
  "confirm",
];

const CHANNEL_OPTIONS = [
  { id: "warm_intro", label: "Warm intro", icon: "🤝", desc: "Route through your network" },
  { id: "email", label: "Email", icon: "✉️", desc: "Personalized warm-path email" },
  { id: "linkedin", label: "LinkedIn DM", icon: "💼", desc: "Connection + DM" },
  { id: "phone", label: "Phone call script", icon: "📞", desc: "AI-generated call script" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", desc: "WhatsApp message" },
];

function stepIndex(step: WizardStep) {
  return STEP_ORDER.indexOf(step);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignBuilderPage() {
  const router = useRouter();
  const { accounts, contacts, signals, warmPaths, logAuditEvent } = useSalesStore();

  const [config, setConfig] = useState<CampaignConfig>({
    name: "",
    goal: "",
    industries: [],
    companySizes: [],
    channels: [],
    selectedAccountIds: [],
    sequence: [],
    launched: false,
  });
  const [step, setStep] = useState<WizardStep>("goal");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [launching, setLaunching] = useState(false);
  const [seqDraggingIdx, setSeqDraggingIdx] = useState<number | null>(null);
  const [seqDragOverIdx, setSeqDragOverIdx] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Emit initial AI greeting on mount
  useEffect(() => {
    setChat([
      {
        role: "assistant",
        content:
          "Hi! I'm your campaign assistant. Let's build your next GTM play. What's the primary goal of this campaign?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  function addMessage(role: "assistant" | "user", content: string) {
    setChat((prev) => [...prev, { role, content, timestamp: new Date() }]);
  }

  // ── Filter accounts based on current config ──────────────────────────────

  const matchingAccounts = useMemo(() => {
    let filtered = [...accounts];

    if (config.industries.length > 0) {
      filtered = filtered.filter((a) =>
        config.industries.some((ind) =>
          a.industry.toLowerCase().includes(ind.toLowerCase().split(" ")[0]),
        ),
      );
    }

    if (config.companySizes.length > 0) {
      filtered = filtered.filter((a) => {
        const ec = a.employee_count;
        return config.companySizes.some((s) => {
          if (s === "1-50") return ec <= 50;
          if (s === "51-200") return ec > 50 && ec <= 200;
          if (s === "201-500") return ec > 200 && ec <= 500;
          if (s === "501-1000") return ec > 500 && ec <= 1000;
          if (s === "1001+") return ec > 1000;
          return true;
        });
      });
    }

    return filtered.sort((a, b) => b.opportunity_score - a.opportunity_score);
  }, [accounts, config.industries, config.companySizes]);

  const matchingLeads = useMemo(() => {
    const accountIds = new Set(matchingAccounts.map((a) => a.id));
    return contacts
      .filter((c) => accountIds.has(c.account_id))
      .sort((a, b) => b.warmth_score - a.warmth_score);
  }, [contacts, matchingAccounts]);

  const warmAccountCount = useMemo(
    () => matchingAccounts.filter((a) => warmPaths.some((wp) => wp.account_id === a.id)).length,
    [matchingAccounts, warmPaths],
  );

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleGoalSelect = useCallback((goalId: string, goalLabel: string) => {
    setConfig((c) => ({ ...c, goal: goalId }));
    addMessage("user", goalLabel);
    setTimeout(() => {
      addMessage(
        "assistant",
        `Great choice ${goalLabel.toLowerCase()} is one of the highest-ROI campaigns when routed through warm paths. Which industries should we target? Pick all that apply.`,
      );
      setStep("industry");
    }, 400);
  }, []);

  const handleIndustryNext = useCallback(() => {
    if (config.industries.length === 0) return;
    const label = config.industries.join(", ");
    addMessage("user", label);
    setTimeout(() => {
      addMessage("assistant", `Got it targeting ${label}. What company sizes fit your ICP?`);
      setStep("size");
    }, 400);
  }, [config.industries]);

  const handleSizeNext = useCallback(() => {
    if (config.companySizes.length === 0) return;
    const label = config.companySizes
      .map((s) => SIZES.find((x) => x.id === s)?.label ?? s)
      .join(", ");
    addMessage("user", label);
    setTimeout(() => {
      const count = matchingAccounts.length;
      addMessage(
        "assistant",
        `Found ${count} matching account${count !== 1 ? "s" : ""} in your CRM. ${warmAccountCount} have warm paths I'll route those through intro requests automatically. Review your routing plan before building the sequence.`,
      );
      setStep("warmth_routing");
    }, 400);
  }, [config.companySizes, matchingAccounts.length, warmAccountCount]);

  const handleWarmthRoutingNext = useCallback(() => {
    addMessage("user", "Routing plan confirmed");
    setTimeout(() => {
      const hasWarm = warmAccountCount > 0;
      const defaultSeq: SequenceStep[] = [
        ...(hasWarm
          ? [
              {
                id: `step-${Date.now()}-1`,
                day: 0,
                channel: "warm_intro",
                objective: "Request a warm intro through your mutual connection",
                branchIfReplied: false,
              },
            ]
          : []),
        {
          id: `step-${Date.now()}-2`,
          day: hasWarm ? 3 : 0,
          channel: "email",
          objective: "Personalized follow-up referencing the trigger signal",
          branchIfReplied: true,
        },
        {
          id: `step-${Date.now()}-3`,
          day: hasWarm ? 8 : 5,
          channel: "linkedin",
          objective: "LinkedIn DM connecting on shared context",
          branchIfReplied: true,
        },
      ];
      setConfig((c) => ({ ...c, sequence: defaultSeq }));
      addMessage(
        "assistant",
        `Here's your pre-built sequence. I've put the warm intro first for ${warmAccountCount} accounts. Drag to reorder, add steps, or tweak the objectives.`,
      );
      setStep("sequence");
    }, 400);
  }, [warmAccountCount]);

  const handleSequenceNext = useCallback(() => {
    if (config.sequence.length === 0) return;
    addMessage("user", `${config.sequence.length}-step sequence confirmed`);
    setTimeout(() => {
      addMessage(
        "assistant",
        `Sequence locked. I'll generate all assets ${matchingAccounts.length} contact${matchingAccounts.length !== 1 ? "s" : ""} × ${config.sequence.length} steps and batch them into the approval queue. Ready to launch?`,
      );
      setStep("confirm");
    }, 400);
  }, [config.sequence.length, matchingAccounts.length]);

  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    addMessage("user", "Launch campaign");
    await new Promise((r) => setTimeout(r, 1800));

    logAuditEvent("campaign.launched", {
      entityType: "campaign",
      entityName: `${GOALS.find((g) => g.id === config.goal)?.label} ${config.industries.join(", ")}`,
      metadata: {
        accounts: matchingAccounts.length,
        channels: config.sequence.map((s) => s.channel).join(","),
      },
    });

    addMessage(
      "assistant",
      `Campaign launched! Assets for ${matchingAccounts.slice(0, 5).length} accounts are being generated and will land in your approval queue shortly. I'll notify you when they're ready.`,
    );

    setLaunching(false);
    setConfig((c) => ({ ...c, launched: true }));

    toast.success("Campaign launched!", {
      description: "Assets are being generated and will appear in the approval queue.",
    });

    setTimeout(() => router.push("/approval-queue"), 2500);
  }, [config, matchingAccounts, logAuditEvent, router]);

  // ── Derived display data ──────────────────────────────────────────────────

  const displayAccounts = matchingAccounts.slice(0, 12);
  const displayLeads = matchingLeads.slice(0, 8);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 48px)" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50 flex-shrink-0 bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm">New Campaign</span>
        </div>
        {config.name && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{config.name}</span>
          </>
        )}
        {/* Step progress pills */}
        <div className="ml-auto flex items-center gap-1">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                stepIndex(step) > i
                  ? "bg-emerald-500"
                  : stepIndex(step) === i
                    ? "bg-blue-500"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left: AI chat + wizard ──────────────────────────────────────── */}
        <div className="w-[420px] flex-shrink-0 flex flex-col border-r border-border/50 bg-card/30">
          {/* Campaign name input */}
          <div className="px-5 py-3 border-b border-border/40">
            <input
              type="text"
              placeholder="Campaign name (e.g. US FinTech Q2)"
              value={config.name}
              onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
              className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 outline-none"
            />
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {chat.map((msg) => (
              <div
                key={msg.timestamp.getTime()}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-muted/60 text-foreground rounded-tl-sm"
                      : "bg-blue-500 text-white rounded-tr-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Wizard input area */}
          <div className="border-t border-border/40 p-4">
            {step === "goal" && (
              <div className="space-y-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleGoalSelect(goal.id, goal.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm text-left transition-all hover:border-blue-500/40 hover:bg-blue-500/5 ${
                      config.goal === goal.id
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-border/60 text-foreground"
                    }`}
                  >
                    <span className="text-base">{goal.icon}</span>
                    {goal.label}
                  </button>
                ))}
              </div>
            )}

            {step === "industry" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => {
                    const selected = config.industries.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            industries: selected
                              ? c.industries.filter((i) => i !== ind)
                              : [...c.industries, ind],
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          selected
                            ? "border-blue-500/50 bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {ind}
                      </button>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  className="w-full gap-2"
                  disabled={config.industries.length === 0}
                  onClick={handleIndustryNext}
                >
                  <Send className="w-3.5 h-3.5" />
                  {config.industries.length === 0
                    ? "Pick at least one industry"
                    : `Use ${config.industries.length} ${config.industries.length === 1 ? "industry" : "industries"}`}
                </Button>
              </div>
            )}

            {step === "size" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {SIZES.map((size) => {
                    const selected = config.companySizes.includes(size.id);
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            companySizes: selected
                              ? c.companySizes.filter((s) => s !== size.id)
                              : [...c.companySizes, size.id],
                          }))
                        }
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                          selected
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "border-border/60 hover:border-border text-foreground"
                        }`}
                      >
                        <Building2 className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                        {size.label}
                      </button>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  className="w-full gap-2"
                  disabled={config.companySizes.length === 0}
                  onClick={handleSizeNext}
                >
                  <Send className="w-3.5 h-3.5" />
                  Continue
                </Button>
              </div>
            )}

            {step === "warmth_routing" && (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  WarmPath routes contacts automatically based on your network coverage.
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-brand/30 bg-brand/8">
                    <GitFork className="w-4 h-4 text-brand flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold">
                        {warmAccountCount} account{warmAccountCount !== 1 ? "s" : ""} warm intro
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Step 1 will be an intro request through your mutual connection
                      </p>
                    </div>
                    <span className="text-[10px] text-brand font-semibold">Auto</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/20">
                    <Send className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold">
                        {matchingAccounts.length - warmAccountCount} account
                        {matchingAccounts.length - warmAccountCount !== 1 ? "s" : ""} direct email
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        No warm path found personalized cold email
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Override →</span>
                  </div>
                </div>
                <Button size="sm" className="w-full gap-2" onClick={handleWarmthRoutingNext}>
                  <ChevronRight className="w-3.5 h-3.5" />
                  Confirm routing · Build sequence
                </Button>
              </div>
            )}

            {step === "sequence" && (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Drag to reorder. Steps fire in day order per contact.
                </div>

                {/* AI suggestion */}
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl border border-violet-500/20 bg-violet-500/5 text-xs">
                  <Bot className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                  <p className="text-violet-600 dark:text-violet-400 text-[11px]">
                    Tip: Accounts in B2B SaaS reply best to multi-touch (3+ steps). Add a phone call
                    on day 10 to lift reply rates by ~18%.
                  </p>
                </div>

                {/* Sequence timeline */}
                <div className="space-y-2">
                  {config.sequence.map((seqStep, idx) => {
                    const ch = CHANNEL_OPTIONS.find((c) => c.id === seqStep.channel);
                    const isDragging = seqDraggingIdx === idx;
                    const isDragOver = seqDragOverIdx === idx;
                    return (
                      // biome-ignore lint/a11y/noStaticElementInteractions: draggable sequence step
                      <div
                        key={seqStep.id}
                        draggable
                        onDragStart={() => setSeqDraggingIdx(idx)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setSeqDragOverIdx(idx);
                        }}
                        onDrop={() => {
                          if (seqDraggingIdx === null || seqDraggingIdx === idx) return;
                          const next = [...config.sequence];
                          const [moved] = next.splice(seqDraggingIdx, 1);
                          next.splice(idx, 0, moved);
                          // Recompute days
                          const recomputed = next.map((s, i) => ({
                            ...s,
                            day: i === 0 ? 0 : i * 4,
                          }));
                          setConfig((c) => ({ ...c, sequence: recomputed }));
                          setSeqDraggingIdx(null);
                          setSeqDragOverIdx(null);
                        }}
                        onDragEnd={() => {
                          setSeqDraggingIdx(null);
                          setSeqDragOverIdx(null);
                        }}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs transition-all ${
                          isDragging
                            ? "opacity-40 border-dashed"
                            : isDragOver
                              ? "border-blue-500/40 bg-blue-500/5"
                              : "border-border/60 bg-card"
                        } cursor-grab active:cursor-grabbing`}
                      >
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base leading-none">{ch?.icon ?? "📧"}</span>
                            <span className="font-medium">{ch?.label ?? seqStep.channel}</span>
                            <span className="text-muted-foreground text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border/40">
                              Day {seqStep.day}
                            </span>
                            {seqStep.branchIfReplied && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                                Stop if replied
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed truncate">
                            {seqStep.objective}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              sequence: c.sequence.filter((s) => s.id !== seqStep.id),
                            }))
                          }
                          className="text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Add step */}
                <div className="flex flex-wrap gap-1.5">
                  {CHANNEL_OPTIONS.slice(0, 4).map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() =>
                        setConfig((c) => ({
                          ...c,
                          sequence: [
                            ...c.sequence,
                            {
                              id: `step-${Date.now()}`,
                              day: c.sequence.length * 4,
                              channel: ch.id,
                              objective: `${ch.label} touch`,
                              branchIfReplied: true,
                            },
                          ],
                        }))
                      }
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-dashed border-border/60 text-muted-foreground hover:border-border hover:text-foreground transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {ch.label}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="w-full gap-2"
                  disabled={config.sequence.length === 0}
                  onClick={handleSequenceNext}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  Lock sequence · {config.sequence.length} step
                  {config.sequence.length !== 1 ? "s" : ""}
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-3">
                {/* Summary chips */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {config.goal && (
                    <span className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
                      {GOALS.find((g) => g.id === config.goal)?.label}
                    </span>
                  )}
                  {config.industries.slice(0, 3).map((ind) => (
                    <span
                      key={ind}
                      className="px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border/60"
                    >
                      {ind}
                    </span>
                  ))}
                  {config.industries.length > 3 && (
                    <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border/60">
                      +{config.industries.length - 3} more
                    </span>
                  )}
                  {config.sequence.slice(0, 3).map((s) => {
                    const ch = CHANNEL_OPTIONS.find((c) => c.id === s.channel);
                    return (
                      <span
                        key={s.id}
                        className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      >
                        {ch?.icon} {ch?.label ?? s.channel} · Day {s.day}
                      </span>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Accounts", value: matchingAccounts.length, icon: Building2 },
                    { label: "Warm paths", value: warmAccountCount, icon: GitFork },
                    { label: "Leads", value: matchingLeads.length, icon: Users },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-muted/40 rounded-xl p-2.5 border border-border/40"
                    >
                      <div className="text-xl font-bold tabular-nums">{s.value}</div>
                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleLaunch}
                  disabled={launching || config.launched}
                >
                  {launching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Launching…
                    </>
                  ) : config.launched ? (
                    <>
                      <Rocket className="w-4 h-4" />
                      Launched redirecting…
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Launch campaign
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Live account + lead discovery ────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col bg-background overflow-hidden">
          {/* Identified accounts */}
          <div className="flex-1 flex flex-col border-b border-border/40 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-sm font-semibold">Identified Accounts</span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20"
                >
                  {matchingAccounts.length.toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GitFork className="w-3 h-3 text-brand" />
                  {warmAccountCount} warm paths
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-500" />
                  {
                    signals.filter((s) => matchingAccounts.some((a) => a.id === s.account_id))
                      .length
                  }{" "}
                  live signals
                </span>
              </div>
            </div>

            {matchingAccounts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                {stepIndex(step) >= 1
                  ? "No accounts match your filters yet."
                  : "Select filters to see matching accounts."}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur-sm">
                    <tr className="border-b border-border/30 text-muted-foreground">
                      <th className="text-left px-5 py-2 font-medium">Company</th>
                      <th className="text-right px-4 py-2 font-medium">Headcount</th>
                      <th className="text-left px-4 py-2 font-medium">Opp score</th>
                      <th className="text-left px-4 py-2 font-medium">Offer focus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayAccounts.map((account) => {
                      const hasWarmPath = warmPaths.some((wp) => wp.account_id === account.id);
                      const accountSignals = signals.filter((s) => s.account_id === account.id);
                      return (
                        <tr
                          key={account.id}
                          className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand flex-shrink-0">
                                {account.name[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{account.name}</p>
                                <p className="text-muted-foreground text-[10px]">
                                  {account.industry}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {account.employee_count.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${account.opportunity_score}%` }}
                                />
                              </div>
                              <span className="tabular-nums text-muted-foreground">
                                {account.opportunity_score}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              {hasWarmPath && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border border-brand/20 bg-brand/10 text-brand">
                                  <GitFork className="w-2.5 h-2.5" />
                                  Warm path
                                </span>
                              )}
                              {accountSignals.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                  <Zap className="w-2.5 h-2.5" />
                                  {accountSignals.length} signal
                                  {accountSignals.length > 1 ? "s" : ""}
                                </span>
                              )}
                              {!hasWarmPath && accountSignals.length === 0 && (
                                <span className="text-[10px] text-muted-foreground/60">Direct</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {matchingAccounts.length > 12 && (
                  <p className="text-center text-[11px] text-muted-foreground py-3">
                    +{matchingAccounts.length - 12} more accounts match your filters
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Estimated leads */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-sm font-semibold">Estimated Leads</span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20"
                >
                  {matchingLeads.length.toLocaleString()}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground">Sorted by warmth score</span>
            </div>

            {matchingLeads.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                {stepIndex(step) >= 1 ? "No leads match yet." : "Define your target to see leads."}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur-sm">
                    <tr className="border-b border-border/30 text-muted-foreground">
                      <th className="text-left px-5 py-2 font-medium">Name</th>
                      <th className="text-left px-4 py-2 font-medium">Title</th>
                      <th className="text-left px-4 py-2 font-medium">Company</th>
                      <th className="text-left px-4 py-2 font-medium">Research status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLeads.map((contact, i) => {
                      const account = accounts.find((a) => a.id === contact.account_id);
                      const status = RESEARCH_STATUSES[i % RESEARCH_STATUSES.length];
                      return (
                        <tr
                          key={contact.id}
                          className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center text-[10px] font-bold text-violet-600 dark:text-violet-400 flex-shrink-0">
                                {contact.name[0]}
                              </div>
                              <span className="font-semibold text-foreground">{contact.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground max-w-[140px] truncate">
                            {contact.title}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {account?.name ?? "-"}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {matchingLeads.length > 8 && (
                  <p className="text-center text-[11px] text-muted-foreground py-3">
                    +{matchingLeads.length - 8} more leads in this segment
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
