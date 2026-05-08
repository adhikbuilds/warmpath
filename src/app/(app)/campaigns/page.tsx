"use client";

import {
  BarChart3,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  Radio,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CHANNEL_CONFIG } from "@/lib/constants";
import { useSalesStore } from "@/stores/salesStore";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  draft: "bg-muted text-muted-foreground border-border",
  paused: "bg-brand/10 text-brand border-brand/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
  linkedin: Users,
  meta_ads: Radio,
};

export default function CampaignsPage() {
  const { campaigns, campaignRecommendations } = useSalesStore();
  const topRec = campaignRecommendations[0];

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand" />
            Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Omnichannel GTM campaigns from intro request to close.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/campaigns/new">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            New campaign
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up delay-1">
        {[
          {
            label: "Active",
            value: campaigns.filter((c) => c.status === "active").length,
            color: "text-emerald-500",
          },
          {
            label: "Prospects",
            value: campaigns.reduce((s, c) => s + c.stats.total_prospects, 0),
            color: "text-foreground",
          },
          {
            label: "Replies",
            value: campaigns.reduce((s, c) => s + c.stats.replies, 0),
            color: "text-blue-500",
          },
          {
            label: "Meetings",
            value: campaigns.reduce((s, c) => s + c.stats.meetings_booked, 0),
            color: "text-violet-500",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60 stat-card-glow">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Recommendation */}
      {topRec && (
        <Card className="border-border/60 mission-glow animate-fade-up delay-1">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">
                    AI Recommended Play
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20"
                  >
                    {topRec.time_to_launch_minutes}min to launch
                  </Badge>
                </div>
                <p className="font-semibold text-sm">{topRec.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{topRec.reason}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1">
                    {topRec.channels.map((ch) => {
                      const cfg = CHANNEL_CONFIG[ch];
                      const Icon = CHANNEL_ICONS[ch] ?? Mail;
                      return cfg ? (
                        <div
                          key={ch}
                          className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.bg} ${cfg.color}`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </div>
                      ) : null;
                    })}
                  </div>
                  <Button size="sm" className="h-7 text-xs ml-auto" asChild>
                    <Link href="/campaigns/new">Build this campaign</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">All campaigns</h2>
          <div className="flex items-center gap-2">
            {["active", "draft", "paused", "completed"].map((s) => (
              <Badge
                key={s}
                variant="outline"
                className={`text-[10px] capitalize ${STATUS_COLORS[s]}`}
              >
                {campaigns.filter((c) => c.status === s).length} {s}
              </Badge>
            ))}
          </div>
        </div>

        {campaigns.map((campaign, i) => (
          <Card
            key={campaign.id}
            className={`border-border/60 hover:border-border transition-all animate-fade-up delay-${(i % 5) + 2}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="font-semibold hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${STATUS_COLORS[campaign.status]}`}
                    >
                      {campaign.status}
                    </Badge>
                    <div className="flex items-center gap-0.5 ml-1">
                      {campaign.channels.map((ch) => {
                        const cfg = CHANNEL_CONFIG[ch as string];
                        const Icon = CHANNEL_ICONS[ch as string] ?? Mail;
                        return cfg ? (
                          <div
                            key={ch}
                            className={`w-5 h-5 rounded-md ${cfg.bg} flex items-center justify-center`}
                          >
                            <Icon className={`w-2.5 h-2.5 ${cfg.color}`} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{campaign.target_segment}</p>

                  {/* Step timeline */}
                  <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                    {campaign.steps.map((step, si) => (
                      <div key={step.id} className="flex items-center gap-1.5 flex-shrink-0">
                        {si > 0 && <div className="w-4 h-px bg-border" />}
                        <div className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 bg-muted/30 capitalize flex items-center gap-1">
                          {(() => {
                            const Icon = CHANNEL_ICONS[step.channel] ?? Mail;
                            return <Icon className="w-2.5 h-2.5" />;
                          })()}
                          D+{step.delay_days}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-5 gap-4">
                    {[
                      { label: "Prospects", value: campaign.stats.total_prospects },
                      { label: "Sent", value: campaign.stats.messages_sent },
                      { label: "Replies", value: campaign.stats.replies },
                      { label: "Meetings", value: campaign.stats.meetings_booked },
                      {
                        label: "Reply rate",
                        value: `${campaign.stats.reply_rate.toFixed(1)}%`,
                        highlight: campaign.stats.reply_rate >= 30,
                      },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div
                          className={`text-sm font-bold ${stat.highlight ? "text-emerald-500" : ""}`}
                        >
                          {stat.value}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {campaign.stats.messages_sent > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span>
                          {campaign.stats.messages_sent}/{campaign.stats.total_prospects}
                        </span>
                      </div>
                      <Progress
                        value={
                          (campaign.stats.messages_sent / campaign.stats.total_prospects) * 100
                        }
                        className="h-1"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <BarChart3 className="w-3 h-3 mr-1" /> Details
                    </Link>
                  </Button>
                  {campaign.status === "draft" && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toast.success(`${campaign.name} launched!`)}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" /> Launch
                    </Button>
                  )}
                  {campaign.status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => toast.info(`${campaign.name} paused`)}
                    >
                      Pause
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty state prompt */}
        <Card className="border-dashed border-border/60 hover:border-border transition-colors cursor-pointer">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Build a new omnichannel campaign</h3>
            <p className="text-xs text-muted-foreground mb-4">
              AI guides you from goal → campaign type → channel selection → asset generation.
            </p>
            <Button size="sm" asChild>
              <Link href="/campaigns/new">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Start with AI wizard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
