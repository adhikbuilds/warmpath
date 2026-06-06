"use client";

import {
  ArrowLeft,
  Bot,
  CheckCircle,
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
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSalesStore } from "@/stores/salesStore";

type Tab = "analytics" | "leads" | "email-accounts" | "sequences" | "subsequences" | "settings" | "reply-agent";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "analytics", label: "Analytics", icon: TrendingUp },
  { key: "leads", label: "Leads", icon: Users },
  { key: "email-accounts", label: "Email Accounts", icon: Mail },
  { key: "sequences", label: "Sequences", icon: Layers },
  { key: "subsequences", label: "SubSequences", icon: GitBranch },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "reply-agent", label: "Reply Agent", icon: Bot },
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

// Derived stats per email step (deterministic)
function stepStats(stepIndex: number, totalSent: number) {
  const base = Math.max(0, totalSent - stepIndex * Math.round(totalSent * 0.15));
  const seed = (stepIndex + 1) * 7;
  const opened = Math.round(base * (0.52 + ((seed % 15) * 0.01)));
  const clicked = Math.round(base * (0.08 + ((seed % 8) * 0.01)));
  const replied = Math.round(base * (0.04 + ((seed % 6) * 0.01)));
  const bounced = Math.round(base * (0.02 + ((seed % 5) * 0.005)));
  return { sent: base, opened, clicked, replied, bounced };
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { campaigns, contacts, accounts, updateCampaignStatus, updateCampaignStep } = useSalesStore();

  const [tab, setTab] = useState<Tab>("sequences");
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editDelayDays, setEditDelayDays] = useState(0);
  const [editTemplateHint, setEditTemplateHint] = useState("");
  const [abTest, setAbTest] = useState<ABTest | null>(null);
  const [abVariantA, setAbVariantA] = useState("");
  const [abVariantB, setAbVariantB] = useState("");

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

  const emailSteps = campaign.steps.filter((s) => s.channel === "email");
  const activeSequences = campaign.status === "active" ? campaign.steps.length : 0;

  // ── Analytics tab ──────────────────────────────────────────────────
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
        const label = step.channel === "email"
          ? `Email ${i + 1} — Email Outreach`
          : `Step ${i + 1} — ${step.channel.replace("_", " ")}`;
        return (
          <div key={step.id} className="border border-border/60 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold">{label}</span>
                <Badge variant="outline" className="text-[10px] py-0 h-4">
                  {step.template_hint?.slice(0, 40) ?? "No subject"}
                </Badge>
              </div>
              <button type="button" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-5 divide-x divide-border/40">
              {[
                { label: "Sent", value: st.sent, pct: null, color: "" },
                { label: "Opened", value: st.opened, pct: st.sent > 0 ? ((st.opened / st.sent) * 100).toFixed(1) + "%" : "0%", color: "" },
                { label: "Clicked", value: st.clicked, pct: st.sent > 0 ? ((st.clicked / st.sent) * 100).toFixed(1) + "%" : "0%", color: "" },
                { label: "Replied", value: st.replied, pct: st.sent > 0 ? ((st.replied / st.sent) * 100).toFixed(2) + "%" : "0%", color: st.replied > 0 ? "text-emerald-500" : "" },
                { label: "Bounced", value: st.bounced, pct: st.sent > 0 ? ((st.bounced / st.sent) * 100).toFixed(1) + "%" : "0%", color: st.bounced > 3 ? "text-red-400" : "" },
              ].map((col) => (
                <div key={col.label} className="px-5 py-4 text-center">
                  <div className={`text-[20px] font-bold leading-none ${col.color}`}>{col.value}</div>
                  {col.pct && <div className="text-[11px] text-muted-foreground mt-0.5">{col.pct}</div>}
                  <div className="text-[10px] text-muted-foreground/70 mt-1">{col.label}</div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-muted/10 border-t border-border/40">
              <p className="text-[11px] font-medium text-muted-foreground mb-2">Variants Performance</p>
              <div className="flex items-center justify-center py-4 border border-dashed border-border/50 rounded-lg text-center">
                <div>
                  <p className="text-[11px] text-muted-foreground">No variants created for this email step.</p>
                  <p className="text-[10px] text-muted-foreground/60">Add one to test different subject lines or message types.</p>
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

  // ── Leads tab ──────────────────────────────────────────────────────
  const renderLeads = () => {
    const enrolled = contacts.slice(0, Math.min(campaign.stats.total_prospects, 12));
    return (
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">
            Enrolled Leads
            <span className="ml-2 text-[12px] font-normal text-muted-foreground">
              ({campaign.stats.total_prospects})
            </span>
          </h2>
          <Button size="sm" variant="outline" className="h-7 text-[11px]">
            <Plus className="w-3 h-3 mr-1" />
            Add Leads
          </Button>
        </div>

        <div className="border border-border/60 rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Contact</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Company</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Step</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrolled.map((contact, i) => {
                const account = accounts.find((a) => a.id === contact.account_id);
                const stepNum = (i % campaign.steps.length) + 1;
                const statuses = ["Sent", "Opened", "Clicked", "Replied", "Bounced"];
                const statusColors = [
                  "text-muted-foreground",
                  "text-blue-500",
                  "text-brand",
                  "text-emerald-500",
                  "text-red-400",
                ];
                const statusIdx = i % statuses.length;
                return (
                  <tr key={contact.id} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand shrink-0">
                          {contact.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-[10px] text-muted-foreground">{contact.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{account?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">Step {stepNum}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${statusColors[statusIdx]}`}>
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

  // ── Email Accounts tab ──────────────────────────────────────────────
  const renderEmailAccounts = () => {
    const demoAccounts = [
      { name: "Adhik Agarwal", email: "adhik@seedlinglabs.com", vendor: "Smartlead", dailyLimit: 40, warmup: true, reputation: 94 },
      { name: "Adhik Outreach", email: "adhik.outreach@seedlinglabs.com", vendor: "Smartlead", dailyLimit: 35, warmup: true, reputation: 87 },
    ];
    return (
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Email Accounts ({demoAccounts.length})</h2>
          <Button size="sm" variant="outline" className="h-7 text-[11px]">
            <Plus className="w-3 h-3 mr-1" />
            Add Account
          </Button>
        </div>
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Vendor</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Daily Limit</th>
                <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Warmup</th>
                <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Reputation</th>
              </tr>
            </thead>
            <tbody>
              {demoAccounts.map((acc) => (
                <tr key={acc.email} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium">{acc.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{acc.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{acc.vendor}</td>
                  <td className="px-4 py-3 text-right">{acc.dailyLimit}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Yes
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${acc.reputation >= 90 ? "text-emerald-500" : "text-amber-500"}`}>
                      {acc.reputation}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Sequences tab ──────────────────────────────────────────────────
  const renderSequences = () => (
    <div className="p-5 space-y-4">
      {/* Sequence Flow */}
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold">Sequence Flow</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-[11px]">
            <Plus className="w-3 h-3 mr-1" />
            Add Step
          </Button>
          <Button size="sm" className="h-7 text-[11px]">
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-0">
        {campaign.steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-3 pb-4 group">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                {i + 1}
              </div>
              {i < campaign.steps.length - 1 && (
                <div className="w-px flex-1 bg-border/50 mt-1 min-h-[20px]" />
              )}
            </div>
            <div className="flex-1 pt-0.5 min-w-0">
              {editingStepId === step.id ? (
                <div className="space-y-2 border border-border/60 rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">
                      {CHANNEL_ICONS[step.channel] ?? <Mail className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[13px] font-medium capitalize">
                      {step.channel.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">Day +</span>
                    <Input
                      type="number"
                      min={0}
                      value={editDelayDays}
                      onChange={(e) => setEditDelayDays(Number(e.target.value))}
                      className="h-7 w-20 text-xs"
                    />
                  </div>
                  <Textarea
                    value={editTemplateHint}
                    onChange={(e) => setEditTemplateHint(e.target.value)}
                    className="text-xs min-h-[64px] resize-none"
                    placeholder="Template hint…"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => {
                        updateCampaignStep(campaign.id, step.id, {
                          delay_days: editDelayDays,
                          template_hint: editTemplateHint,
                        });
                        toast.success("Step updated");
                        setEditingStepId(null);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-3"
                      onClick={() => setEditingStepId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-border/50 rounded-lg p-3 bg-card/50 hover:border-border transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-muted-foreground">
                      {CHANNEL_ICONS[step.channel] ?? <Mail className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[13px] font-medium capitalize">
                      {step.channel.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {step.delay_days === 0 ? "Immediately" : `Day +${step.delay_days}`}
                    </div>
                    {step.is_ai_generated && (
                      <Badge variant="outline" className="text-[10px] bg-brand/5 text-brand border-brand/20 py-0 h-4">
                        AI-written
                      </Badge>
                    )}
                    <button
                      type="button"
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingStepId(step.id);
                        setEditDelayDays(step.delay_days);
                        setEditTemplateHint(step.template_hint ?? "");
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{step.template_hint}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* A/B Test */}
      <div className="border border-border/60 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/20">
          <FlaskConical className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold">A/B Test</h3>
          {abTest?.status === "running" && (
            <Badge variant="outline" className="text-[10px] bg-amber-400/10 text-amber-500 border-amber-400/20 ml-1">
              Running
            </Badge>
          )}
          {abTest?.status === "complete" && (
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 ml-1">
              Complete
            </Badge>
          )}
        </div>
        <div className="p-4">
          {(!abTest || abTest.status === "idle") && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Variant A
                  </label>
                  <Textarea
                    value={abVariantA}
                    onChange={(e) => setAbVariantA(e.target.value)}
                    placeholder="Hi {{first_name}}, I noticed your team is scaling fast…"
                    className="text-xs min-h-[88px] resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Variant B
                  </label>
                  <Textarea
                    value={abVariantB}
                    onChange={(e) => setAbVariantB(e.target.value)}
                    placeholder="{{first_name}}, quick question about your outbound strategy…"
                    className="text-xs min-h-[88px] resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs px-3"
                  disabled={!abVariantA.trim() || !abVariantB.trim()}
                  onClick={() => {
                    setAbTest({ variantA: abVariantA, variantB: abVariantB, status: "running", results: null });
                    toast.success("A/B test launched…");
                    setTimeout(() => {
                      setAbTest((p) =>
                        p ? { ...p, status: "complete", results: { a: { sent: 47, opens: 22, replies: 12 }, b: { sent: 47, opens: 19, replies: 8 } } } : p
                      );
                      toast.success("A/B test complete — Variant A wins!");
                    }, 1500);
                  }}
                >
                  <FlaskConical className="w-3 h-3 mr-1.5" />
                  Launch test
                </Button>
                <p className="text-[11px] text-muted-foreground">50/50 split of your prospect list</p>
              </div>
            </div>
          )}

          {abTest && abTest.status !== "idle" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(["a", "b"] as const).map((key) => {
                  const label = key === "a" ? "Variant A" : "Variant B";
                  const content = key === "a" ? abTest.variantA : abTest.variantB;
                  const result = abTest.results?.[key];
                  const otherResult = abTest.results?.[key === "a" ? "b" : "a"];
                  const rr = result ? (result.replies / result.sent) * 100 : null;
                  const orr = otherResult ? (otherResult.replies / otherResult.sent) * 100 : null;
                  const isWinner = abTest.status === "complete" && rr !== null && orr !== null && rr > orr;
                  const borderColor = key === "a" ? "border-emerald-500/30 bg-emerald-500/5" : "border-brand/30 bg-brand/5";
                  const labelColor = key === "a" ? "text-emerald-500" : "text-brand";
                  return (
                    <div key={key} className={`rounded-lg border p-3 space-y-2 relative ${borderColor}`}>
                      {isWinner && (
                        <div className="absolute -top-2.5 right-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500 text-white rounded-full px-2 py-0.5">
                            <Trophy className="w-2.5 h-2.5" />
                            Winner
                          </span>
                        </div>
                      )}
                      <p className={`text-[11px] font-semibold uppercase tracking-wide ${labelColor}`}>{label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{content}</p>
                      {result ? (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {[
                            { label: "Sent", value: result.sent },
                            { label: "Open rate", value: `${((result.opens / result.sent) * 100).toFixed(0)}%` },
                            { label: "Reply rate", value: `${((result.replies / result.sent) * 100).toFixed(0)}%` },
                          ].map((stat) => (
                            <div key={stat.label} className="text-center">
                              <div className="text-[13px] font-bold">{stat.value}</div>
                              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-[11px] text-muted-foreground">Collecting data…</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  {abTest.status === "running"
                    ? "Test is live — results will update as data comes in"
                    : "Test complete. Apply the winning variant to your full prospect list."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-3"
                  onClick={() => {
                    setAbTest(null);
                    setAbVariantA("");
                    setAbVariantB("");
                    toast.info("A/B test cleared");
                  }}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution log */}
      {campaign.stats.messages_sent > 0 && (
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/20">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Execution Log</h3>
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: Math.min(6, campaign.stats.messages_sent) }).map((_, idx) => {
              const contact = contacts[idx % contacts.length];
              const actions = ["Email sent to", "Reply received from", "Meeting booked with", "Follow-up queued for", "LinkedIn message sent to", "Intro delivered to"];
              const colors = ["bg-blue-500", "bg-emerald-500", "bg-emerald-500", "bg-amber-400", "bg-brand", "bg-teal-500"];
              const daysAgo = Math.round((14 / 6) * (6 - idx));
              const ts = new Date(Date.now() - daysAgo * 86_400_000).toLocaleDateString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              });
              return (
                <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${colors[idx % colors.length]}`} />
                  <span className="text-[12px] flex-1">{actions[idx % actions.length]} {contact?.name ?? "prospect"}</span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{ts}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ── SubSequences tab ───────────────────────────────────────────────
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

  // ── Settings tab ───────────────────────────────────────────────────
  const renderSettings = () => (
    <div className="p-5 space-y-5 max-w-lg">
      <h2 className="text-[14px] font-semibold">Campaign Settings</h2>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Name</label>
          <Input defaultValue={campaign.name} className="text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Goal</label>
          <Textarea defaultValue={campaign.goal} className="text-[13px] min-h-[80px] resize-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Target Segment</label>
          <Input defaultValue={campaign.target_segment} className="text-[13px]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`capitalize text-[11px] ${STATUS_COLORS[campaign.status]}`}>
              {campaign.status}
            </Badge>
            {campaign.status === "active" && (
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { updateCampaignStatus(campaign.id, "paused"); toast.success("Campaign paused"); }}>
                <Pause className="w-3 h-3 mr-1" /> Pause
              </Button>
            )}
            {campaign.status !== "active" && campaign.status !== "completed" && (
              <Button size="sm" className="h-7 text-[11px]" onClick={() => { updateCampaignStatus(campaign.id, "active"); toast.success("Campaign is now live"); }}>
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

  // ── Reply Agent tab ────────────────────────────────────────────────
  const renderReplyAgent = () => (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold">Reply Agent</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Let AI draft replies while you focus on closing deals.
          </p>
        </div>
        <Badge variant="outline" className="text-[11px] bg-brand/5 text-brand border-brand/20">
          Beta
        </Badge>
      </div>

      <div className="border border-border/60 rounded-xl p-4 bg-brand/5 border-brand/20 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-brand" />
        </div>
        <div>
          <p className="text-[13px] font-semibold">SmartAgents Reply AI</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Monitors replies to this campaign and drafts context-aware responses based on your tone, knowledge base, and the conversation history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Replies monitored", value: campaign.stats.replies, color: "" },
          { label: "Drafts ready", value: Math.round(campaign.stats.replies * 0.7), color: "text-brand" },
          { label: "Auto-approved", value: Math.round(campaign.stats.replies * 0.2), color: "text-emerald-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px]">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Auto-draft on reply", description: "AI drafts a reply whenever a new response arrives" },
            { label: "Require approval", description: "Every draft goes to the approval queue before sending" },
            { label: "Use knowledge base", description: "Agent pulls context from your KB when drafting" },
          ].map((cfg) => (
            <div key={cfg.label} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-medium">{cfg.label}</p>
                <p className="text-[11px] text-muted-foreground">{cfg.description}</p>
              </div>
              <button
                type="button"
                className="w-9 h-5 rounded-full bg-brand flex items-center justify-end pr-0.5 shrink-0"
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderTab = () => {
    switch (tab) {
      case "analytics": return renderAnalytics();
      case "leads": return renderLeads();
      case "email-accounts": return renderEmailAccounts();
      case "sequences": return renderSequences();
      case "subsequences": return renderSubSequences();
      case "settings": return renderSettings();
      case "reply-agent": return renderReplyAgent();
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
              <Badge variant="outline" className={`capitalize text-[11px] ${STATUS_COLORS[campaign.status]}`}>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{campaign.target_segment}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {campaign.status === "draft" && (
              <Button size="sm" className="h-7 text-[11px]" onClick={() => { updateCampaignStatus(campaign.id, "active"); toast.success(`${campaign.name} is now live`); }}>
                <Play className="w-3 h-3 mr-1" /> Launch
              </Button>
            )}
            {campaign.status === "active" && (
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { updateCampaignStatus(campaign.id, "paused"); toast.success("Campaign paused"); }}>
                <Pause className="w-3 h-3 mr-1" /> Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button size="sm" className="h-7 text-[11px]" onClick={() => { updateCampaignStatus(campaign.id, "active"); toast.success(`${campaign.name} resumed`); }}>
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
            { label: "Reply Rate", value: `${campaign.stats.reply_rate.toFixed(1)}%`, highlight: campaign.stats.reply_rate >= 20 },
            { label: "Active Sequences", value: activeSequences },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center justify-center px-4 py-2.5 flex-1 gap-0.5">
              <div className={`text-[17px] font-bold leading-none ${"highlight" in stat && stat.highlight ? "text-emerald-500" : ""}`}>
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
                  <span className={`text-[10px] font-bold ${tab === key ? "text-brand" : "text-muted-foreground"}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">{renderTab()}</div>
    </div>
  );
}
