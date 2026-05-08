"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  GitFork,
  ListChecks,
  MailCheck,
  PhoneCall,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useSalesStore } from "@/stores/salesStore";
import type { FollowUpTask, TaskType } from "@/types";

const TASK_ICONS: Record<TaskType, React.ComponentType<{ className?: string }>> = {
  follow_up: Users,
  reply_check: MailCheck,
  meeting_prep: CalendarClock,
  intro_send: GitFork,
  manual: ListChecks,
};

const TASK_COLORS: Record<TaskType, string> = {
  follow_up: "text-brand bg-brand/10 border-brand/20",
  reply_check: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  meeting_prep: "text-violet-600 bg-violet-500/10 border-violet-500/20",
  intro_send: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  manual: "text-muted-foreground bg-muted border-border/40",
};

const TASK_LABELS: Record<TaskType, string> = {
  follow_up: "Follow-up",
  reply_check: "Reply check",
  meeting_prep: "Meeting prep",
  intro_send: "Intro send",
  manual: "Manual",
};

function getDueLabel(dueDateStr: string): { label: string; overdue: boolean; today: boolean } {
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      label: overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`,
      overdue: true,
      today: false,
    };
  }
  if (diffDays === 0) return { label: "Due today", overdue: false, today: true };
  if (diffDays === 1) return { label: "Due tomorrow", overdue: false, today: false };
  return { label: `Due in ${diffDays} days`, overdue: false, today: false };
}

function TaskCard({ task }: { task: FollowUpTask }) {
  const { completeFollowUpTask, dismissFollowUpTask } = useSalesStore();
  const Icon = TASK_ICONS[task.type];
  const color = TASK_COLORS[task.type];
  const due = getDueLabel(task.due_date);

  return (
    <Card
      className={`border-border/60 transition-all ${due.overdue ? "border-l-2 border-l-red-500" : due.today ? "border-l-2 border-l-brand" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${color}`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold leading-snug">{task.title}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    completeFollowUpTask(task.id);
                    toast.success("Task completed");
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    dismissFollowUpTask(task.id);
                    toast.info("Task dismissed");
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{task.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${color}`}>
                {TASK_LABELS[task.type]}
              </Badge>
              {task.contact_name && (
                <span className="text-[11px] text-muted-foreground">
                  {task.contact_name}
                  {task.account_name ? ` · ${task.account_name}` : ""}
                </span>
              )}
              <div className="ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span
                  className={`text-[11px] font-medium ${
                    due.overdue
                      ? "text-red-500"
                      : due.today
                        ? "text-brand"
                        : "text-muted-foreground"
                  }`}
                >
                  {due.label}
                </span>
              </div>
            </div>
            {task.warm_path_id && (
              <div className="mt-2">
                <Link
                  href="/warm-leads?view=pipeline"
                  className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline"
                >
                  <ChevronRight className="w-3 h-3" />
                  View warm path
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type TabFilter = "pending" | "completed";

export default function TasksPage() {
  const { followUpTasks } = useSalesStore();
  const [tab, setTab] = useState<TabFilter>("pending");

  const { overdue, today, upcoming, completed } = useMemo(() => {
    const now = new Date();
    const pending = followUpTasks.filter((t) => t.status === "pending");
    const done = followUpTasks.filter((t) => t.status === "completed");

    const overdue = pending.filter((t) => {
      const due = new Date(t.due_date);
      return due < now && due.toDateString() !== now.toDateString();
    });

    const today = pending.filter((t) => {
      const due = new Date(t.due_date);
      return due.toDateString() === now.toDateString();
    });

    const upcoming = pending.filter((t) => {
      const due = new Date(t.due_date);
      return due > now && due.toDateString() !== now.toDateString();
    });

    return { overdue, today, upcoming, completed: done };
  }, [followUpTasks]);

  const overdueCount = overdue.length;
  const pendingCount = overdue.length + today.length + upcoming.length;

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-brand" />
            Tasks
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Follow-up tasks auto-created from warm path activity. {pendingCount} pending
            {overdueCount > 0 && (
              <span className="text-red-500 font-medium"> · {overdueCount} overdue</span>
            )}
          </p>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex items-center rounded-lg border border-border/60 overflow-hidden w-fit animate-fade-up delay-1">
        {(["pending", "completed"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-medium transition-colors capitalize ${
              tab === t
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            } ${t !== "pending" ? "border-l border-border/60" : ""}`}
          >
            {t === "pending" ? `Pending (${pendingCount})` : `Completed (${completed.length})`}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <div className="space-y-5 animate-fade-up delay-2">
          {pendingCount === 0 && (
            <EmptyState
              variant="empty"
              title="No pending tasks"
              description="Tasks are auto-created when warm path stages change."
            />
          )}

          {/* Overdue */}
          {overdue.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                  Overdue · {overdue.length}
                </span>
              </div>
              {overdue.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </section>
          )}

          {/* Today */}
          {today.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs font-semibold text-brand uppercase tracking-wider">
                  Due Today · {today.length}
                </span>
              </div>
              {today.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Upcoming · {upcoming.length}
                </span>
              </div>
              {upcoming.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </section>
          )}
        </div>
      )}

      {tab === "completed" && (
        <div className="space-y-2 animate-fade-up delay-2">
          {completed.length === 0 ? (
            <EmptyState
              variant="empty"
              title="No completed tasks"
              description="Mark tasks as done and they'll appear here."
            />
          ) : (
            completed.map((t) => (
              <Card key={t.id} className="border-border/40 opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through text-muted-foreground">
                        {t.title}
                      </p>
                      {t.contact_name && (
                        <p className="text-xs text-muted-foreground">
                          {t.contact_name} · {t.account_name}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-emerald-600 border-emerald-500/20 bg-emerald-500/10"
                    >
                      Done
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Phone call tasks info */}
      <div className="pt-2 border-t border-border/40 animate-fade-up delay-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>
            Phone call tasks are managed separately in{" "}
            <Link href="/approval-queue" className="text-brand hover:underline">
              Approval Queue → Phone
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
