"use client";

import {
  ArrowLeft,
  Brain,
  CalendarCheck,
  CheckCircle,
  ChevronRight,
  GitFork,
  Lightbulb,
  Link2,
  Linkedin,
  MailOpen,
  MessageSquare,
  Network,
  Send,
  Sparkles,
  Target,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime, scoreBgColor, signalTypeColor, signalTypeLabel } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";

function getIcpRadarData(account: {
  fit_score: number;
  intent_score: number;
  warmth_score: number;
  opportunity_score: number;
}) {
  const base = account.fit_score;
  return [
    { dimension: "Industry", score: Math.min(100, base + 8) },
    { dimension: "Size", score: Math.min(100, base - 5) },
    { dimension: "Tech Stack", score: Math.min(100, Math.round(account.intent_score * 0.9)) },
    { dimension: "Growth", score: Math.min(100, Math.round(account.opportunity_score * 0.85)) },
    { dimension: "Pain Signals", score: Math.min(100, base + 12) },
  ];
}

function getMeetingTalkingPoints(
  _accountName: string,
  _contactName: string | undefined,
  signals: Array<{ type: string; title: string }>,
) {
  const signalPoints = signals.slice(0, 2).map((s) => ({
    point: `Reference their ${s.type.replace("_", " ")}: "${s.title}"`,
    source: "Signal",
    icon: "⚡",
  }));

  return [
    ...signalPoints,
    {
      point: `Ask about their current outbound motion specifically how they qualify warm vs cold leads`,
      source: "Value Prop",
      icon: "VP",
    },
    {
      point: `Show the relationship graph with their team's network contrast with their current approach`,
      source: "Demo",
      icon: "DM",
    },
    {
      point: `Reference warm intro conversion rate: 34% reply rate vs 3.4% cold`,
      source: "KB: Market Data",
      icon: "KB",
    },
  ];
}

const LIKELY_OBJECTIONS = [
  {
    objection: "We already use Apollo / Outreach",
    rebuttal:
      "Apollo finds contacts. WarmPath finds your team's existing relationships to those contacts. They work together WarmPath is the intelligence layer, not a replacement.",
  },
  {
    objection: "Our team is too small for this",
    rebuttal:
      "The smaller the team, the more every relationship matters. A 5-person team with warm intros beats a 20-person team sending cold email. That's the data.",
  },
  {
    objection: "We're not sure the ROI is there",
    rebuttal:
      "Your current warm outreach probably has a 34% reply rate vs ~3% cold. WarmPath finds 3–5× more warm paths you didn't know existed. ROI is structural, not speculative.",
  },
];

