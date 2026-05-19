"use client";

import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Handshake,
  Mail,
  MessageCircle,
  Pause,
  Phone,
  Play,
  Plus,
  Radio,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CHANNEL_CONFIG } from "@/lib/constants";
import { useSalesStore } from "@/stores/salesStore";

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  call: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
  linkedin: Users,
  meta_ads: Radio,
  warm_intro: Handshake,
  task: CheckCircle2,
};

type StatusFilter = "all" | "active" | "draft" | "paused" | "completed";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
  draft: "Draft",
  paused: "Paused",
  completed: "Completed",
};

// Prospect initials per campaign — neutral chips, no rainbow
const PROSPECT_CHIPS: Record<string, string[]> = {
  "camp-1": ["SA", "MJ", "KL", "TR", "WP", "JD", "SK"],
  "camp-2": ["BH", "CM", "YP", "DG", "LR", "MK"],
  "camp-3": ["NW", "AK", "EF", "QR", "JT"],
};

export default function CampaignsPage() {
  const { campaigns, campaignRecommendations, updateCampaignStatus } = useSalesStore();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const topRec = campaignRecommendations[0];

  const filtered = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  const totalProspects = campaigns.reduce((s, c) => s + c.stats.total_prospects, 0);
  const totalReplies = campaigns.reduce((s, c) => s + c.stats.replies, 0);
  const totalMeetings = campaigns.reduce((s, c) => s + c.stats.meetings_booked, 0);
  const avgReplyRate =
    campaigns.length > 0
      ? campaigns.reduce((s, c) => s + c.stats.reply_rate, 0) / campaigns.length
      : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 px-6 pt-5 pb-4 flex-shrink-0">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-[18px] font-bold tracking-tight">Sequences</h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                1:1 outreach — every message crafted individually, every warm intro approved by your
                connector.
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/campaigns/new">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                New sequence
              </Link>
            </Button>
          </div>

          {/* KPI strip */}
          <div className="flex items-stretch divide-x divide-border/60 rounded-xl border border-border/50 bg-card/40 overflow-hidden">
            {[
              {
                icon: Play,
                label: "Active",
                value: campaigns.filter((c) => c.status === "active").length,
                highlight: true,
              },
              { icon: Users, label: "In sequence", value: totalProspects, highlight: false },
              {
                icon: MessageCircle,
                label: "Conversations",
                value: totalReplies,
                highlight: false,
              },
              { icon: CalendarCheck, label: "Meetings", value: totalMeetings, highlight: false },
              {
                icon: TrendingUp,
                label: "Avg reply rate",
                value: `${avgReplyRate.toFixed(1)}%`,
                highlight: avgReplyRate >= 20,
              },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="flex items-center gap-2.5 px-4 py-3 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <div
                      className={`text-[17px] font-bold leading-none ${kpi.highlight ? "text-brand" : ""}`}
                    >
                      {kpi.value}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-[1100px] mx-auto space-y-4">
          {/* AI Recommendation */}
          {topRec && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 flex items-center gap-3 animate-fade-up">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                    AI suggestion
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-brand/10 text-brand border-brand/20 py-0 h-4"
                  >
                    {topRec.time_to_launch_minutes}min to launch
                  </Badge>
                </div>
                <p className="font-semibold text-[13px] truncate">{topRec.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{topRec.reason}</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0" asChild>
                <Link href="/campaigns/new">
                  Start this <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-0.5 border-b border-border/40 -mb-2">
            {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((s) => {
              const count =
                s === "all" ? campaigns.length : campaigns.filter((c) => c.status === s).length;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={`px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors -mb-px ${
                    filter === s
                      ? "border-brand text-brand"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {FILTER_LABELS[s]}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold ${
                        filter === s ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Campaign cards */}
          <div className="space-y-3 pt-2">
            {filtered.map((campaign, idx) => {
              const chips = PROSPECT_CHIPS[campaign.id] ?? ["P1", "P2", "P3"];
              const visibleChips = chips.slice(0, 5);
              const extraProspects = Math.max(
                0,
                campaign.stats.total_prospects - visibleChips.length,
              );
              const replyHighlight = campaign.stats.reply_rate >= 20;

              return (
                <Card
                  key={campaign.id}
                  className={`border-border/60 hover:border-border transition-all animate-fade-up delay-${(idx % 4) + 1}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-5">
                      {/* Main area */}
                      <div className="flex-1 min-w-0 space-y-3.5">
                        {/* Title + status */}
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="font-semibold text-[14px] hover:underline leading-snug"
                            >
                              {campaign.name}
                            </Link>

                            {campaign.status === "active" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                              </span>
                            )}
                            {campaign.status === "draft" && (
                              <Badge variant="outline" className="text-[10px] capitalize">
                                Draft
                              </Badge>
                            )}
                            {campaign.status === "paused" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-brand/8 text-brand border-brand/20"
                              >
                                Paused
                              </Badge>
                            )}
                            {campaign.status === "completed" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {campaign.target_segment}
                          </p>
                        </div>

                        {/* Sequence flow — muted monochrome */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                          {campaign.steps.map((step, si) => {
                            const cfg = CHANNEL_CONFIG[step.channel];
                            const Icon = CHANNEL_ICONS[step.channel] ?? Mail;
                            const label = cfg?.label ?? step.channel;
                            return (
                              <div key={step.id} className="flex items-center gap-1 flex-shrink-0">
                                {si > 0 && (
                                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                                )}
                                <div className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-muted/30 min-w-[52px]">
                                  <Icon className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[9px] font-medium text-muted-foreground leading-none">
                                    {label}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground/60 leading-none">
                                    {step.delay_days === 0 ? "Day 0" : `D+${step.delay_days}`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Prospects + stats */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          {/* Prospect chips — neutral */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {campaign.stats.total_prospects} in sequence:
                            </span>
                            <div className="flex items-center -space-x-1">
                              {visibleChips.map((init) => (
                                <span
                                  key={init}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border border-background"
                                >
                                  {init}
                                </span>
                              ))}
                              {extraProspects > 0 && (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-bold bg-muted text-muted-foreground border border-background">
                                  +{extraProspects}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Inline metrics */}
                          <div className="flex items-center gap-5">
                            <div className="text-center">
                              <div className="text-[12px] font-semibold">
                                {campaign.stats.messages_sent}
                              </div>
                              <div className="text-[9px] text-muted-foreground">sent</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[12px] font-semibold">
                                {campaign.stats.replies}
                              </div>
                              <div className="text-[9px] text-muted-foreground">replies</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[12px] font-semibold">
                                {campaign.stats.meetings_booked}
                              </div>
                              <div className="text-[9px] text-muted-foreground">meetings</div>
                            </div>
                            <div className="text-center border-l border-border/50 pl-5">
                              <div
                                className={`text-[18px] font-bold leading-none ${replyHighlight ? "text-emerald-500" : "text-foreground"}`}
                              >
                                {campaign.stats.reply_rate.toFixed(1)}%
                              </div>
                              <div className="text-[9px] text-muted-foreground mt-0.5">
                                reply rate
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {campaign.stats.messages_sent > 0 && campaign.stats.total_prospects > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Pipeline progress</span>
                              <span>
                                {campaign.stats.messages_sent}/{campaign.stats.total_prospects}{" "}
                                reached
                              </span>
                            </div>
                            <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-brand/50 transition-all"
                                style={{
                                  width: `${(campaign.stats.messages_sent / campaign.stats.total_prospects) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0 pt-0.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs w-[76px]"
                          asChild
                        >
                          <Link href={`/campaigns/${campaign.id}`}>
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Stats
                          </Link>
                        </Button>

                        {campaign.status === "draft" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs w-[76px]"
                            onClick={() => {
                              updateCampaignStatus(campaign.id, "active");
                              toast.success(`${campaign.name} is now live`);
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Launch
                          </Button>
                        )}
                        {campaign.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs w-[76px]"
                            onClick={() => {
                              updateCampaignStatus(campaign.id, "paused");
                              toast.success(`${campaign.name} paused`);
                            }}
                          >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </Button>
                        )}
                        {campaign.status === "paused" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs w-[76px]"
                            onClick={() => {
                              updateCampaignStatus(campaign.id, "active");
                              toast.success(`${campaign.name} resumed`);
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add new sequence */}
            <Link href="/campaigns/new">
              <Card className="border-dashed border-border/50 hover:border-brand/40 transition-all cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border/60 group-hover:bg-brand/10 group-hover:border-brand/20 transition-colors">
                    <Plus className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[13px]">Design a new 1:1 sequence</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      AI wizard → map steps to signals → each message crafted per prospect
                    </p>
                  </div>
                  <Sparkles className="w-4 h-4 text-muted-foreground/30 ml-auto group-hover:text-brand/50 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
