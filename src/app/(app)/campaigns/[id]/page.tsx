"use client";

import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Edit2,
  FlaskConical,
  GitBranch,
  Layers,
  Mail,
  MessageSquare,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { use, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSalesStore } from "@/stores/salesStore";
import type { Campaign, CampaignStep } from "@/types";

type Tab = "analytics" | "leads" | "email-accounts" | "sequences" | "subsequences" | "settings";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "analytics", label: "Analytics", icon: TrendingUp },
  { key: "leads", label: "Leads", icon: Users },
  { key: "email-accounts", label: "Email Accounts", icon: Mail },
  { key: "sequences", label: "Sequences", icon: Layers },
  { key: "subsequences", label: "SubSequences", icon: GitBranch },
  { key: "settings", label: "Settings", icon: Settings },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  draft: "bg-muted text-muted-foreground border-border/60",
  paused: "bg-brand/10 text-brand border-brand/20",
  completed: "bg-teal-500/10 text-teal-600 border-teal-500/20",
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  linkedin: <MessageSquare className="w-3.5 h-3.5" />,
  warm_intro: <Users className="w-3.5 h-3.5" />,
};

type ABTestResult = { sent: number; opens: number; replies: number };
type ABTest = {
  variantA: string;
  variantB: string;
  status: "idle" | "running" | "complete";
  results: { a: ABTestResult; b: ABTestResult } | null;
};

// ── Email preview helpers ───────────────────────────────────────────────────

function getStepLabel(step: CampaignStep, index: number) {
  if (step.channel === "email") return `Email Step ${index + 1}`;
  if (step.channel === "linkedin") return `LinkedIn Step ${index + 1}`;
  if (step.channel === "warm_intro") return `Warm Intro ${index + 1}`;
  return `Step ${index + 1}`;
}

function getSubjectA(step: CampaignStep, campaign: Campaign): string {
  if (step.subject_a) return step.subject_a;
  const base = campaign.name.split(" ").slice(0, 4).join(" ");
  const subjectMap: Record<string, string> = {
    warm_intro: `Intro request — {{first_name}} at {{company_name}}`,
  };
  if (subjectMap[step.channel]) return subjectMap[step.channel];
  const idx = step.step_number;
  if (idx === 1) return `{{first_name}}, quick question re: ${base}`;
  if (idx === 2) return `Re: following up — ${base}`;
  if (idx === 3) return `Last touch — {{first_name}}`;
  return `Re: ${base} — thought this might help`;
}

function getSubjectB(step: CampaignStep, campaign: Campaign): string {
  if (step.subject_b) return step.subject_b;
  const base = campaign.name.split(" ").slice(0, 3).join(" ");
  const idx = step.step_number;
  if (idx === 1) return `${base} — worth 15 mins, {{first_name}}?`;
  if (idx === 2) return `{{first_name}} — did my last note land?`;
  if (idx === 3) return `Closing the loop — {{first_name}}`;
  return `${base} update for {{company_name}}`;
}

function getEmailBody(step: CampaignStep, campaign: Campaign): string {
  if (step.email_body) return step.email_body;
  if (step.channel === "warm_intro") {
    return `Hey {{connector_name}},

Hope you're doing well! Quick ask — I noticed you're connected to {{first_name}} ({{title}} at {{company_name}}).

${campaign.goal}.

Given your relationship, a quick "Hey {{first_name}}, you should talk to [us]" would mean a lot. Happy to make it easy on you — just say the word.

Thanks!`;
  }

  const idx = step.step_number;

  if (idx === 1) {
    return `Hey {{first_name}},

${campaign.target_segment ? `Saw that {{company_name}} is ${campaign.target_segment.toLowerCase().includes("hiring") ? "actively hiring" : "in the right space for this"}.` : "Came across {{company_name}} and thought the timing was right to reach out."}

${campaign.goal}.

Most teams we work with see 3–4x higher reply rates vs cold email because every message goes through the warmest path in your network.

Worth a 20-min call this week? Happy to show a demo built around {{company_name}}'s specific motion.

Best,
{{sender_name}}`;
  }

  if (idx === 2) {
    return `Hey {{first_name}},

Just wanted to follow up on my note from a few days ago — didn't want it to get buried.

${campaign.goal}.

If the timing isn't right, totally understand — just let me know and I'll close the loop. But if there's even a 10% chance this could help {{company_name}}, it's worth a quick chat.

{{sender_name}}`;
  }

  if (idx === 3) {
    return `{{first_name}},

I've tried reaching out a couple of times — I'll take the hint if this isn't the right moment!

I'll leave you with one thought: ${campaign.goal?.toLowerCase() ?? "we help teams like yours 3x their outbound results"}.

If that ever becomes a priority, my calendar is at [link]. Happy to reconnect whenever the time is right.

Take care,
{{sender_name}}`;
  }

  return `Hey {{first_name}},

Just a quick value-add — ${step.template_hint ?? "thought this might be relevant to you"}.

Happy to chat if useful.

{{sender_name}}`;
}

