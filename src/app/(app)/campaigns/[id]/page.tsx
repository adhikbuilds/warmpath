"use client";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Play,
  Users,
} from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSalesStore } from "@/stores/salesStore";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-brand/10 text-brand border-brand/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  linkedin: <MessageSquare className="w-3.5 h-3.5" />,
  warm_intro: <Users className="w-3.5 h-3.5" />,
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { campaigns, contacts, accounts } = useSalesStore();

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
            <Button size="sm" onClick={() => toast.success(`${campaign.name} launched!`)}>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Launch
            </Button>
          )}
          {campaign.status === "active" && (
            <Button size="sm" variant="outline" onClick={() => toast.success("Campaign paused")}>
              Pause
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

      {/* Sequence */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sequence steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {campaign.steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3 pb-4">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                  {i + 1}
                </div>
                {i < campaign.steps.length - 1 && (
                  <div className="w-px flex-1 bg-border/50 mt-1 min-h-[20px]" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
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
                </div>
                <p className="text-xs text-muted-foreground">{step.template_hint}</p>
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

      {/* Performance */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance vs. industry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Reply rate", value: replyRate, benchmark: 8, unit: "%" },
            {
              label: "Meeting rate",
              value:
                campaign.stats.total_prospects > 0
                  ? (campaign.stats.meetings_booked / campaign.stats.total_prospects) * 100
                  : 0,
              benchmark: 2,
              unit: "%",
            },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium">{metric.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Industry: {metric.benchmark}
                    {metric.unit}
                  </span>
                  <span
                    className={`font-bold ${metric.value >= metric.benchmark * 2 ? "text-emerald-500" : ""}`}
                  >
                    Yours: {metric.value.toFixed(1)}
                    {metric.unit}
                  </span>
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-muted-foreground/30 rounded-full"
                  style={{ width: `${Math.min(metric.benchmark * 3, 100)}%` }}
                />
                <div
                  className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(metric.value * 3, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
