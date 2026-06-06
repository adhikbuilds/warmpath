"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ChevronRight,
  Clock,
  Edit2,
  FlaskConical,
  GitBranch,
  GripVertical,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  Play,
  Plus,
  Settings,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSalesStore } from "@/stores/salesStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SequenceStep {
  id: string;
  stepNumber: number;
  channel: "email" | "linkedin" | "warm_intro";
  delayDays: number;
  subject: string;
  body: string;
}

type BuilderTab = "sequence" | "email-accounts" | "subsequences" | "settings";
type Phase = "name" | "builder";

type ABTest = {
  variantA: string;
  variantB: string;
  status: "idle" | "running" | "complete";
  results: {
    a: { sent: number; opens: number; replies: number };
    b: { sent: number; opens: number; replies: number };
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  linkedin: <MessageSquare className="w-3.5 h-3.5" />,
  warm_intro: <Users className="w-3.5 h-3.5" />,
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  warm_intro: "Warm Intro",
};

const DEFAULT_STEPS: SequenceStep[] = [
  {
    id: "step-1",
    stepNumber: 1,
    channel: "email",
    delayDays: 0,
    subject: "{{first_name}}, quick question re: your outbound",
    body: `Hey {{first_name}},

Came across {{company_name}} and thought the timing was right to reach out.

We help GTM teams find warm intro paths to their target accounts — most see 3–4× higher reply rates because every touch goes through a relationship, not a cold list.

Worth a 20-min call this week? Happy to show a quick demo built around {{company_name}}'s motion.

Best,
{{sender_name}}`,
  },
  {
    id: "step-2",
    stepNumber: 2,
    channel: "email",
    delayDays: 4,
    subject: "Re: following up — {{first_name}}",
    body: `Hey {{first_name}},

Just wanted to follow up on my last note — didn't want it to get buried.

If the timing isn't right, totally understand. But if there's even a 10% chance this could help {{company_name}}, a quick chat is worth it.

{{sender_name}}`,
  },
  {
    id: "step-3",
    stepNumber: 3,
    channel: "linkedin",
    delayDays: 8,
    subject: "",
    body: `Hi {{first_name}}, I sent a couple of emails about warm-path outreach — figured I'd try here too. Would love to connect if the timing is right.`,
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign, logAuditEvent } = useSalesStore();

  const [phase, setPhase] = useState<Phase>("name");
  const [campaignName, setCampaignName] = useState("");
  const [steps, setSteps] = useState<SequenceStep[]>(DEFAULT_STEPS);
  const [selectedStepIdx, setSelectedStepIdx] = useState(0);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [builderTab, setBuilderTab] = useState<BuilderTab>("sequence");
  const [launching, setLaunching] = useState(false);
  const [abTest, setAbTest] = useState<ABTest | null>(null);
  const [abVariantA, setAbVariantA] = useState("");
  const [abVariantB, setAbVariantB] = useState("");
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState({
    timezone: "Asia/Calcutta (UTC+05:30)",
    startDate: "",
    activeDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    fromTime: "09:00",
    toTime: "18:00",
    emailInterval: 20,
  });

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const selectedStep = steps[selectedStepIdx] ?? steps[0];

  // ── Launch ────────────────────────────────────────────────────────────────

  const handleLaunch = useCallback(async () => {
    if (!campaignName.trim() || steps.length === 0) return;
    setLaunching(true);
    await new Promise((r) => setTimeout(r, 1200));

    const campId = `camp-new-${Date.now()}`;
    addCampaign({
      id: campId,
      user_id: "demo-user",
      name: campaignName.trim(),
      status: "active",
      goal: "Outbound prospecting via warm paths",
      target_segment: "B2B SaaS",
      channels: ["email", "linkedin"],
      created_at: new Date().toISOString(),
      steps: steps.map((s, i) => ({
        id: s.id,
        campaign_id: campId,
        step_number: i + 1,
        channel: s.channel,
        delay_days: s.delayDays,
        template_type: "custom",
        template_hint: s.body.slice(0, 80),
        objective: s.subject || `${CHANNEL_LABELS[s.channel]} touch`,
        is_ai_generated: false,
        subject_a: s.subject,
        email_body: s.body,
      })),
      stats: {
        total_prospects: 0,
        messages_sent: 0,
        replies: 0,
        meetings_booked: 0,
        reply_rate: 0,
        meeting_rate: 0,
      },
    });

    logAuditEvent("campaign.launched", {
      entityType: "campaign",
      entityName: campaignName.trim(),
      metadata: { steps: steps.length },
    });

    toast.success(`"${campaignName}" launched`);
    router.push("/campaigns");
  }, [campaignName, steps, addCampaign, logAuditEvent, router]);

  // ── Step mutations ────────────────────────────────────────────────────────

  const saveStep = (step: SequenceStep) => {
    const subject = subjectRef.current?.value ?? step.subject;
    const body = bodyRef.current?.value ?? step.body;
    setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, subject, body } : s)));
  };

  const deleteStep = (stepId: string) => {
    setSteps((prev) => {
      const next = prev.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, stepNumber: i + 1 }));
      return next;
    });
    setSelectedStepIdx((i) => Math.max(0, i - 1));
    setEditingStepId(null);
  };

  const addStep = (channel: SequenceStep["channel"]) => {
    const newStep: SequenceStep = {
      id: `step-${Date.now()}`,
      stepNumber: steps.length + 1,
      channel,
      delayDays: steps.length * 4,
      subject: channel === "email" ? `Re: following up — {{first_name}}` : "",
      body:
        channel === "linkedin"
          ? "Hi {{first_name}}, I've tried connecting via email — figured I'd reach out here too."
          : `Hey {{first_name}},\n\nJust a quick follow-up.\n\n{{sender_name}}`,
    };
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepIdx(steps.length);
  };

  // ─── Phase: Name ───────────────────────────────────────────────────────────

  if (phase === "name") {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ height: "calc(100vh - 48px)" }}
      >
        <div className="w-full max-w-[480px] px-6">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Campaigns
            </Link>
            <h1 className="text-[26px] font-bold tracking-tight">Create a Campaign</h1>
            <p className="text-[14px] text-muted-foreground mt-1.5">
              Set up the basic information for your campaign.
            </p>
          </div>

          {/* Name input */}
          <div className="space-y-2 mb-6">
            <label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
              Campaign name
            </label>
            <Input
              autoFocus
              placeholder="e.g. US FinTech Q3 Outbound"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && campaignName.trim()) setPhase("builder");
              }}
              className="h-11 text-[14px]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex-1 h-10" asChild>
              <Link href="/campaigns">Cancel</Link>
            </Button>
            <Button
              className="flex-1 h-10"
              disabled={!campaignName.trim()}
              onClick={() => setPhase("builder")}
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-4">
            You can edit this name later in Settings.
          </p>
        </div>
      </div>
    );
  }

  // ─── Phase: Builder ────────────────────────────────────────────────────────

  const BUILDER_TABS: { key: BuilderTab; label: string; count?: number }[] = [
    { key: "sequence", label: "Sequence", count: steps.length },
    { key: "email-accounts", label: "Email Accounts" },
    { key: "subsequences", label: "SubSequences" },
    { key: "settings", label: "Settings" },
  ];

  const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 48px)" }}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 shrink-0 bg-background/95">
        <button
          type="button"
          onClick={() => setPhase("name")}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold truncate max-w-[300px]">{campaignName}</span>
          <Badge
            variant="outline"
            className="text-[10px] bg-muted/60 text-muted-foreground border-border/60 py-0"
          >
            Draft
          </Badge>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-[11px]">
            <TrendingUp className="w-3 h-3 mr-1" />
            Review
          </Button>
          <Button
            size="sm"
            className="h-7 text-[11px]"
            disabled={launching || steps.length === 0}
            onClick={handleLaunch}
          >
            {launching ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Play className="w-3 h-3 mr-1" />
            )}
            {launching ? "Launching…" : "Review and Launch"}
          </Button>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-border/50 shrink-0 px-4 bg-background">
        {BUILDER_TABS.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setBuilderTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
              builderTab === key
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {count !== undefined && (
              <span
                className={`text-[10px] font-bold ${builderTab === key ? "text-brand" : "text-muted-foreground"}`}
              >
                ({count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div
        className={`flex-1 ${builderTab === "sequence" ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {/* Sequence tab — split pane */}
        {builderTab === "sequence" && (
          <div className="flex h-full overflow-hidden">
            {/* Left: step list */}
            <div className="w-[268px] shrink-0 border-r border-border/60 flex flex-col overflow-hidden bg-card/20">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {steps.map((step, i) => {
                  const isSelected = i === selectedStepIdx;
                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: draggable
                    <div
                      key={step.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverIdx(i);
                      }}
                      onDrop={(e) => {
                        const from = Number(e.dataTransfer.getData("text/plain"));
                        if (from === i) return;
                        const next = [...steps];
                        const [moved] = next.splice(from, 1);
                        next.splice(i, 0, moved);
                        setSteps(next.map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
                        setSelectedStepIdx(i);
                        setDragOverIdx(null);
                      }}
                      onDragEnd={() => setDragOverIdx(null)}
                      className={`group relative flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-brand/40 bg-brand/8 shadow-sm"
                          : dragOverIdx === i
                            ? "border-brand/30 bg-brand/5"
                            : "border-border/50 hover:border-border/80 bg-card/50 hover:bg-card/80"
                      }`}
                      onClick={() => {
                        setSelectedStepIdx(i);
                        setEditingStepId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setSelectedStepIdx(i);
                          setEditingStepId(null);
                        }
                      }}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5 cursor-grab" />
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                          isSelected ? "bg-brand text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">
                            {CHANNEL_ICONS[step.channel]}
                          </span>
                          <p
                            className={`text-[12px] font-semibold ${isSelected ? "text-brand" : ""}`}
                          >
                            {CHANNEL_LABELS[step.channel]} Step {i + 1}
                          </p>
                        </div>
                        {step.channel === "email" && step.subject && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {step.subject}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {step.delayDays === 0 ? "Send immediately" : `Day +${step.delayDays}`}
                        </p>
                      </div>
                      {isSelected && (
                        <ChevronRight className="w-3 h-3 text-brand/60 shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })}

                {/* Add step */}
                <div className="pt-1 space-y-1">
                  {(["email", "linkedin", "warm_intro"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => addStep(ch)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border/50 hover:border-brand/40 text-[11px] text-muted-foreground hover:text-brand transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add {CHANNEL_LABELS[ch]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: inbox preview */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* Preview toolbar */}
              <div className="px-4 py-2.5 border-b border-border/40 shrink-0 flex items-center justify-between bg-card/20">
                <p className="text-[12px] font-semibold text-muted-foreground">Inbox Preview</p>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2.5"
                    onClick={() => {
                      if (!abTest)
                        setAbTest({ variantA: "", variantB: "", status: "idle", results: null });
                    }}
                  >
                    <FlaskConical className="w-3 h-3 mr-1" />
                    A/B Config
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 text-[10px] px-2.5"
                    onClick={() => {
                      if (selectedStep) {
                        saveStep(selectedStep);
                        toast.success("Step saved");
                        setEditingStepId(null);
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] px-2.5 text-red-400 border-red-400/20 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => selectedStep && deleteStep(selectedStep.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>

              {selectedStep ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* From line */}
                  <div className="flex items-center gap-3 text-[12px] border border-border/60 rounded-lg px-3 py-2.5 bg-card/30">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0 w-20">
                      SmartSend at:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-[11px] font-mono text-muted-foreground">
                        {"{{first_name}}"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {campaignName.split(" ").slice(0, 5).join(" ")} invite
                      </span>
                    </div>
                  </div>

                  {/* Subject (email only) */}
                  {selectedStep.channel === "email" && (
                    <div className="border border-border/60 rounded-lg overflow-hidden">
                      <div className="px-3.5 py-2 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                        <span className="text-[11px] font-semibold">Subject (Variant A)</span>
                        {editingStepId === selectedStep.id ? (
                          <button
                            type="button"
                            className="text-[10px] text-brand font-medium"
                            onClick={() => setEditingStepId(null)}
                          >
                            Done
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-muted transition-colors"
                            onClick={() => setEditingStepId(selectedStep.id)}
                          >
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div className="px-3.5 py-2.5">
                        <input
                          ref={subjectRef}
                          key={selectedStep.id + "-subj"}
                          defaultValue={selectedStep.subject}
                          className="w-full text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                          placeholder="Enter subject line…"
                        />
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div className="border border-border/60 rounded-lg overflow-hidden">
                    <div className="px-3.5 py-2 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                      <span className="text-[11px] font-semibold">
                        {selectedStep.channel === "email" ? "Email Body (Variant A)" : "Message"}
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={() =>
                          setEditingStepId(
                            editingStepId === selectedStep.id ? null : selectedStep.id,
                          )
                        }
                      >
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="px-3.5 py-3">
                      {editingStepId === selectedStep.id ? (
                        <div className="space-y-2">
                          <Textarea
                            ref={bodyRef}
                            key={selectedStep.id + "-body"}
                            defaultValue={selectedStep.body}
                            rows={14}
                            className="text-[12px] resize-none leading-relaxed w-full font-mono bg-background"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs px-3"
                              onClick={() => {
                                saveStep(selectedStep);
                                toast.success("Step saved");
                                setEditingStepId(null);
                              }}
                            >
                              Save step
                            </Button>
                            <div className="flex items-center gap-1.5 ml-2">
                              <span className="text-[10px] text-muted-foreground">Delay:</span>
                              <Input
                                type="number"
                                min={0}
                                defaultValue={selectedStep.delayDays}
                                onChange={(e) =>
                                  setSteps((prev) =>
                                    prev.map((s) =>
                                      s.id === selectedStep.id
                                        ? { ...s, delayDays: Number(e.target.value) }
                                        : s,
                                    ),
                                  )
                                }
                                className="h-6 w-16 text-xs"
                              />
                              <span className="text-[10px] text-muted-foreground">days</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-3 ml-auto"
                              onClick={() => setEditingStepId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <pre
                          className="text-[12px] leading-relaxed whitespace-pre-wrap text-foreground font-sans cursor-text"
                          onClick={() => setEditingStepId(selectedStep.id)}
                        >
                          {selectedStep.body}
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Variable legend */}
                  <div className="border border-border/50 rounded-lg px-4 py-3 bg-muted/10">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Available Variables
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{first_name}}",
                        "{{last_name}}",
                        "{{company_name}}",
                        "{{title}}",
                        "{{city}}",
                        "{{sender_name}}",
                        "{{connector_name}}",
                      ].map((v) => (
                        <span
                          key={v}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 bg-muted/40 text-muted-foreground font-mono"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* A/B Test panel */}
                  {abTest && (
                    <div className="border border-border/60 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/20">
                        <FlaskConical className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-[13px] font-semibold">A/B Test</h3>
                        {abTest.status === "running" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-400/10 text-amber-500 border-amber-400/20 ml-1"
                          >
                            Running
                          </Badge>
                        )}
                        {abTest.status === "complete" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 ml-1"
                          >
                            Complete
                          </Badge>
                        )}
                        <button
                          type="button"
                          className="ml-auto text-muted-foreground hover:text-foreground"
                          onClick={() => setAbTest(null)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-4">
                        {abTest.status === "idle" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                  Variant A — subject
                                </label>
                                <input
                                  value={abVariantA}
                                  onChange={(e) => setAbVariantA(e.target.value)}
                                  placeholder="Subject line A…"
                                  className="w-full h-8 px-3 rounded-md border border-border/60 bg-background text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand/40"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                  Variant B — subject
                                </label>
                                <input
                                  value={abVariantB}
                                  onChange={(e) => setAbVariantB(e.target.value)}
                                  placeholder="Subject line B…"
                                  className="w-full h-8 px-3 rounded-md border border-border/60 bg-background text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand/40"
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="h-7 text-xs px-3"
                              disabled={!abVariantA.trim() || !abVariantB.trim()}
                              onClick={() => {
                                setAbTest((p) =>
                                  p ? { ...p, status: "running", results: null } : p,
                                );
                                toast.success("A/B test launched…");
                                setTimeout(() => {
                                  setAbTest((p) =>
                                    p
                                      ? {
                                          ...p,
                                          status: "complete",
                                          results: {
                                            a: { sent: 47, opens: 22, replies: 12 },
                                            b: { sent: 47, opens: 19, replies: 8 },
                                          },
                                        }
                                      : p,
                                  );
                                  toast.success("A/B test complete — Variant A wins!");
                                }, 1500);
                              }}
                            >
                              <FlaskConical className="w-3 h-3 mr-1.5" />
                              Launch test
                            </Button>
                          </div>
                        )}
                        {abTest.status !== "idle" && (
                          <div className="grid grid-cols-2 gap-3">
                            {(["a", "b"] as const).map((key) => {
                              const result = abTest.results?.[key];
                              const otherResult = abTest.results?.[key === "a" ? "b" : "a"];
                              const rr = result ? (result.replies / result.sent) * 100 : null;
                              const orr = otherResult
                                ? (otherResult.replies / otherResult.sent) * 100
                                : null;
                              const isWinner =
                                abTest.status === "complete" &&
                                rr !== null &&
                                orr !== null &&
                                rr > orr;
                              const borderColor =
                                key === "a"
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-brand/30 bg-brand/5";
                              const labelColor = key === "a" ? "text-emerald-500" : "text-brand";
                              return (
                                <div
                                  key={key}
                                  className={`rounded-lg border p-3 relative ${borderColor}`}
                                >
                                  {isWinner && (
                                    <div className="absolute -top-2.5 right-3">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500 text-white rounded-full px-2 py-0.5">
                                        <Trophy className="w-2.5 h-2.5" />
                                        Winner
                                      </span>
                                    </div>
                                  )}
                                  <p
                                    className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${labelColor}`}
                                  >
                                    {key === "a"
                                      ? abVariantA || "Variant A"
                                      : abVariantB || "Variant B"}
                                  </p>
                                  {result ? (
                                    <div className="grid grid-cols-3 gap-1">
                                      {[
                                        { label: "Sent", value: result.sent },
                                        {
                                          label: "Opens",
                                          value: `${((result.opens / result.sent) * 100).toFixed(0)}%`,
                                        },
                                        {
                                          label: "Replies",
                                          value: `${((result.replies / result.sent) * 100).toFixed(0)}%`,
                                        },
                                      ].map((s) => (
                                        <div key={s.label} className="text-center">
                                          <div className="text-[13px] font-bold">{s.value}</div>
                                          <div className="text-[9px] text-muted-foreground">
                                            {s.label}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                      <span className="text-[11px] text-muted-foreground">
                                        Collecting…
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[13px] text-muted-foreground">
                  Select a step to preview
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Accounts tab */}
        {builderTab === "email-accounts" && (
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold">Email Accounts</h2>
              <Button size="sm" variant="outline" className="h-7 text-[11px]">
                <Plus className="w-3 h-3 mr-1" />
                Add Account
              </Button>
            </div>
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                      Vendor
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">
                      Daily Limit
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">
                      Reputation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Adhik Agarwal",
                      email: "adhik@seedlinglabs.com",
                      vendor: "Smartlead",
                      limit: 40,
                      rep: 94,
                    },
                    {
                      name: "Adhik Outreach",
                      email: "adhik.outreach@seedlinglabs.com",
                      vendor: "Smartlead",
                      limit: 35,
                      rep: 87,
                    },
                  ].map((acc) => (
                    <tr
                      key={acc.email}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/10"
                    >
                      <td className="px-4 py-3 font-medium">{acc.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{acc.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{acc.vendor}</td>
                      <td className="px-4 py-3 text-right">{acc.limit}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-semibold ${acc.rep >= 90 ? "text-emerald-500" : "text-amber-500"}`}
                        >
                          {acc.rep}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SubSequences tab */}
        {builderTab === "subsequences" && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center p-8">
            <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-[13px] font-medium">No subsequences yet</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Add branching logic based on reply behaviour.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[11px]">
              <Plus className="w-3 h-3 mr-1" />
              Add Subsequence
            </Button>
          </div>
        )}

        {/* Settings tab */}
        {builderTab === "settings" && (
          <div className="p-5 space-y-6 max-w-xl">
            <h2 className="text-[14px] font-semibold">Campaign Settings</h2>

            {/* Campaign name */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="text-[13px]"
                />
              </div>
            </div>

            {/* Send Schedule */}
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/20 border-b border-border/40">
                <h3 className="text-[13px] font-semibold">Send Schedule</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Timezone + Start date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Timezone
                    </label>
                    <select
                      value={scheduleConfig.timezone}
                      onChange={(e) =>
                        setScheduleConfig((c) => ({ ...c, timezone: e.target.value }))
                      }
                      className="w-full h-9 px-3 rounded-md border border-border/60 bg-background text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40"
                    >
                      <option>Asia/Calcutta (UTC+05:30)</option>
                      <option>America/New_York (UTC-05:00)</option>
                      <option>America/Los_Angeles (UTC-08:00)</option>
                      <option>Europe/London (UTC+00:00)</option>
                      <option>Europe/Berlin (UTC+01:00)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Campaign Start Date
                    </label>
                    <input
                      type="date"
                      value={scheduleConfig.startDate}
                      onChange={(e) =>
                        setScheduleConfig((c) => ({ ...c, startDate: e.target.value }))
                      }
                      className="w-full h-9 px-3 rounded-md border border-border/60 bg-background text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40"
                    />
                  </div>
                </div>

                {/* Active Days */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Active Days
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DAYS.map((day) => {
                      const active = scheduleConfig.activeDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setScheduleConfig((c) => ({
                              ...c,
                              activeDays: active
                                ? c.activeDays.filter((d) => d !== day)
                                : [...c.activeDays, day],
                            }))
                          }
                          className={`px-3 py-1.5 rounded-md border text-[11px] font-medium transition-all ${
                            active
                              ? "border-brand/50 bg-brand/10 text-brand"
                              : "border-border/60 text-muted-foreground hover:border-border"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sending Window */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Sending Window
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">From</p>
                      <input
                        type="time"
                        value={scheduleConfig.fromTime}
                        onChange={(e) =>
                          setScheduleConfig((c) => ({ ...c, fromTime: e.target.value }))
                        }
                        className="h-9 px-3 rounded-md border border-border/60 bg-background text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">To</p>
                      <input
                        type="time"
                        value={scheduleConfig.toTime}
                        onChange={(e) =>
                          setScheduleConfig((c) => ({ ...c, toTime: e.target.value }))
                        }
                        className="h-9 px-3 rounded-md border border-border/60 bg-background text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40"
                      />
                    </div>
                    <div className="space-y-1 ml-2">
                      <p className="text-[10px] text-muted-foreground">Every (minutes)</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={5}
                          max={120}
                          value={scheduleConfig.emailInterval}
                          onChange={(e) =>
                            setScheduleConfig((c) => ({
                              ...c,
                              emailInterval: Number(e.target.value),
                            }))
                          }
                          className="w-20 h-9 px-3 rounded-md border border-border/60 bg-background text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  AI adds 30–60 second variance for natural sending patterns
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() =>
                      setScheduleConfig({
                        timezone: "Asia/Calcutta (UTC+05:30)",
                        startDate: "",
                        activeDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                        fromTime: "09:00",
                        toTime: "18:00",
                        emailInterval: 20,
                      })
                    }
                  >
                    Reset to Defaults
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => toast.success("Schedule saved")}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