// ── Derived stats ─────────────────────────────────────────────────────────────

function stepStats(stepIndex: number, totalSent: number) {
  const base = Math.max(0, totalSent - stepIndex * Math.round(totalSent * 0.15));
  const seed = (stepIndex + 1) * 7;
  return {
    sent: base,
    opened: Math.round(base * (0.52 + (seed % 15) * 0.01)),
    clicked: Math.round(base * (0.08 + (seed % 8) * 0.01)),
    replied: Math.round(base * (0.04 + (seed % 6) * 0.01)),
    bounced: Math.round(base * (0.02 + (seed % 5) * 0.005)),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    campaigns,
    contacts,
    accounts,
    updateCampaignStatus,
    updateCampaignStep,
    deleteCampaignStep,
  } = useSalesStore();

  const [tab, setTab] = useState<Tab>("sequences");
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editDelayDays, setEditDelayDays] = useState(0);
  const [editTemplateHint, setEditTemplateHint] = useState("");
  const [abTest, setAbTest] = useState<ABTest | null>(null);
  const [abVariantA, setAbVariantA] = useState("");
  const [abVariantB, setAbVariantB] = useState("");

  const subjectARef = useRef<HTMLInputElement>(null);
  const subjectBRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <p className="text-[13px]">Campaign not found.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to campaigns
          </Link>
        </Button>
      </div>
    );
  }

  const activeSequences = campaign.status === "active" ? campaign.steps.length : 0;

  const saveSelectedStep = (step: CampaignStep) => {
    updateCampaignStep(campaign.id, step.id, {
      delay_days: editDelayDays,
      template_hint: editTemplateHint,
      subject_a: subjectARef.current?.value ?? step.subject_a,
      subject_b: subjectBRef.current?.value ?? step.subject_b,
      email_body: bodyRef.current?.value ?? step.email_body,
    });
  };

  // ── Analytics tab ──────────────────────────────────────────────────────────
  const renderAnalytics = () => (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold">Sequence Analytics &amp; Management</h2>
        <Button size="sm" variant="outline" className="h-7 text-[11px]">
          <Plus className="w-3 h-3 mr-1" />
          Add Sequence
        </Button>
      </div>

      {campaign.steps.map((step, i) => {
        const st = stepStats(i, campaign.stats.messages_sent);
        const label =
          step.channel === "email"
            ? `Email ${i + 1} — Email Outreach`
            : `Step ${i + 1} — ${step.channel.replace("_", " ")}`;
        return (
          <div key={step.id} className="border border-border/60 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold">{label}</span>
                <Badge variant="outline" className="text-[10px] py-0 h-4 max-w-[240px] truncate">
                  {getSubjectA(step, campaign)}
                </Badge>
              </div>
              <button
                type="button"
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-5 divide-x divide-border/40">
              {[
                { label: "Sent", value: st.sent, pct: null, color: "" },
                {
                  label: "Opened",
                  value: st.opened,
                  pct: st.sent > 0 ? `${((st.opened / st.sent) * 100).toFixed(1)}%` : "0%",
                  color: "",
                },
                {
                  label: "Clicked",
                  value: st.clicked,
                  pct: st.sent > 0 ? `${((st.clicked / st.sent) * 100).toFixed(1)}%` : "0%",
                  color: "",
                },
                {
                  label: "Replied",
                  value: st.replied,
                  pct: st.sent > 0 ? `${((st.replied / st.sent) * 100).toFixed(2)}%` : "0%",
                  color: st.replied > 0 ? "text-emerald-500" : "",
                },
                {
                  label: "Bounced",
                  value: st.bounced,
                  pct: st.sent > 0 ? `${((st.bounced / st.sent) * 100).toFixed(1)}%` : "0%",
                  color: st.bounced > 3 ? "text-red-400" : "",
                },
              ].map((col) => (
                <div key={col.label} className="px-5 py-4 text-center">
                  <div className={`text-[20px] font-bold leading-none ${col.color}`}>
                    {col.value}
                  </div>
                  {col.pct && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">{col.pct}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground/70 mt-1">{col.label}</div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-muted/10 border-t border-border/40">
              <p className="text-[11px] font-medium text-muted-foreground mb-2">
                Variants Performance
              </p>
              <div className="flex items-center justify-center py-4 border border-dashed border-border/50 rounded-lg text-center">
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    No variants created for this email step.
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    Add one to test different subject lines or message types.
                  </p>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] mt-2">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Variant
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {campaign.steps.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center text-muted-foreground gap-2">
          <Layers className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-[13px]">No sequences yet</p>
        </div>
      )}
    </div>
  );

  // ── Leads tab ──────────────────────────────────────────────────────────────
  const renderLeads = () => {
    // Prefer contacts imported from LinkedIn (have linkedin_url) matching campaign segment
    const liContacts = contacts.filter((c) => c.linkedin_url);
    const enrolled =
      liContacts.length > 0
        ? liContacts.slice(0, 50)
        : contacts.slice(0, Math.min(campaign.stats.total_prospects, 12));

    return (
      <div className="p-5 space-y-3 overflow-y-auto h-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold">
              Enrolled Leads
              <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                ({enrolled.length}
                {liContacts.length > 50 ? ` of ${liContacts.length}` : ""})
              </span>
            </h2>
            {liContacts.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Imported from LinkedIn — filtered by ICP match
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[11px]">
            <Plus className="w-3 h-3 mr-1" />
            Add Leads
          </Button>
        </div>
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                  Contact
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                  Company
                </th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Step</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {enrolled.map((contact, i) => {
                const account = accounts.find((a) => a.id === contact.account_id);
                // For LinkedIn-imported contacts, derive company from email domain or linkedin_url
                const companyName =
                  account?.name ?? contact.account_id.replace(/^li-acc-/, "").replace(/-/g, " ");
                const stepNum = (i % Math.max(campaign.steps.length, 1)) + 1;
                const statuses = ["Queued", "Sent", "Opened", "Replied", "Bounced"];
                const statusColors = [
                  "text-muted-foreground",
                  "text-blue-500",
                  "text-blue-400",
                  "text-emerald-500",
                  "text-red-400",
                ];
                const statusIdx = i % statuses.length;
                const initials = contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);
                const hues = [
                  "bg-brand/10 text-brand",
                  "bg-emerald-500/10 text-emerald-500",
                  "bg-amber-500/10 text-amber-500",
                  "bg-pink-500/10 text-pink-500",
                ];
                const avatarClass = hues[i % hues.length];
                return (
                  <tr
                    key={contact.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/10"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarClass}`}
                        >
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{contact.name}</p>
                            {contact.linkedin_url && (
                              <a
                                href={contact.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-muted-foreground/50 hover:text-brand transition-colors"
                              >
                                ↗
                              </a>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                            {contact.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-[11px]">
                      {companyName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground text-[11px]">Step {stepNum}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium text-[11px] ${statusColors[statusIdx]}`}>
                        {statuses[statusIdx]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Email Accounts tab ─────────────────────────────────────────────────────
  const renderEmailAccounts = () => {
    return (
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Email Accounts</h2>
          <Button size="sm" variant="outline" className="h-7 text-[11px]">
            <Plus className="w-3 h-3 mr-1" />
            Add Account
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center border border-border/60 rounded-xl bg-muted/10">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Mail className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[13px] font-medium">No email accounts connected</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
              Connect a sending account (e.g. Smartlead, Instantly) to start sending from this
              campaign.
            </p>
          </div>
          <Button size="sm" className="h-7 text-[11px] mt-1">
            <Plus className="w-3 h-3 mr-1" />
            Connect Account
          </Button>
        </div>
      </div>
    );
  };

  // ── Sequences tab — split-pane layout ──────────────────────────────────────
  const renderSequences = () => {
    const selectedStep = campaign.steps[selectedStepIndex] ?? campaign.steps[0];

    return (
      <div className="flex h-full overflow-hidden">
        {/* ── Left: Step list ───────────────────────────────────────────── */}
        <div className="w-[268px] shrink-0 border-r border-border/60 flex flex-col overflow-hidden bg-card/20">
          {/* "View Sequence Analytics" banner */}
          <button
            type="button"
            onClick={() => setTab("analytics")}
            className="flex items-start gap-2.5 px-4 py-3 border-b border-border/40 bg-brand/5 hover:bg-brand/10 transition-colors text-left group shrink-0"
          >
            <TrendingUp className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-brand">View Sequence Analytics</p>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Check performance metrics, open rates, and reply rates
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-brand/60 group-hover:text-brand transition-colors mt-0.5 shrink-0" />
          </button>

          {/* Step cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {campaign.steps.map((step, i) => {
              const isSelected = i === selectedStepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    setSelectedStepIndex(i);
                    setEditingStepId(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-brand/40 bg-brand/8 shadow-sm"
                      : "border-border/50 hover:border-border/80 bg-card/50 hover:bg-card/80"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        isSelected ? "bg-brand text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-semibold ${isSelected ? "text-brand" : ""}`}>
                        {getStepLabel(step, i)}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        Subject: {getSubjectA(step, campaign)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {step.delay_days === 0 ? "Send immediately" : `Day +${step.delay_days}`}
                      </p>
                    </div>
                    {isSelected && <ChevronRight className="w-3 h-3 text-brand/60 shrink-0 mt-1" />}
                  </div>
                </button>
              );
            })}

            {/* Add step */}
            <button
              type="button"
              className="w-full p-3 rounded-lg border border-dashed border-border/50 hover:border-brand/40 text-[11px] text-muted-foreground hover:text-brand transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Sequence
            </button>
          </div>
        </div>

        {/* ── Right: Inbox preview + A/B test ───────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Toolbar */}
          <div className="px-4 py-2.5 border-b border-border/40 shrink-0 flex items-center justify-between bg-card/20">
            <p className="text-[12px] font-semibold text-muted-foreground">Inbox Preview</p>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] px-2.5"
                onClick={() => {
                  if (!abTest) {
                    setAbTest({ variantA: "", variantB: "", status: "idle", results: null });
                  }
                }}
              >
                <FlaskConical className="w-3 h-3 mr-1" />
                A/B Config
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2.5">
                Preview
              </Button>
              <Button
                size="sm"
                className="h-6 text-[10px] px-2.5"
                onClick={() => {
                  if (selectedStep) {
                    saveSelectedStep(selectedStep);
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
                onClick={() => {
                  if (selectedStep) {
                    deleteCampaignStep(campaign.id, selectedStep.id);
                    setSelectedStepIndex(Math.max(0, selectedStepIndex - 1));
                    setEditingStepId(null);
                    toast.success("Step deleted");
                  }
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {selectedStep ? (
              <div className="p-4 space-y-4">
                {/* SmartSend from line */}
                <div className="flex items-center gap-3 text-[12px] border border-border/60 rounded-lg px-3 py-2.5 bg-card/30">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0 w-24">
                    SmartSend at:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-[11px] font-mono text-muted-foreground">
                      {"{{first_name}}"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {campaign.name.split(" ").slice(0, 5).join(" ")} invite
                    </span>
                  </div>
                </div>

                {/* Subject Variant A */}
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
                        onClick={() => {
                          setEditingStepId(selectedStep.id);
                          setEditDelayDays(selectedStep.delay_days);
                          setEditTemplateHint(selectedStep.template_hint ?? "");
                        }}
                      >
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  <div className="px-3.5 py-2.5">
                    <input
                      ref={subjectARef}
                      key={selectedStep.id + "-subj-a"}
                      defaultValue={getSubjectA(selectedStep, campaign)}
                      className="w-full text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                      placeholder="Enter subject line…"
                    />
                  </div>
                </div>

                {/* Subject Variant B (only if A/B active) */}
                {abTest && (
                  <div className="border border-brand/30 rounded-lg overflow-hidden">
                    <div className="px-3.5 py-2 bg-brand/5 border-b border-brand/20 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-brand">
                        Subject (Variant B)
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="px-3.5 py-2.5">
                      <input
                        ref={subjectBRef}
                        key={selectedStep.id + "-subj-b"}
                        defaultValue={getSubjectB(selectedStep, campaign)}
                        className="w-full text-[12px] bg-transparent outline-none text-foreground"
                      />
                    </div>
                  </div>
                )}

                {/* Email Body Variant A */}
                <div className="border border-border/60 rounded-lg overflow-hidden">
                  <div className="px-3.5 py-2 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                    <span className="text-[11px] font-semibold">Email Body (Variant A)</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {editingStepId === selectedStep.id ? (
                          <span className="text-[10px] text-brand">Editing</span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={() => setEditingStepId(selectedStep.id)}
                      >
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="px-3.5 py-3">
                    {editingStepId === selectedStep.id ? (
                      <div className="space-y-2">
                        <Textarea
                          ref={bodyRef}
                          key={selectedStep.id + "-body"}
                          defaultValue={getEmailBody(selectedStep, campaign)}
                          rows={14}
                          className="text-[12px] resize-none leading-relaxed w-full font-mono bg-background"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs px-3"
                            onClick={() => {
                              saveSelectedStep(selectedStep);
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
                              value={editDelayDays}
                              onChange={(e) => setEditDelayDays(Number(e.target.value))}
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
                        {getEmailBody(selectedStep, campaign)}
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
                        className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => setAbTest(null)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
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
                          <div className="flex items-center gap-2">
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
                            <p className="text-[11px] text-muted-foreground">50/50 split</p>
                          </div>
                        </div>
                      )}

                      {abTest.status !== "idle" && (
                        <div className="space-y-3">
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
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Execution log */}
                {campaign.stats.messages_sent > 0 && (
                  <div className="border border-border/60 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/20">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-[13px] font-semibold">Execution Log</h3>
                    </div>
                    <div className="divide-y divide-border/40">
                      {Array.from({ length: Math.min(6, campaign.stats.messages_sent) }).map(
                        (_, idx) => {
                          const contact = contacts[idx % contacts.length];
                          const actions = [
                            "Email sent to",
                            "Reply received from",
                            "Meeting booked with",
                            "Follow-up queued for",
                            "LinkedIn message sent to",
                            "Intro delivered to",
                          ];
                          const colors = [
                            "bg-blue-500",
                            "bg-emerald-500",
                            "bg-emerald-500",
                            "bg-amber-400",
                            "bg-brand",
                            "bg-teal-500",
                          ];
                          const daysAgo = Math.round((14 / 6) * (6 - idx));
                          const ts = new Date(Date.now() - daysAgo * 86_400_000).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          );
                          return (
                            <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${colors[idx % colors.length]}`}
                              />
                              <span className="text-[12px] flex-1">
                                {actions[idx % actions.length]} {contact?.name ?? "prospect"}
                              </span>
                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {ts}
                              </span>
                            </div>
                          );
                        },
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
      </div>
    );
  };

  // ── SubSequences tab ───────────────────────────────────────────────────────
  const renderSubSequences = () => (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center p-8">
      <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
        <GitBranch className="w-6 h-6 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-[13px] font-semibold">SubSequences</p>
        <p className="text-[12px] text-muted-foreground mt-1">
          Branch sequences based on prospect behaviour — coming soon.
        </p>
      </div>
      <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled>
        Coming soon
      </Button>
    </div>
  );

  // ── Settings tab ───────────────────────────────────────────────────────────
  const renderSettings = () => (
    <div className="p-5 space-y-5 max-w-lg">
      <h2 className="text-[14px] font-semibold">Campaign Settings</h2>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Name
          </label>
          <Input defaultValue={campaign.name} className="text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Goal
          </label>
          <Textarea defaultValue={campaign.goal} className="text-[13px] min-h-[80px] resize-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Target Segment
          </label>
          <Input defaultValue={campaign.target_segment} className="text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Status
          </label>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`capitalize text-[11px] ${STATUS_COLORS[campaign.status]}`}
            >
              {campaign.status}
            </Badge>
            {campaign.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => {
                  updateCampaignStatus(campaign.id, "paused");
                  toast.success("Campaign paused");
                }}
              >
                <Pause className="w-3 h-3 mr-1" /> Pause
              </Button>
            )}
            {campaign.status !== "active" && campaign.status !== "completed" && (
              <Button
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => {
                  updateCampaignStatus(campaign.id, "active");
                  toast.success("Campaign is now live");
                }}
              >
                <Play className="w-3 h-3 mr-1" /> Activate
              </Button>
            )}
          </div>
        </div>
      </div>
      <Button size="sm" onClick={() => toast.success("Settings saved")} className="mt-2">
        Save changes
      </Button>
    </div>
  );

  const renderTab = () => {
    switch (tab) {
      case "analytics":
        return renderAnalytics();
      case "leads":
        return renderLeads();
      case "email-accounts":
        return renderEmailAccounts();
      case "sequences":
        return renderSequences();
      case "subsequences":
        return renderSubSequences();
      case "settings":
        return renderSettings();
    }
  };

  const tabCounts: Partial<Record<Tab, number>> = {
    leads: campaign.stats.total_prospects,
    sequences: campaign.steps.length,
    "email-accounts": 2,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Campaign header */}
      <div className="border-b border-border/60 px-5 pt-4 pb-0 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Campaigns
            </Link>
          </Button>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
          <span className="text-[12px] text-muted-foreground truncate">{campaign.name}</span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[16px] font-bold tracking-tight truncate">{campaign.name}</h1>
              <Badge
                variant="outline"
                className={`capitalize text-[11px] ${STATUS_COLORS[campaign.status]}`}
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {campaign.target_segment}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {campaign.status === "draft" && (
              <Button
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => {
                  updateCampaignStatus(campaign.id, "active");
                  toast.success(`${campaign.name} is now live`);
                }}
              >
                <Play className="w-3 h-3 mr-1" /> Launch
              </Button>
            )}
            {campaign.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => {
                  updateCampaignStatus(campaign.id, "paused");
                  toast.success("Campaign paused");
                }}
              >
                <Pause className="w-3 h-3 mr-1" /> Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => {
                  updateCampaignStatus(campaign.id, "active");
                  toast.success(`${campaign.name} resumed`);
                }}
              >
                <Play className="w-3 h-3 mr-1" /> Resume
              </Button>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-stretch divide-x divide-border/40 rounded-xl border border-border/50 bg-card/40 overflow-hidden mb-3">
          {[
            { label: "Prospects", value: campaign.stats.total_prospects },
            { label: "Sent", value: campaign.stats.messages_sent },
            { label: "Replies", value: campaign.stats.replies },
            { label: "Meetings", value: campaign.stats.meetings_booked },
            {
              label: "Reply Rate",
              value: `${campaign.stats.reply_rate.toFixed(1)}%`,
              highlight: campaign.stats.reply_rate >= 20,
            },
            { label: "Active Sequences", value: activeSequences },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center px-4 py-2.5 flex-1 gap-0.5"
            >
              <div
                className={`text-[17px] font-bold leading-none ${"highlight" in stat && stat.highlight ? "text-emerald-500" : ""}`}
              >
                {stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 -mx-5 px-5">
          {TABS.map(({ key, label }) => {
            const count = tabCounts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-3.5 py-2.5 text-[12px] font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
                  tab === key
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {count !== undefined && (
                  <span
                    className={`text-[10px] font-bold ${tab === key ? "text-brand" : "text-muted-foreground"}`}
                  >
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content — sequences uses overflow-hidden for split pane */}
      <div className={`flex-1 ${tab === "sequences" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {renderTab()}
      </div>
    </div>
  );
}