const MEETING_OUTCOMES = [
  "Meeting booked",
  "Not interested",
  "Follow-up later",
  "Needs evaluation",
] as const;

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    accounts,
    contacts,
    signals,
    warmPaths,
    messages,
    relationshipEdges,
    teamMembers,
    createFollowUpTask,
  } = useSalesStore();
  const [postMeetingOpen, setPostMeetingOpen] = useState(false);
  const [meetingOutcome, setMeetingOutcome] = useState<string>("");
  const [meetingNotes, setMeetingNotes] = useState("");

  const account = accounts.find((a) => a.id === id);
  if (!account)
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Account not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/accounts">Back to accounts</Link>
        </Button>
      </div>
    );

  const accountContacts = contacts.filter((c) => c.account_id === id);
  const accountSignals = signals.filter((s) => s.account_id === id);
  const accountWarmPaths = warmPaths.filter((wp) => wp.account_id === id);
  const accountMessages = messages.filter((m) => m.account_id === id);

  const topContact = accountContacts.sort((a, b) => b.warmth_score - a.warmth_score)[0];
  const topSignal = accountSignals.sort((a, b) => b.urgency_score - a.urgency_score)[0];
  const topPath = accountWarmPaths.sort((a, b) => b.warmth_score - a.warmth_score)[0];
  const nba = topSignal
    ? {
        recommended_action: topPath
          ? `Route via ${topPath.recommended_intro_person || "warm path"} to ${accountContacts[0]?.name ?? "key contact"}`
          : `Respond to ${topSignal.title}`,
        reason: topSignal.description ?? topSignal.title,
        confidence: topSignal.confidence_score / 100,
      }
    : null;

  // Rich attribution timeline merges signals, warm path intros, and messages
  type TimelineEventType =
    | "signal"
    | "intro_requested"
    | "intro_accepted"
    | "message_sent"
    | "replied"
    | "meeting_booked"
    | "closed_won";

  interface TimelineEvent {
    id: string;
    type: TimelineEventType;
    summary: string;
    detail?: string;
    occurred_at: string;
  }

  const timelineEvents: TimelineEvent[] = [
    ...accountSignals.map((s) => ({
      id: `sig-${s.id}`,
      type: "signal" as const,
      summary: s.title,
      detail: `via ${s.source ?? s.type} · urgency ${s.urgency_score}`,
      occurred_at: s.detected_at,
    })),
    ...accountWarmPaths.map((wp) => ({
      id: `wp-req-${wp.id}`,
      type: "intro_requested" as const,
      summary: `Intro requested via ${wp.recommended_intro_person}`,
      detail: `${wp.path_nodes.length}-hop path · warmth ${wp.warmth_score}`,
      occurred_at: accountSignals[0]?.detected_at ?? new Date().toISOString(),
    })),
    ...accountWarmPaths
      .filter((wp) => wp.status === "intro_accepted" || wp.status === "replied")
      .map((wp) => ({
        id: `wp-acc-${wp.id}`,
        type: "intro_accepted" as const,
        summary: `Intro accepted by ${wp.recommended_intro_person}`,
        detail: `warmth ${wp.warmth_score}`,
        occurred_at: accountSignals[0]?.detected_at ?? new Date().toISOString(),
      })),
    ...accountMessages.flatMap((m) => {
      const sentAt = m.sent_at ?? m.scheduled_at ?? new Date().toISOString();
      const events: TimelineEvent[] = [
        {
          id: `msg-sent-${m.id}`,
          type: "message_sent" as const,
          summary: `${m.channel === "warm_intro" ? "Warm intro" : "Message"} sent to ${
            accountContacts.find((c) => c.id === m.contact_id)?.name ?? "contact"
          }`,
          detail: m.subject ?? m.channel,
          occurred_at: sentAt,
        },
      ];
      if (m.status === "replied") {
        events.push({
          id: `msg-reply-${m.id}`,
          type: "replied" as const,
          summary: "Reply received",
          detail: accountContacts.find((c) => c.id === m.contact_id)?.name,
          occurred_at: sentAt,
        });
      }
      return events;
    }),
  ].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  const TIMELINE_ICON: Record<TimelineEventType, React.ReactNode> = {
    signal: <Zap className="w-3 h-3 text-brand" />,
    intro_requested: <UserPlus className="w-3 h-3 text-blue-500" />,
    intro_accepted: <CheckCircle className="w-3 h-3 text-green-500" />,
    message_sent: <Send className="w-3 h-3 text-brand" />,
    replied: <MailOpen className="w-3 h-3 text-emerald-500" />,
    meeting_booked: <CalendarCheck className="w-3 h-3 text-violet-500" />,
    closed_won: <Target className="w-3 h-3 text-green-600" />,
  };

  const TIMELINE_COLORS: Record<TimelineEventType, string> = {
    signal: "bg-brand/10",
    intro_requested: "bg-blue-500/10",
    intro_accepted: "bg-green-500/10",
    message_sent: "bg-brand/10",
    replied: "bg-emerald-500/10",
    meeting_booked: "bg-violet-500/10",
    closed_won: "bg-green-600/10",
  };

  const icpRadarData = getIcpRadarData(account);
  const talkingPoints = getMeetingTalkingPoints(account.name, topContact?.name, accountSignals);

  // Network tab: edges from team members to contacts at this account
  const accountContactIds = new Set(accountContacts.map((c) => c.id));
  const networkEdges = relationshipEdges.filter(
    (e) =>
      (e.from_type === "team_member" || e.from_type === "user") &&
      e.to_type === "contact" &&
      accountContactIds.has(e.to_id),
  );
  // Group by (from_id, to_id) to get one entry per team-member → contact pair
  const networkMap = new Map<
    string,
    { member: (typeof teamMembers)[0] | null; edges: typeof networkEdges }
  >();
  for (const edge of networkEdges) {
    const existing = networkMap.get(edge.from_id);
    if (existing) {
      existing.edges.push(edge);
    } else {
      const member =
        teamMembers.find((tm) => tm.id === edge.from_id || tm.user_id === edge.from_id) ?? null;
      networkMap.set(edge.from_id, { member, edges: [edge] });
    }
  }
  const networkEntries = [...networkMap.values()];
  const coveredContactIds = new Set(networkEdges.map((e) => e.to_id));
  const uncoveredContacts = accountContacts.filter((c) => !coveredContactIds.has(c.id));

  function handleLogMeeting() {
    if (!meetingOutcome || !account) return;
    toast.success("Meeting outcome logged drafting follow-up email…", { duration: 4000 });
    if (meetingOutcome === "Follow-up later" || meetingOutcome === "Needs evaluation") {
      createFollowUpTask({
        type: "meeting_prep",
        title: `Follow up with ${topContact?.name ?? account.name} at ${account.name}`,
        description: meetingNotes || `Post-meeting follow-up. Outcome: ${meetingOutcome}.`,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        contact_name: topContact?.name,
        account_name: account.name,
      });
    }
    setPostMeetingOpen(false);
    setMeetingOutcome("");
    setMeetingNotes("");
  }

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/accounts">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Accounts
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 text-lg font-bold text-brand">
          {account.name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <Badge variant="outline" className="capitalize text-xs">
              {account.stage.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span>{account.industry}</span>
            <span>·</span>
            <span>{account.employee_count} employees</span>
            <span>·</span>
            <span>{account.location}</span>
            {account.domain && (
              <>
                <span>·</span>
                <a
                  href={`https://${account.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {account.domain}
                </a>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">{account.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setPostMeetingOpen(true)}>
            <CalendarCheck className="w-3.5 h-3.5 mr-1.5" />
            Log meeting
          </Button>
          <Button size="sm" onClick={() => toast.success(`Message drafted for ${account.name}`)}>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Generate outreach
          </Button>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Opportunity",
            value: account.opportunity_score,
            color: scoreBgColor(account.opportunity_score),
          },
          { label: "ICP Fit", value: account.fit_score, color: scoreBgColor(account.fit_score) },
          {
            label: "Intent",
            value: account.intent_score,
            color: scoreBgColor(account.intent_score),
          },
          {
            label: "Warmth",
            value: account.warmth_score,
            color: scoreBgColor(account.warmth_score),
          },
        ].map((score) => (
          <Card key={score.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${score.color.split(" ")[1]}`}>{score.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{score.label} score</div>
              <Progress value={score.value} className="mt-1.5 h-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next best action */}
      {nba && (
        <Card className="border-brand/30 bg-brand/5 warm-glow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Agent recommendation
                </p>
                <p className="text-sm font-medium">{nba.recommended_action}</p>
                <p className="text-xs text-muted-foreground mt-1">{nba.reason}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toast.success("Message drafted!")}
                  >
                    Execute
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(nba.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="contacts">
        <TabsList className="h-8">
          <TabsTrigger value="contacts" className="text-xs h-7">
            Contacts ({accountContacts.length})
          </TabsTrigger>
          <TabsTrigger value="signals" className="text-xs h-7">
            Signals ({accountSignals.length})
          </TabsTrigger>
          <TabsTrigger value="paths" className="text-xs h-7">
            Warm Paths ({accountWarmPaths.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs h-7">
            Messages ({accountMessages.length})
          </TabsTrigger>
          <TabsTrigger value="briefing" className="text-xs h-7">
            Meeting Briefing
          </TabsTrigger>
          <TabsTrigger value="icp" className="text-xs h-7">
            ICP Analysis
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs h-7">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="network" className="text-xs h-7">
            <Network className="w-3 h-3 mr-1" />
            Network ({networkEdges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-4 space-y-2">
          {accountContacts.map((contact) => (
            <Card key={contact.id} className="border-border/60">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-semibold text-brand">
                  {contact.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {contact.name}
                    </Link>
                    <span className="text-xs text-muted-foreground capitalize">
                      {contact.seniority?.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {contact.title} · {contact.department}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${scoreBgColor(contact.warmth_score)}`}
                  >
                    {contact.warmth_score} warmth
                  </div>
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" asChild>
                    <Link href={`/contacts/${contact.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {accountContacts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">No contacts yet</div>
          )}
        </TabsContent>

        <TabsContent value="signals" className="mt-4 space-y-2">
          {accountSignals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No signals detected yet
            </div>
          ) : (
            accountSignals.map((signal) => (
              <Card key={signal.id} className="border-border/60">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-brand mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${signalTypeColor(signal.type)}`}
                        >
                          {signalTypeLabel(signal.type)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(signal.detected_at)}
                        </span>
                      </div>
                      <p className="text-xs font-medium mt-1">{signal.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {signal.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="paths" className="mt-4 space-y-2">
          {accountWarmPaths.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No warm paths found yet
            </div>
          ) : (
            accountWarmPaths.map((wp) => {
              const contact = contacts.find((c) => c.id === wp.contact_id);
              return (
                <Card key={wp.id} className="border-border/60 warm-glow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <GitFork className="w-4 h-4 text-brand" />
                      {wp.path_nodes.map((n, i) => (
                        <span key={n.id} className="flex items-center gap-1">
                          {i > 0 && <span className="text-muted-foreground text-xs">→</span>}
                          <span className="text-sm font-medium">{n.name}</span>
                        </span>
                      ))}
                      <div
                        className={`ml-auto text-xs font-bold px-2 py-0.5 rounded border ${scoreBgColor(wp.warmth_score)}`}
                      >
                        {wp.warmth_score} warmth
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{wp.path_explanation}</p>
                    <p className="text-xs mt-1.5">
                      <span className="text-muted-foreground">Recommended intro: </span>
                      <span className="font-medium">{wp.recommended_intro_person}</span>
                      {contact && (
                        <span className="text-muted-foreground"> → to {contact.name}</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-4 space-y-2">
          {accountMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No messages yet</div>
          ) : (
            accountMessages.map((msg) => (
              <Card key={msg.id} className="border-border/60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {msg.channel.replace("_", " ")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          msg.approval_status === "approved"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : msg.approval_status === "pending"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {msg.approval_status}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-bold">
                      {msg.confidence_score}% confidence
                    </span>
                  </div>
                  {msg.subject && <p className="text-xs font-medium mb-1">{msg.subject}</p>}
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{msg.body}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── MEETING BRIEFING TAB ── */}
        <TabsContent value="briefing" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Warm path recap + contact intel */}
            <div className="space-y-3">
              {/* Warm path recap */}
              <Card className="border-brand/20 bg-brand/5">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center gap-2">
                    <GitFork className="w-3.5 h-3.5 text-brand" />
                    <span className="text-xs font-semibold text-brand uppercase tracking-wider">
                      Warm path recap
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {topPath ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {topPath.path_nodes.map((n, i) => (
                          <span key={n.id} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/50" />}
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-medium border ${
                                i === 0
                                  ? "bg-brand/10 text-brand border-brand/20"
                                  : i === topPath.path_nodes.length - 1
                                    ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              }`}
                            >
                              {n.name}
                            </span>
                          </span>
                        ))}
                        <span
                          className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded border ${scoreBgColor(topPath.warmth_score)}`}
                        >
                          {topPath.warmth_score} warmth
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {topPath.path_explanation}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No warm path cold outreach</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent signals */}
              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-brand" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Recent signals
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {accountSignals.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] flex-shrink-0 ${signalTypeColor(s.type)}`}
                      >
                        {signalTypeLabel(s.type)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(s.detected_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {accountSignals.length === 0 && (
                    <p className="text-xs text-muted-foreground">No signals detected</p>
                  )}
                </CardContent>
              </Card>

              {/* Contact intel */}
              {topContact && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Primary contact
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand flex-shrink-0">
                        {topContact.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{topContact.name}</p>
                        <p className="text-xs text-muted-foreground">{topContact.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {topContact.department} · {topContact.seniority?.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Talking points + objections */}
            <div className="space-y-3">
              {/* Talking points */}
              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-brand" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Talking points
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2.5">
                  {talkingPoints.map((tp) => (
                    <div key={tp.point} className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0 leading-tight">{tp.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] leading-relaxed">{tp.point}</p>
                        <span className="text-[10px] text-muted-foreground">{tp.source}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Objection handling */}
              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Likely objections
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-3">
                  {LIKELY_OBJECTIONS.map((obj, i) => (
                    <div key={obj.objection} className="space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        "{obj.objection}"
                      </p>
                      <p className="text-[11px] leading-relaxed">{obj.rebuttal}</p>
                      {i < LIKELY_OBJECTIONS.length - 1 && (
                        <div className="border-b border-border/40 pt-1" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Post-meeting action */}
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2.5">
                    <CalendarCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-600">Post-meeting</p>
                      <p className="text-[11px] text-emerald-700/80 mt-0.5">
                        Log your meeting outcome and AI will draft a follow-up in 60 seconds.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setPostMeetingOpen(true)}
                      >
                        Log meeting outcome
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── ICP ANALYSIS TAB ── */}
        <TabsContent value="icp" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Radar chart */}
            <Card className="border-border/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-brand" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    ICP Fit Breakdown
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={icpRadarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Radar
                        name="ICP Fit"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.15}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                        formatter={(v) => [`${v}/100`, "Score"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Dimension details */}
            <div className="space-y-2">
              {icpRadarData.map((dim) => (
                <Card key={dim.dimension} className="border-border/60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium">{dim.dimension} Fit</span>
                      <span
                        className={`text-xs font-bold ${dim.score >= 70 ? "text-emerald-500" : dim.score >= 50 ? "text-brand" : "text-red-500"}`}
                      >
                        {dim.score}/100
                      </span>
                    </div>
                    <Progress value={dim.score} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {dim.score >= 70
                        ? "Strong fit matches ICP definition"
                        : dim.score >= 50
                          ? "Moderate fit some gaps vs ICP"
                          : "Weak fit review before pursuing"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── NETWORK TAB ── */}
        <TabsContent value="network" className="mt-4 space-y-4">
          {/* Summary banner */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Linkedin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  {networkEntries.length > 0
                    ? `${networkEntries.length} team member${networkEntries.length === 1 ? "" : "s"} have LinkedIn connections at ${account.name}`
                    : `No direct connections found at ${account.name} yet`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {networkEdges.length} connection{networkEdges.length === 1 ? "" : "s"} across{" "}
                  {coveredContactIds.size} contact{coveredContactIds.size === 1 ? "" : "s"} ·{" "}
                  {uncoveredContacts.length} uncovered
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Connected team members */}
          {networkEntries.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team connections
              </p>
              {networkEntries.map(({ member, edges }) => (
                <Card key={edges[0].from_id} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                        {(member?.name ?? edges[0].from_name)[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">
                            {member?.name ?? edges[0].from_name}
                          </span>
                          {member?.title && (
                            <span className="text-xs text-muted-foreground">{member.title}</span>
                          )}
                        </div>
                        <div className="mt-2 space-y-2">
                          {edges.map((edge) => {
                            const contact = contacts.find((c) => c.id === edge.to_id);
                            const degree =
                              edge.relationship_type === "linkedin_connection" ||
                              edge.relationship_type === "coworker_connection"
                                ? "1st"
                                : "2nd";
                            return (
                              <div
                                key={edge.id}
                                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-medium">{edge.to_name}</span>
                                      {contact && (
                                        <span className="text-[10px] text-muted-foreground">
                                          {contact.title}
                                        </span>
                                      )}
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                                          degree === "1st"
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            : "bg-brand/10 text-brand border-brand/20"
                                        }`}
                                      >
                                        {degree}°
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                      {edge.evidence}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Last interaction:{" "}
                                      {formatRelativeTime(edge.last_interaction_at)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  className="h-7 text-[11px] flex-shrink-0"
                                  onClick={() => {
                                    createFollowUpTask({
                                      type: "intro_send",
                                      title: `Ask ${member?.name ?? edge.from_name} to intro ${edge.to_name} at ${account.name}`,
                                      description: `Route via ${member?.name ?? edge.from_name} (${degree}° connection). Evidence: ${edge.evidence}`,
                                      due_date: new Date(
                                        Date.now() + 24 * 60 * 60 * 1000,
                                      ).toISOString(),
                                      contact_name: edge.to_name,
                                      account_name: account.name,
                                    });
                                    toast.success(
                                      `Intro request drafted ${member?.name ?? edge.from_name} → ${edge.to_name}`,
                                    );
                                  }}
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Request intro
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Uncovered contacts */}
          {uncoveredContacts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                No direct connection outreach needed
              </p>
              {uncoveredContacts.map((contact) => (
                <Card key={contact.id} className="border-border/60 border-dashed">
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {contact.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{contact.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {contact.title} · no direct team connection
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          createFollowUpTask({
                            type: "manual",
                            title: `Connect with ${contact.name} on LinkedIn`,
                            description: `No direct team connection. Initiate LinkedIn outreach to build relationship before outreach.`,
                            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                            contact_name: contact.name,
                            account_name: account.name,
                          });
                          toast.success(`Task created connect with ${contact.name} on LinkedIn`);
                        }}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {networkEdges.length === 0 && uncoveredContacts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No contacts found at this account
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="text-[10px] text-muted-foreground mb-3 flex items-center gap-2 flex-wrap">
            {(
              [
                ["signal", "Signal"],
                ["intro_requested", "Intro"],
                ["message_sent", "Message"],
                ["replied", "Reply"],
                ["meeting_booked", "Meeting"],
              ] as [TimelineEventType, string][]
            ).map(([type, label]) => (
              <span key={type} className="flex items-center gap-1">
                <span
                  className={`inline-flex w-4 h-4 rounded-full items-center justify-center ${TIMELINE_COLORS[type]}`}
                >
                  {TIMELINE_ICON[type]}
                </span>
                {label}
              </span>
            ))}
          </div>
          <div className="space-y-0">
            {timelineEvents.map((event, idx) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${TIMELINE_COLORS[event.type]}`}
                  >
                    {TIMELINE_ICON[event.type]}
                  </div>
                  {idx < timelineEvents.length - 1 && (
                    <div className="w-px flex-1 bg-border/40 my-1" />
                  )}
                </div>
                <div className={`pb-4 flex-1 ${idx === timelineEvents.length - 1 ? "pb-0" : ""}`}>
                  <p className="text-xs font-medium leading-tight">{event.summary}</p>
                  {event.detail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{event.detail}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {formatRelativeTime(event.occurred_at)}
                  </p>
                </div>
              </div>
            ))}
            {timelineEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No interactions yet
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Post-meeting dialog */}
      <Dialog open={postMeetingOpen} onOpenChange={setPostMeetingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              Log meeting with {account.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                Outcome
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MEETING_OUTCOMES.map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    onClick={() => setMeetingOutcome(outcome)}
                    className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                      meetingOutcome === outcome
                        ? "border-primary bg-brand/10 text-brand font-medium"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                Notes
              </p>
              <Textarea
                placeholder="Key points, next steps, objections raised…"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                className="text-sm min-h-[80px] resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setPostMeetingOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={!meetingOutcome}
                onClick={handleLogMeeting}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Log & draft follow-up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
