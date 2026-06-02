"use client";

import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit2,
  FlaskConical,
  Mail,
  MessageSquare,
  Play,
  Trophy,
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

type ABTestResult = {
  sent: number;
  opens: number;
  replies: number;
};

type ABTest = {
  variantA: string;
  variantB: string;
  status: "idle" | "running" | "complete";
  results: { a: ABTestResult; b: ABTestResult } | null;
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-[#5db872]/10 text-[#3a8f4e] border-[#5db872]/20",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-brand/10 text-brand border-brand/20",
  completed: "bg-[#5db8a6]/10 text-[#3a8f7e] border-[#5db8a6]/20",
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  linkedin: <MessageSquare className="w-3.5 h-3.5" />,
  warm_intro: <Users className="w-3.5 h-3.5" />,
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { campaigns, contacts, accounts, updateCampaignStatus, updateCampaignStep } =
    useSalesStore();

  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editDelayDays, setEditDelayDays] = useState<number>(0);
  const [editTemplateHint, setEditTemplateHint] = useState<string>("");

  const [abTest, setAbTest] = useState<ABTest | null>(null);
  const [abVariantA, setAbVariantA] = useState<string>("");
  const [abVariantB, setAbVariantB] = useState<string>("");

  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign)
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Campaign not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    );

  const replyRate = campaign.stats.reply_rate;

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Campaigns
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge
              variant="outline"
              className={`capitalize text-xs ${STATUS_COLORS[campaign.status]}`}
            >
              {campaign.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{campaign.target_segment}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {campaign.status === "draft" && (
            <Button
              size="sm"
              onClick={() => {
                updateCampaignStatus(campaign.id, "active");
                toast.success(`${campaign.name} is now live`);
              }}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Launch
            </Button>
          )}
          {campaign.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateCampaignStatus(campaign.id, "paused");
                toast.success("Campaign paused");
              }}
            >
              Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button
              size="sm"
              onClick={() => {
                updateCampaignStatus(campaign.id, "active");
                toast.success(`${campaign.name} resumed`);
              }}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Prospects", value: campaign.stats.total_prospects, color: "" },
          { label: "Sent", value: campaign.stats.messages_sent, color: "" },
          { label: "Replies", value: campaign.stats.replies, color: "" },
          { label: "Meetings", value: campaign.stats.meetings_booked, color: "text-emerald-500" },
          {
            label: "Reply rate",
            value: `${replyRate.toFixed(1)}%`,
            color: replyRate >= 30 ? "text-emerald-500" : "",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaign.stats.messages_sent > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium">Campaign progress</span>
              <span className="text-muted-foreground">
                {campaign.stats.messages_sent} / {campaign.stats.total_prospects} contacted
              </span>
            </div>
            <Progress
              value={(campaign.stats.messages_sent / campaign.stats.total_prospects) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>
      )}

      {/* A/B Test */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            A/B Test
            {abTest?.status === "running" && (
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-400/10 text-amber-500 border-amber-400/20 ml-1"
              >
                Running
              </Badge>
            )}
            {abTest?.status === "complete" &&
              (() => {
                const aRate = abTest.results ? abTest.results.a.replies / abTest.results.a.sent : 0;
                const bRate = abTest.results ? abTest.results.b.replies / abTest.results.b.sent : 0;
                if (aRate > bRate)
                  return (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 ml-1"
                    >
                      Variant A winning
                    </Badge>
                  );
                if (bRate > aRate)
                  return (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-brand/10 text-brand border-brand/20 ml-1"
                    >
                      Variant B winning
                    </Badge>
                  );
                return (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-muted text-muted-foreground ml-1"
                  >
                    Complete
                  </Badge>
                );
              })()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(!abTest || abTest.status === "idle") && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="ab-variant-a"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    Variant A
                  </label>
                  <Textarea
                    id="ab-variant-a"
                    value={abVariantA}
                    onChange={(e) => setAbVariantA(e.target.value)}
                    placeholder="Hi {{first_name}}, I noticed your team is scaling fast…"
                    className="text-xs min-h-[96px] resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="ab-variant-b"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    Variant B
                  </label>
                  <Textarea
                    id="ab-variant-b"
                    value={abVariantB}
                    onChange={(e) => setAbVariantB(e.target.value)}
                    placeholder="{{first_name}}, quick question about your outbound strategy…"
                    className="text-xs min-h-[96px] resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="h-7 text-xs px-3"
                  disabled={!abVariantA.trim() || !abVariantB.trim()}
                  onClick={() => {
                    setAbTest({
                      variantA: abVariantA,
                      variantB: abVariantB,
                      status: "running",
                      results: null,
                    });
                    toast.success("A/B test launched — simulating results…");
                    setTimeout(() => {
                      setAbTest((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: "complete",
                              results: {
                                a: { sent: 47, opens: 22, replies: 12 },
                                b: { sent: 47, opens: 19, replies: 8 },
                              },
                            }
                          : prev,
                      );
                      toast.success("A/B test complete — Variant A wins!");
                    }, 1500);
                  }}
                >
                  <FlaskConical className="w-3 h-3 mr-1.5" />
                  Launch test
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Each variant will be sent to a 50/50 split of your prospect list
                </p>
              </div>
            </div>
          )}

          {abTest && abTest.status !== "idle" && (
            <div className="space-y-4">
              {/* Variant cards */}
              <div className="grid grid-cols-2 gap-3">
                {(["a", "b"] as const).map((key) => {
                  const label = key === "a" ? "Variant A" : "Variant B";
                  const content = key === "a" ? abTest.variantA : abTest.variantB;
                  const result = abTest.results?.[key];
                  const otherResult = abTest.results?.[key === "a" ? "b" : "a"];
                  const replyRateVal = result ? (result.replies / result.sent) * 100 : null;
                  const otherReplyRate = otherResult
                    ? (otherResult.replies / otherResult.sent) * 100
                    : null;
                  const isWinner =
                    abTest.status === "complete" &&
                    replyRateVal !== null &&
                    otherReplyRate !== null &&
                    replyRateVal > otherReplyRate;
                  const variantColor =
                    key === "a"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-brand/30 bg-brand/5";
                  const labelColor = key === "a" ? "text-emerald-500" : "text-brand";

                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-3 space-y-3 relative ${variantColor}`}
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
                        className={`text-[11px] font-semibold uppercase tracking-wide ${labelColor}`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {content}
                      </p>
                      {result ? (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {[
                            { label: "Sent", value: result.sent },
                            {
                              label: "Open rate",
                              value: `${((result.opens / result.sent) * 100).toFixed(0)}%`,
                            },
                            {
                              label: "Reply rate",
                              value: `${((result.replies / result.sent) * 100).toFixed(0)}%`,
                            },
                          ].map((stat) => (
                            <div key={stat.label} className="text-center">
                              <div className="text-sm font-bold">{stat.value}</div>
                              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 pt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-[11px] text-muted-foreground">
                            Collecting data…
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Split bar */}
              {abTest.results && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Variant A — {abTest.results.a.sent} sent</span>
                    <span>Variant B — {abTest.results.b.sent} sent</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden gap-px">
                    <div
                      className="bg-emerald-500 transition-all duration-700"
                      style={{
                        width: `${(abTest.results.a.sent / (abTest.results.a.sent + abTest.results.b.sent)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-brand transition-all duration-700"
                      style={{
                        width: `${(abTest.results.b.sent / (abTest.results.a.sent + abTest.results.b.sent)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
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
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sequence */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sequence steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {campaign.steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3 pb-4 group">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                  {i + 1}
                </div>
                {i < campaign.steps.length - 1 && (
                  <div className="w-px flex-1 bg-border/50 mt-1 min-h-[20px]" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                {editingStepId === step.id ? (
                  <div className="space-y-2 border border-border/60 rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground">
                        {CHANNEL_ICONS[step.channel] ?? <Mail className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {step.channel.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Day +</span>
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
                    <div className="flex items-center gap-2 pt-1">
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
                  <>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="text-muted-foreground">
                        {CHANNEL_ICONS[step.channel] ?? <Mail className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {step.channel.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Day +{step.delay_days}
                      </div>
                      {step.is_ai_generated && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-brand/5 text-brand border-brand/20"
                        >
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
                        title="Edit step"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.template_hint}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Prospects preview */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Enrolled prospects ({campaign.stats.total_prospects})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {contacts.slice(0, Math.min(5, campaign.stats.total_prospects)).map((contact) => {
            const account = accounts.find((a) => a.id === contact.account_id);
            return (
              <div key={contact.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-semibold text-brand">
                  {contact.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{contact.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {contact.title} · {account?.name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">Contacted</span>
                </div>
              </div>
            );
          })}
          {campaign.stats.total_prospects > 5 && (
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              +{campaign.stats.total_prospects - 5} more prospects
            </p>
          )}
        </CardContent>
      </Card>

      {/* Execution log */}
      {(() => {
        const logContacts = contacts.slice(0, Math.max(campaign.stats.total_prospects, 1));
        const now = Date.now();
        const DAY_MS = 86_400_000;

        const LOG_TEMPLATES = [
          (name: string) => `Email sent to ${name}`,
          (name: string) => `LinkedIn message queued for ${name}`,
          (name: string) => `Intro request approved — ${name}`,
          (name: string) => `Reply received from ${name}`,
          (name: string) => `Meeting booked with ${name}`,
          (name: string) => `Follow-up email sent to ${name}`,
          (name: string) => `Warm intro delivered to ${name}`,
          (name: string) => `LinkedIn connection accepted by ${name}`,
        ];

        type DotColor = "green" | "yellow" | "red";
        const LOG_COLORS: DotColor[] = [
          "green",
          "yellow",
          "green",
          "green",
          "green",
          "green",
          "green",
          "yellow",
        ];

        const DOT_CLASSES: Record<DotColor, string> = {
          green: "bg-emerald-500",
          yellow: "bg-amber-400",
          red: "bg-red-400",
        };

        const entries =
          campaign.stats.messages_sent === 0
            ? []
            : Array.from({ length: Math.min(8, Math.max(5, campaign.stats.messages_sent)) }).map(
                (_, idx) => {
                  const contact = logContacts[idx % logContacts.length];
                  const templateFn = LOG_TEMPLATES[idx % LOG_TEMPLATES.length];
                  const color = LOG_COLORS[idx % LOG_COLORS.length];
                  const daysAgo = Math.round((14 / 8) * (8 - idx));
                  const ts = new Date(now - daysAgo * DAY_MS);
                  const label = ts.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return { label: templateFn(contact?.name ?? "prospect"), ts: label, color };
                },
              );

        return (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Execution log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Clock className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    No activity yet — launch the campaign to start
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {entries.map((entry, idx) => (
                    <div
                      key={entry.ts + entry.label}
                      className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_CLASSES[entry.color as DotColor]}`}
                      />
                      <span className="text-xs flex-1">{entry.label}</span>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {entry.ts}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
