"use client";

import {
  Bookmark,
  CheckSquare,
  ChevronRight,
  ExternalLink,
  GitFork,
  Linkedin,
  Mail,
  MessageSquare,
  Sparkles,
  Square,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTime, scoreBgColor, signalTypeColor, signalTypeLabel } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";

const SENIORITY_COLORS: Record<string, string> = {
  c_suite: "bg-brand/10 text-brand border-brand/20",
  vp: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  director: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  manager: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ic: "bg-muted text-muted-foreground",
};

const sourceColor: Record<string, string> = {
  LinkedIn: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  News: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  G2: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  Crunchbase: "bg-brand/10 text-brand border-brand/20",
  "Job Posting": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Website: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

interface ResearchHook {
  id: string;
  source: string;
  text: string;
  relevance: "high" | "medium";
}

function getResearchHooks(contactId: string, contactName: string): ResearchHook[] {
  const hooks: Record<string, ResearchHook[]> = {
    "con-1": [
      {
        id: "h1",
        source: "LinkedIn",
        text: "Priya posted about scaling RevOps tooling 3 days ago directly aligns with WarmPath's workflow positioning.",
        relevance: "high",
      },
      {
        id: "h2",
        source: "G2",
        text: "Her company left a 3-star review of Apollo citing 'too much noise, not enough signal' opening for warm-path differentiation.",
        relevance: "high",
      },
      {
        id: "h3",
        source: "Job Posting",
        text: "TechCorp is hiring a 'Sales Intelligence Manager' signals active investment in outbound tooling stack.",
        relevance: "medium",
      },
    ],
    "con-3": [
      {
        id: "h1",
        source: "LinkedIn",
        text: "Elena shared a post on 'relationship-based selling' last week with 200+ likes she's a warm-intro advocate.",
        relevance: "high",
      },
      {
        id: "h2",
        source: "News",
        text: "Innovate Solutions closed a $22M Series B Elena's team likely under pressure to show pipeline ROI to new investors.",
        relevance: "high",
      },
      {
        id: "h3",
        source: "Website",
        text: "innovatesolutions.com added a /partnerships page in the last 30 days possible expansion into channel sales.",
        relevance: "medium",
      },
    ],
    "con-7": [
      {
        id: "h1",
        source: "LinkedIn",
        text: "Liam commented on a Clay post asking about 'enrichment at scale without burning list quality' exact pain WarmPath solves.",
        relevance: "high",
      },
      {
        id: "h2",
        source: "Crunchbase",
        text: "DataStream raised seed funding 60 days ago Liam likely building the GTM stack from scratch, high buy-in authority.",
        relevance: "high",
      },
      {
        id: "h3",
        source: "Job Posting",
        text: "DataStream is hiring an SDR Liam is actively scaling outbound, needs infrastructure before headcount.",
        relevance: "medium",
      },
    ],
  };

  return (
    hooks[contactId] ?? [
      {
        id: "h1",
        source: "LinkedIn",
        text: `${contactName} recently engaged with posts about B2B outreach efficiency likely evaluating new tooling.`,
        relevance: "high",
      },
      {
        id: "h2",
        source: "News",
        text: "Their company has shown recent growth signals good timing for pipeline tooling conversations.",
        relevance: "medium",
      },
    ]
  );
}

function getPainPoints(title: string): string[] {
  const t = title.toLowerCase();
  if (t.includes("vp") || t.includes("chief") || t.includes("cro")) {
    return [
      "Forecasting accuracy is low pipeline lacks leading indicators",
      "Cold outreach ROI is declining as reply rates fall",
      "Reps burn time on accounts with no warm path",
    ];
  }
  if (t.includes("director") || t.includes("head of")) {
    return [
      "Can't see which team relationships are actually being leveraged",
      "Intro requests get dropped no tracking or accountability",
      "Signal volume is high but prioritization is manual",
    ];
  }
  return [
    "Spending too much time researching contacts before outreach",
    "No visibility into whether intros are being followed through",
    "Approval loops for AI messages are slow and fragmented",
  ];
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { contacts, accounts, signals, warmPaths, messages } = useSalesStore();
  const [selectedHooks, setSelectedHooks] = useState<Set<string>>(new Set(["h1"]));

  const contact = contacts.find((c) => c.id === id);
  if (!contact)
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Contact not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/contacts">Back to contacts</Link>
        </Button>
      </div>
    );

  const account = accounts.find((a) => a.id === contact.account_id);
  const contactSignals = signals.filter((s) => s.account_id === contact.account_id);
  const contactPaths = warmPaths.filter((wp) => wp.contact_id === id);
  const contactMessages = messages.filter((m) => m.contact_id === id || m.contact?.id === id);
  const researchHooks = getResearchHooks(id, contact.name);
  const painPoints = getPainPoints(contact.title ?? "");

  const toggleHook = (hookId: string) => {
    setSelectedHooks((prev) => {
      const next = new Set(prev);
      if (next.has(hookId)) next.delete(hookId);
      else next.add(hookId);
      return next;
    });
  };

  const linkedinSignals = contactSignals.filter((s) => s.type === "linkedin_post");

  return (
    <div className="p-6 space-y-5 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/contacts" className="hover:text-foreground transition-colors">
          Contacts
        </Link>
        <ChevronRight className="w-3 h-3" />
        {account && (
          <>
            <Link
              href={`/accounts/${account.id}`}
              className="hover:text-foreground transition-colors"
            >
              {account.name}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-foreground font-medium">{contact.name}</span>
      </div>

      {/* Profile header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-brand">
          {contact.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            {contact.seniority && (
              <Badge
                variant="outline"
                className={`capitalize text-xs ${SENIORITY_COLORS[contact.seniority] ?? ""}`}
              >
                {contact.seniority.replace("_", " ")}
              </Badge>
            )}
            {contactPaths.length > 0 && (
              <Badge variant="outline" className="text-xs bg-brand/10 text-brand border-brand/20">
                <GitFork className="w-3 h-3 mr-1" />
                warm path
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contact.title}
            {contact.department && ` · ${contact.department}`}
            {account && (
              <>
                {" · "}
                <Link href={`/accounts/${account.id}`} className="hover:text-foreground">
                  {account.name}
                </Link>
              </>
            )}
          </p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {contact.email && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {contact.email}
              </span>
            )}
            {contact.linkedin_url && (
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <Linkedin className="w-3 h-3" />
                LinkedIn
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {contact.email && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info(`Email copied: ${contact.email}`)}
              className="gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => toast.success(`Outreach drafted for ${contact.name}`)}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate outreach
          </Button>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Warmth score", value: contact.warmth_score, desc: "Relationship proximity" },
          {
            label: "Engagement score",
            value: contact.engagement_score,
            desc: "Signal activity level",
          },
          {
            label: "ICP fit",
            value: Math.round((contact.warmth_score + contact.engagement_score) / 2),
            desc: "Ideal customer alignment",
          },
        ].map((score) => (
          <Card key={score.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className={`text-3xl font-bold ${scoreBgColor(score.value).split(" ")[1]}`}>
                    {score.value}
                  </div>
                  <div className="text-xs font-medium mt-0.5">{score.label}</div>
                </div>
                <div className="text-[10px] text-muted-foreground text-right pb-0.5">
                  {score.desc}
                </div>
              </div>
              <Progress value={score.value} className="h-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warm path highlight */}
      {contactPaths.length > 0 && (
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <GitFork className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Best warm path
                </p>
                {contactPaths.slice(0, 1).map((wp) => (
                  <div key={wp.id}>
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      {wp.path_nodes.map((n, i) => (
                        <span key={n.id} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          <span className="text-sm font-medium">{n.name}</span>
                        </span>
                      ))}
                      <div
                        className={`ml-auto text-xs font-bold px-2 py-0.5 rounded border ${scoreBgColor(wp.warmth_score)}`}
                      >
                        {wp.warmth_score}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{wp.path_explanation}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => toast.success("Intro request drafted!")}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Request intro
                      </Button>
                      <span className="text-[10px] text-muted-foreground">
                        via {wp.recommended_intro_person}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="research">
        <TabsList className="h-8">
          <TabsTrigger value="research" className="text-xs h-7">
            Research
          </TabsTrigger>
          <TabsTrigger value="signals" className="text-xs h-7">
            Signals ({contactSignals.length})
          </TabsTrigger>
          <TabsTrigger value="paths" className="text-xs h-7">
            Warm Paths ({contactPaths.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs h-7">
            Messages ({contactMessages.length})
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="text-xs h-7">
            LinkedIn
          </TabsTrigger>
        </TabsList>

        {/* Research tab */}
        <TabsContent value="research" className="mt-4">
          <div className="grid grid-cols-[1fr_280px] gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                  <span className="text-sm font-semibold">AI research hooks</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {selectedHooks.size} selected · used in outreach
                </span>
              </div>

              {researchHooks.map((hook) => {
                const selected = selectedHooks.has(hook.id);
                return (
                  <Card
                    key={hook.id}
                    className={`border-border/60 cursor-pointer transition-all ${selected ? "border-brand/40 bg-brand/3" : ""}`}
                    onClick={() => toggleHook(hook.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <button type="button" className="mt-0.5 text-brand flex-shrink-0">
                          {selected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${sourceColor[hook.source] ?? "bg-muted text-muted-foreground"}`}
                            >
                              {hook.source}
                            </Badge>
                            {hook.relevance === "high" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-brand/10 text-brand border-brand/20"
                              >
                                High relevance
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {hook.text}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Button
                className="w-full gap-2"
                onClick={() =>
                  toast.success(
                    `Outreach drafted using ${selectedHooks.size} hook${selectedHooks.size !== 1 ? "s" : ""}`,
                  )
                }
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate outreach with selected hooks
              </Button>
            </div>

            {/* Side panel */}
            <div className="space-y-3">
              <Card className="border-border/60">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pain points
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {painPoints.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-brand mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{p}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Persona
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {[
                    { label: "Role", value: contact.title ?? "-" },
                    { label: "Dept", value: contact.department ?? "-" },
                    {
                      label: "Seniority",
                      value: contact.seniority?.replace("_", " ") ?? "-",
                    },
                    { label: "Account", value: account?.name ?? "-" },
                    {
                      label: "Segment",
                      value: account ? `${account.employee_count ?? "?"} employees` : "-",
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">{row.label}</span>
                      <span className="text-[10px] font-medium capitalize">{row.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {account && (
                <Card className="border-border/60">
                  <CardContent className="p-3">
                    <Link
                      href={`/accounts/${account.id}`}
                      className="flex items-center justify-between text-xs hover:text-brand transition-colors"
                    >
                      <span className="font-medium">{account.name}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {account.industry} · {account.employee_count?.toLocaleString() ?? "?"}{" "}
                      employees
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">Account score</span>
                      <span
                        className={`text-[10px] font-bold ${scoreBgColor(account.opportunity_score).split(" ")[1]}`}
                      >
                        {account.opportunity_score}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Signals tab */}
        <TabsContent value="signals" className="mt-4 space-y-2">
          {contactSignals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No signals yet</div>
          ) : (
            contactSignals.map((signal) => (
              <Card key={signal.id} className="border-border/60">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-brand mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${signalTypeColor(signal.type)}`}
                        >
                          {signalTypeLabel(signal.type)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(signal.detected_at)}
                        </span>
                        {signal.urgency_score !== undefined && signal.urgency_score >= 80 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-brand/10 text-brand border-brand/20"
                          >
                            Act now
                          </Badge>
                        )}
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

        {/* Warm paths tab */}
        <TabsContent value="paths" className="mt-4 space-y-2">
          {contactPaths.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No warm paths found
            </div>
          ) : (
            contactPaths.map((wp) => (
              <Card key={wp.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <GitFork className="w-4 h-4 text-brand flex-shrink-0" />
                    {wp.path_nodes.map((n, i) => (
                      <span key={n.id} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        <span className="text-sm font-medium">{n.name}</span>
                      </span>
                    ))}
                    <div
                      className={`ml-auto text-xs font-bold px-2 py-0.5 rounded border ${scoreBgColor(wp.warmth_score)}`}
                    >
                      {wp.warmth_score} warmth
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{wp.path_explanation}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => toast.success("Intro request drafted!")}
                  >
                    <MessageSquare className="w-3 h-3" />
                    Request intro via {wp.recommended_intro_person}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Messages tab */}
        <TabsContent value="messages" className="mt-4 space-y-2">
          {contactMessages.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto text-muted-foreground/40" />
              <p>No messages yet</p>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => toast.success(`Outreach drafted for ${contact.name}`)}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate first message
              </Button>
            </div>
          ) : (
            contactMessages.map((msg) => (
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
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {Math.round(msg.confidence_score * 100)}% confidence
                    </span>
                  </div>
                  {msg.subject && <p className="text-xs font-medium mb-1">{msg.subject}</p>}
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{msg.body}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* LinkedIn tab */}
        <TabsContent value="linkedin" className="mt-4">
          <div className="space-y-3">
            {contact.linkedin_url ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-sm font-semibold">LinkedIn activity</span>
                  </div>
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    View profile <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {linkedinSignals.length > 0 ? (
                  linkedinSignals.map((signal) => (
                    <Card key={signal.id} className="border-border/60">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <User className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-medium text-blue-500">Post</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(signal.detected_at)}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5">{signal.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {signal.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] gap-1"
                                onClick={() => toast.success("Comment drafted in approval queue")}
                              >
                                <MessageSquare className="w-3 h-3" />
                                Draft comment
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] gap-1"
                                onClick={() => toast.success("Saved as research hook")}
                              >
                                <Bookmark className="w-3 h-3" />
                                Save as hook
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="space-y-2">
                    {[
                      {
                        text: `${contact.name} shared a post about ${account?.industry ?? "industry trends"} good engagement signal`,
                        age: "2 days ago",
                      },
                      {
                        text: `Commented on a thread about scaling B2B outbound highly relevant to WarmPath's positioning`,
                        age: "5 days ago",
                      },
                    ].map((item, i) => (
                      <Card key={i} className="border-border/60">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <User className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-blue-500">Post</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {item.age}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {item.text}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] gap-1"
                                  onClick={() => toast.success("Comment drafted in approval queue")}
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  Draft comment
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[10px] gap-1"
                                  onClick={() => toast.success("Saved as research hook")}
                                >
                                  <Bookmark className="w-3 h-3" />
                                  Save as hook
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm space-y-2">
                <Linkedin className="w-6 h-6 mx-auto text-muted-foreground/40" />
                <p>No LinkedIn profile linked</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
