"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle,
  ChevronRight,
  Flame,
  GitFork,
  HelpCircle,
  Link2Off,
  Linkedin,
  ListChecks,
  Mail,
  Network,
  Phone,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductTour } from "@/components/product-tour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { computeEdgeWarmth } from "@/lib/graph";
import { formatRelativeTime, signalTypeColor, signalTypeLabel } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";
import type { RelationshipEdge, Signal } from "@/types";

const URGENCY_RING: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-brand",
  low: "border-l-border",
};

const CHANNEL_PREVIEW_ICON = { email: Mail, linkedin: Users, warm_intro: GitFork, phone: Phone };

// ─── Warmth label helper ──────────────────────────────────────────────────────

function warmthLabel(score: number) {
  return score >= 70 ? "Strong" : score >= 50 ? "Warm" : "Cool";
}

function warmthLabelColor(score: number) {
  return score >= 70 ? "text-emerald-500" : score >= 50 ? "text-brand" : "text-muted-foreground";
}

// ─── Re-engage Sheet ──────────────────────────────────────────────────────────

interface ReEngageSheetProps {
  edge: RelationshipEdge | null;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReEngageSheet({ edge, userName, open, onOpenChange }: ReEngageSheetProps) {
  if (!edge) return null;

  const isFromTeamMember = edge.from_type === "team_member" || edge.from_type === "user";
  const contactName = isFromTeamMember ? edge.to_name : edge.from_name;
  const firstName = contactName.split(" ")[0];
  const companyHint = isFromTeamMember ? edge.to_name : edge.from_name;

  const messageSubject = "Checking in how's everything going?";
  const messageBody = `Hey ${firstName},

Hope you're doing well! It's been a while since we last connected and I've been meaning to reach out.

Saw ${companyHint} has been growing fast really impressive what you've been building.

Would love to catch up no agenda, just reconnecting. Are you open for a quick 15-min call sometime?

Best,
${userName}`;

  const fullMessage = `Subject: ${messageSubject}\n\n${messageBody}`;

  function copyMessage() {
    navigator.clipboard.writeText(fullMessage).then(() => {
      toast.success("Copied to clipboard");
    });
  }

  function openLinkedIn() {
    const encoded = encodeURIComponent(contactName);
    window.open(
      `https://www.linkedin.com/search/results/people/?keywords=${encoded}`,
      "_blank",
      "noopener",
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Link2Off className="w-4 h-4 text-brand" />
            Re-engage {contactName}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Last interaction{" "}
            {Math.round((Date.now() - new Date(edge.last_interaction_at).getTime()) / 86_400_000)}d
            ago · warmth score {computeEdgeWarmth(edge)}
          </p>
        </SheetHeader>

        <div className="px-6 space-y-4 pb-6">
          {/* Draft message */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pre-drafted check-in
            </p>
            <p className="text-xs font-semibold text-foreground">Subject: {messageSubject}</p>
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {messageBody}
            </div>
          </div>

          {/* Note */}
          <p className="text-[11px] text-muted-foreground italic border-l-2 border-brand/40 pl-3">
            This message doesn't mention WarmPath or sales. Keep it authentic.
          </p>

          {/* Actions */}
          <div className="flex gap-2 flex-col">
            <Button className="w-full gap-2" onClick={copyMessage}>
              Copy message
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={openLinkedIn}>
              <Linkedin className="w-3.5 h-3.5" />
              Open LinkedIn
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Champion Outreach Sheet ──────────────────────────────────────────────────

function parseChampTitle(title: string) {
  const m = title.match(/^(.+) moved from (.+) to (.+)$/);
  return m ? { name: m[1], oldCo: m[2], newCo: m[3] } : null;
}

function parseChampDesc(desc: string) {
  const m = desc.match(/joined (.+) as (.+?)\.?$/);
  return m ? { newCo: m[1], newTitle: m[2] } : null;
}

interface ChampionOutreachSheetProps {
  signal: Signal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
}

function ChampionOutreachSheet({
  signal,
  open,
  onOpenChange,
  userName,
}: ChampionOutreachSheetProps) {
  if (!signal) return null;

  const titleParsed = parseChampTitle(signal.title);
  const descParsed = parseChampDesc(signal.description);

  const contactName = titleParsed?.name ?? "Champion";
  const firstName = contactName.split(" ")[0];
  const oldCo = titleParsed?.oldCo ?? "their previous company";
  const newCo = titleParsed?.newCo ?? descParsed?.newCo ?? "their new company";
  const newTitle = descParsed?.newTitle ?? "their new role";
  const userFirstName = userName.split(" ")[0];

  const subject = `Congrats on the move to ${newCo}!`;
  const body = `Hey ${firstName},

Saw that you just joined ${newCo} as ${newTitle} congrats on the new role!

We'd crossed paths when you were at ${oldCo}, and I've always had a lot of respect for the work you were doing there.

Thought I'd reach out because a lot of ${newTitle} leaders we talk to are thinking about how to build warm pipeline without burning their new team's reputation on cold outreach. Given your background, I thought you might have a take on it.

No agenda at all if you're open to reconnecting once you've settled in, would love a quick catch-up.

Best,
${userFirstName}`;

  const fullMessage = `Subject: ${subject}\n\n${body}`;

  function copyMessage() {
    navigator.clipboard.writeText(fullMessage).then(() => {
      toast.success("Copied!");
    });
  }

  function openLinkedIn() {
    const encoded = encodeURIComponent(contactName);
    window.open(
      `https://www.linkedin.com/search/results/people/?keywords=${encoded}`,
      "_blank",
      "noopener",
    );
  }

  function createAccount() {
    toast.success(`Account created for ${newCo} check Accounts`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-violet-500" />
            Reach out to {contactName}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {oldCo} → {newCo} · {newTitle}
          </p>
        </SheetHeader>

        <div className="px-6 space-y-4 pb-6">
          {/* Draft message */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pre-drafted message
            </p>
            <p className="text-xs font-semibold text-foreground">Subject: {subject}</p>
            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {body}
            </div>
          </div>

          {/* Note */}
          <p className="text-[11px] text-muted-foreground italic border-l-2 border-violet-500/40 pl-3">
            This message references your existing relationship, not WarmPath. Keep it authentic.
          </p>

          {/* Actions */}
          <div className="flex gap-2 flex-col">
            <button
              type="button"
              className="w-full h-9 rounded-md bg-brand text-brand-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors"
              onClick={copyMessage}
            >
              Copy message
            </button>
            <button
              type="button"
              className="w-full h-9 rounded-md border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/60 transition-colors"
              onClick={openLinkedIn}
            >
              <Linkedin className="w-3.5 h-3.5" />
              Open LinkedIn
            </button>
            <button
              type="button"
              className="w-full h-9 rounded-md border border-violet-500/30 text-violet-600 dark:text-violet-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-violet-500/10 transition-colors"
              onClick={createAccount}
            >
              Auto-create account for {newCo}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const {
    messages,
    warmPaths,
    accounts,
    contacts,
    signals,
    campaignAssets,
    teamMembers,
    relationshipEdges,
    followUpTasks,
    completeFollowUpTask,
  } = useSalesStore();

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [reEngageEdge, setReEngageEdge] = useState<RelationshipEdge | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [champSheetSignal, setChampSheetSignal] = useState<(typeof signals)[0] | null>(null);
  const [champSheetOpen, setChampSheetOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // ── Derived counts ────────────────────────────────────────────────────────
  const pendingMessages = messages.filter((m) => m.approval_status === "pending");
  const pendingAssets = campaignAssets.filter((a) => a.status === "pending_approval");
  const totalPending = pendingMessages.length + pendingAssets.length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // ── 7-day activity strip ──────────────────────────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  // Fallback demo counts since demo messages use historical dates far from today
  const DEMO_DAY_COUNTS = [2, 1, 4, 3, 5, 0, 0];
  const dayMessages = (_day: Date, i: number) => DEMO_DAY_COUNTS[i] ?? 0;
  const maxDayCount = Math.max(1, ...weekDays.map((d, i) => dayMessages(d, i)));

  // ── Today's warm plays ────────────────────────────────────────────────────
  const plays = signals
    .filter((s) => s.urgency_score >= 70 && !dismissed.has(s.id))
    .sort((a, b) => b.urgency_score - a.urgency_score)
    .slice(0, 5)
    .map((signal) => {
      const account = accounts.find((a) => a.id === signal.account_id);
      const contact = contacts.find((c) => c.account_id === signal.account_id);
      const path = warmPaths.find((w) => w.account_id === signal.account_id);
      const via = path?.recommended_intro_person;
      const urgency =
        signal.urgency_score >= 85 ? "high" : signal.urgency_score >= 70 ? "medium" : "low";
      return { signal, account, contact, path, via, urgency };
    });

  const topPlay = plays[0];

  // ── Today's tasks ─────────────────────────────────────────────────────────
  const todayTasks = followUpTasks
    .filter((t) => t.status === "pending" && new Date(t.due_date) <= new Date())
    .slice(0, 3);

  // ── Champion moves ────────────────────────────────────────────────────────
  const championSignals = useMemo(
    () => signals.filter((s) => s.type === "champion_job_change").slice(0, 3),
    [signals],
  );

  // ── Network decay alerts ──────────────────────────────────────────────────
  const decayingConnections = useMemo(() => {
    const now = Date.now();
    return relationshipEdges
      .filter((e) => {
        const days = (now - new Date(e.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24);
        return days > 45;
      })
      .map((e) => {
        const bridgeCount = warmPaths.filter((wp) =>
          wp.path_nodes.some((n) => n.id === e.from_id || n.id === e.to_id),
        ).length;
        return { edge: e, bridgeCount, warmth: computeEdgeWarmth(e) };
      })
      .sort(
        (a, b) =>
          new Date(a.edge.last_interaction_at).getTime() -
          new Date(b.edge.last_interaction_at).getTime(),
      )
      .slice(0, 4);
  }, [relationshipEdges, warmPaths]);

  // Coverage drop estimate
  const totalAccounts = accounts.length || 1;
  const coverageDrop = Math.round((decayingConnections.length / totalAccounts) * 100);

  // ── Network health segments ───────────────────────────────────────────────
  const warmEdges = relationshipEdges.filter((e) => computeEdgeWarmth(e) >= 70).length;
  const coolingEdges = relationshipEdges.filter((e) => {
    const w = computeEdgeWarmth(e);
    return w >= 45 && w < 70;
  }).length;
  const coldEdges = relationshipEdges.filter((e) => computeEdgeWarmth(e) < 45).length;
  const totalEdges = relationshipEdges.length || 1;

  function openReEngage(edge: RelationshipEdge) {
    setReEngageEdge(edge);
    setSheetOpen(true);
  }

  function openChampSheet(signal: (typeof signals)[0]) {
    setChampSheetSignal(signal);
    setChampSheetOpen(true);
  }

  return (
    <div className="p-6 space-y-6 max-w-[1280px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {plays.length} warm {plays.length === 1 ? "play" : "plays"} ready to act on
            {totalPending > 0 && (
              <>
                {" · "}
                <Link href="/approval-queue" className="text-brand hover:underline font-medium">
                  {totalPending} pending approval
                </Link>
              </>
            )}
          </p>
        </div>

        {/* 7-day activity strip */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            7d activity
          </span>
          <div className="flex items-end gap-1.5 h-10 max-w-[120px]">
            {weekDays.map((day, i) => {
              const count = dayMessages(day, i);
              const isToday = day.toDateString() === new Date().toDateString();
              const height = Math.max(4, Math.round((count / maxDayCount) * 32));
              const dayLabel = day.toLocaleDateString("en", { weekday: "short" }).slice(0, 1);
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <div
                    className={`w-full rounded-sm transition-all ${isToday ? "bg-brand" : "bg-brand/25"}`}
                    style={{ height: `${height}px` }}
                    title={`${count} messages`}
                  />
                  <span
                    className={`text-[9px] ${isToday ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {totalPending > 0 && (
            <Button size="sm" asChild>
              <Link href="/approval-queue">
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                Review {totalPending}
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link href="/campaigns/new">New campaign</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTourOpen(true)}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Tour
          </Button>
        </div>
      </div>

      {/* ── Decay Warning Banner ──────────────────────────────────────────── */}
      {decayingConnections.length > 0 && !bannerDismissed && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/8 px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-brand flex-shrink-0" />
          <span className="flex-1 text-brand">
            <span className="font-semibold">
              {decayingConnections.length} relationships going cold
            </span>
            {" · "}Your warm path coverage drops{" "}
            <span className="font-semibold">{coverageDrop}%</span> if these connections lapse.
          </span>
          <Link
            href="/relationship-graph?view=coverage"
            className="text-xs font-semibold text-brand hover:underline flex-shrink-0"
          >
            View all →
          </Link>
          <button
            type="button"
            className="p-1 rounded text-brand hover:text-foreground hover:bg-brand/10 transition-colors flex-shrink-0"
            onClick={() => setBannerDismissed(true)}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Hero action card (featured play) ─────────────────────────────── */}
      {topPlay && !dismissed.has(topPlay.signal.id) && (
        <div className="relative rounded-2xl border border-border/50 border-l-4 border-l-brand bg-gradient-to-r from-brand/8 to-transparent p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-brand flex-shrink-0" />
                <span className="text-[11px] font-semibold text-brand uppercase tracking-wider">
                  Your warmest move today
                </span>
              </div>
              <h2 className="text-xl font-bold mb-1">
                {topPlay.contact?.name ?? topPlay.account?.name ?? "Unknown"}
                {topPlay.contact && topPlay.account && (
                  <span className="text-muted-foreground font-normal text-base">
                    {" "}
                    · {topPlay.contact.title} at {topPlay.account.name}
                  </span>
                )}
              </h2>
              {topPlay.via && (
                <p className="text-sm text-muted-foreground mb-1">
                  via <span className="font-semibold text-foreground">{topPlay.via}</span>
                  {" · "}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${signalTypeColor(topPlay.signal.type)}`}
                  >
                    {signalTypeLabel(topPlay.signal.type)}
                  </Badge>
                </p>
              )}
              <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed line-clamp-2">
                {topPlay.signal.description ?? topPlay.signal.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="gap-1.5 bg-brand hover:bg-brand/90 text-white"
                  onClick={() =>
                    toast.success(`Drafting intro request for ${topPlay.account?.name}…`)
                  }
                >
                  <GitFork className="w-3.5 h-3.5" />
                  Draft intro request
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/accounts/${topPlay.signal.account_id}`}>View account</Link>
                </Button>
                {plays.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    +{plays.length - 1} more plays below
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
              onClick={() => setDismissed((prev) => new Set([...prev, topPlay.signal.id]))}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Today's tasks strip ───────────────────────────────────────────── */}
      {todayTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5" />
            Due today
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/50 bg-card/50 flex-shrink-0 min-w-[200px] max-w-[260px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{task.title}</p>
                  <p className="text-[10px] text-red-500">Overdue</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 flex-shrink-0"
                  onClick={() => completeFollowUpTask(task.id)}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* ── Left column ──────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* More warm plays (compact horizontal scroll, index 1-4) */}
          {plays.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  More warm plays
                </p>
                <Link
                  href="/warm-leads"
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  All accounts <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {plays.slice(1).map(({ signal, account, contact, via, urgency }) => (
                  <div
                    key={signal.id}
                    className={`flex-shrink-0 w-56 snap-start rounded-xl border border-l-2 p-3 bg-card ${URGENCY_RING[urgency]}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold truncate">{account?.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] flex-shrink-0 ml-1 ${signalTypeColor(signal.type)}`}
                      >
                        {signalTypeLabel(signal.type)}
                      </Badge>
                    </div>
                    {contact && (
                      <p className="text-[11px] text-muted-foreground truncate mb-1">
                        {contact.name}
                      </p>
                    )}
                    {via ? (
                      <p className="text-[11px] text-brand font-medium truncate mb-2">via {via}</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground truncate mb-2">
                        No warm path
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="h-6 text-[10px] w-full"
                      onClick={() => toast.success(`Drafting for ${account?.name}…`)}
                    >
                      Draft outreach
                    </Button>
                  </div>
                ))}
              </div>
              {dismissed.size > 0 && (
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground hover:text-foreground w-full text-center py-1"
                  onClick={() => setDismissed(new Set())}
                >
                  Restore {dismissed.size} dismissed
                </button>
              )}
            </div>
          )}

          {plays.length === 0 && (
            <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
              <Zap className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No high-urgency signals right now.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Your agent is monitoring 50+ sources.
              </p>
            </div>
          )}

          {/* Champion moves */}
          {championSignals.length > 0 && (
            <Card className="border-violet-500/20 bg-violet-500/[0.02]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    Champion moves
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20"
                  >
                    {championSignals.length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  Your champions changed jobs. Reach out now your relationship gives you a warm
                  path advantage at their new company.
                </p>
                <div className="space-y-2.5 mb-3">
                  {championSignals.map((signal) => {
                    const titleParsed = parseChampTitle(signal.title);
                    const descParsed = parseChampDesc(signal.description);
                    const contactName = titleParsed?.name ?? "Champion";
                    const newCo = titleParsed?.newCo ?? descParsed?.newCo ?? "New Company";
                    const newTitle = descParsed?.newTitle ?? "";
                    const initials = contactName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div key={signal.id} className="flex items-start gap-2 text-xs">
                        <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center text-[10px] font-bold text-violet-600 flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {contactName}
                            {newCo && (
                              <span className="font-normal text-muted-foreground"> → {newCo}</span>
                            )}
                            {newTitle && (
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                as {newTitle}
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-violet-500">
                            {formatRelativeTime(signal.detected_at)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] flex-shrink-0 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                          onClick={() => openChampSheet(signal)}
                        >
                          Reach out
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <Link
                  href="/signals?type=champion_job_change"
                  className="text-[11px] text-violet-500 hover:text-violet-600 hover:underline"
                >
                  View all champion moves →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Pending approvals */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  Pending approvals
                </p>
                {totalPending > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-brand/10 text-brand border-brand/20"
                  >
                    {totalPending}
                  </Badge>
                )}
              </div>
              {totalPending === 0 ? (
                <div className="flex items-center gap-2 text-emerald-500 text-xs">
                  <CheckCircle className="w-3.5 h-3.5" />
                  All caught up
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-3">
                    {pendingMessages.slice(0, 2).map((msg) => {
                      const Icon =
                        CHANNEL_PREVIEW_ICON[msg.channel as keyof typeof CHANNEL_PREVIEW_ICON] ??
                        Mail;
                      return (
                        <div
                          key={msg.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/40"
                        >
                          <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-brand" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {msg.subject ?? `${msg.channel.replace("_", " ")} message`}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {msg.contact?.name ?? "Contact"} · {msg.account?.name ?? "Account"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="h-6 text-[10px] flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => toast.success("Approved!")}
                          >
                            ✓
                          </Button>
                        </div>
                      );
                    })}
                    {totalPending > 2 && (
                      <p className="text-[11px] text-muted-foreground pl-1">
                        +{totalPending - 2} more
                      </p>
                    )}
                  </div>
                  <Button size="sm" className="w-full h-8 text-xs" asChild>
                    <Link href="/approval-queue">
                      Review all <ArrowRight className="w-3 h-3 ml-1.5" />
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Warm paths quick view */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-muted-foreground" />
                  Warm paths
                </p>
                <Link
                  href="/relationship-graph"
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  View graph
                </Link>
              </div>
              <div className="space-y-2.5">
                {warmPaths.slice(0, 4).map((wp) => {
                  const acc = accounts.find((a) => a.id === wp.account_id);
                  const label = warmthLabel(wp.warmth_score);
                  const labelColor = warmthLabelColor(wp.warmth_score);
                  return (
                    <div key={wp.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand flex-shrink-0">
                        {acc?.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{acc?.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          via {wp.recommended_intro_person ?? "your network"}
                        </p>
                      </div>
                      <div className={`text-[10px] font-semibold ${labelColor}`}>{label}</div>
                    </div>
                  );
                })}
              </div>
              <Button size="sm" variant="outline" className="w-full h-8 text-xs mt-3" asChild>
                <Link href="/warm-leads">Find more warm paths</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Network health */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-muted-foreground" />
                Network health
              </p>
              <div className="flex h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${(warmEdges / totalEdges) * 100}%` }}
                />
                <div
                  className="bg-brand h-full"
                  style={{ width: `${(coolingEdges / totalEdges) * 100}%` }}
                />
                <div className="bg-muted h-full flex-1" />
              </div>
              <div className="flex items-center gap-3 text-[11px] mb-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {warmEdges} warm
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  {coolingEdges} cooling
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  {coldEdges} cold
                </span>
              </div>
              {decayingConnections.length > 0 && (
                <div className="space-y-2 border-t border-border/40 pt-3">
                  {decayingConnections.slice(0, 2).map(({ edge }) => {
                    const isFrom = edge.from_type === "team_member" || edge.from_type === "user";
                    const name = isFrom ? edge.to_name : edge.from_name;
                    const days = Math.round(
                      (Date.now() - new Date(edge.last_interaction_at).getTime()) / 86400000,
                    );
                    return (
                      <div key={edge.id} className="flex items-center gap-2 text-xs">
                        <Link2Off className="w-3 h-3 text-brand flex-shrink-0" />
                        <span className="flex-1 truncate font-medium">{name}</span>
                        <span className="text-[10px] text-brand">{days}d ago</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] border-brand/30 text-brand hover:bg-brand/10 flex-shrink-0"
                          onClick={() => openReEngage(edge)}
                        >
                          Re-engage
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button size="sm" variant="outline" className="w-full h-8 text-xs mt-3" asChild>
                <Link href="/relationship-graph?view=coverage">View full network</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Team */}
          {teamMembers.length > 0 && (
            <Card className="border-border/60">
              <CardContent className="p-4">
                <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  Your network ({teamMembers.length} members)
                </p>
                <div className="space-y-2">
                  {teamMembers.slice(0, 4).map((tm) => (
                    <div key={tm.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                        {tm.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{tm.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{tm.title}</p>
                      </div>
                      <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        <div
                          className="h-full bg-brand rounded-full"
                          style={{ width: `${tm.relationship_score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full h-8 text-xs mt-3" asChild>
                  <Link href="/relationship-graph">Explore relationship graph</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Re-engage Sheet ───────────────────────────────────────────────── */}
      <ReEngageSheet
        edge={reEngageEdge}
        userName={user?.name ?? "You"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* ── Champion Outreach Sheet ───────────────────────────────────────── */}
      <ChampionOutreachSheet
        signal={champSheetSignal}
        open={champSheetOpen}
        onOpenChange={setChampSheetOpen}
        userName={user?.name ?? "You"}
      />

      {/* ── Product Tour ──────────────────────────────────────────────────── */}
      <ProductTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
