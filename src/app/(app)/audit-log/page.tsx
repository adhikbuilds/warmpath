"use client";

import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CheckCircle,
  CreditCard,
  Download,
  Filter,
  FlaskConical,
  Link2,
  LogIn,
  Megaphone,
  MessageSquare,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { AuditAction } from "@/types";

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  "message.approved": {
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Message approved",
    color: "text-emerald-500",
  },
  "message.rejected": {
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    label: "Message rejected",
    color: "text-red-400",
  },
  "message.regenerated": {
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    label: "Message regenerated",
    color: "text-blue-500",
  },
  "message.generated": {
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    label: "Message generated",
    color: "text-brand",
  },
  "kb.item_added": {
    icon: <BookOpen className="w-3.5 h-3.5" />,
    label: "KB item added",
    color: "text-emerald-500",
  },
  "kb.item_updated": {
    icon: <BookOpen className="w-3.5 h-3.5" />,
    label: "KB item updated",
    color: "text-blue-500",
  },
  "kb.item_deleted": {
    icon: <Trash2 className="w-3.5 h-3.5" />,
    label: "KB item deleted",
    color: "text-red-400",
  },
  "kb.item_approved": {
    icon: <BookOpen className="w-3.5 h-3.5" />,
    label: "KB item approved for AI",
    color: "text-emerald-500",
  },
  "campaign.launched": {
    icon: <Megaphone className="w-3.5 h-3.5" />,
    label: "Campaign launched",
    color: "text-brand",
  },
  "campaign.paused": {
    icon: <Megaphone className="w-3.5 h-3.5" />,
    label: "Campaign paused",
    color: "text-brand",
  },
  "integration.connected": {
    icon: <Link2 className="w-3.5 h-3.5" />,
    label: "Integration connected",
    color: "text-emerald-500",
  },
  "integration.disconnected": {
    icon: <Link2 className="w-3.5 h-3.5" />,
    label: "Integration disconnected",
    color: "text-muted-foreground",
  },
  "plan.upgraded": {
    icon: <CreditCard className="w-3.5 h-3.5" />,
    label: "Plan upgraded",
    color: "text-brand",
  },
  "settings.updated": {
    icon: <Settings className="w-3.5 h-3.5" />,
    label: "Settings updated",
    color: "text-muted-foreground",
  },
  "test.scenario_run": {
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    label: "Test scenario run",
    color: "text-violet-500",
  },
  "user.login": {
    icon: <LogIn className="w-3.5 h-3.5" />,
    label: "User login",
    color: "text-blue-500",
  },
  "user.logout": {
    icon: <LogIn className="w-3.5 h-3.5" />,
    label: "User logout",
    color: "text-muted-foreground",
  },
  "workspace.created": {
    icon: <Building2 className="w-3.5 h-3.5" />,
    label: "Workspace created",
    color: "text-brand",
  },
  "onboarding.completed": {
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    label: "Onboarding completed",
    color: "text-emerald-500",
  },
};

const ACTION_CATEGORIES = {
  all: "All events",
  message: "Messages",
  kb: "Knowledge Base",
  campaign: "Campaigns",
  integration: "Integrations",
  user: "Users",
  settings: "Settings",
  test: "Tests",
};

type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

function exportCSV(logs: import("@/types").AuditLog[]) {
  const header = ["timestamp", "action", "user_name", "entity", "details"].join(",");
  const rows = logs.map((log) => {
    const details = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, "'") : "";
    return [
      `"${log.created_at}"`,
      `"${log.action}"`,
      `"${log.actor_name}"`,
      `"${log.entity_name ?? ""}"`,
      `"${details}"`,
    ].join(",");
  });
  const csvContent = [header, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "audit-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogPage() {
  const { auditLogs } = useSalesStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const filtered = auditLogs.filter((log) => {
    const matchSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor_name.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || log.action.startsWith(category);

    let matchDate = true;
    if (dateRange !== "all") {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      matchDate = new Date(log.created_at).getTime() >= cutoff;
    }

    return matchSearch && matchCategory && matchDate;
  });

  return (
    <div className="p-6 space-y-5 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand" />
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete record of all workspace activity messages, KB changes, logins, and more.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total events", value: auditLogs.length },
          {
            label: "Messages",
            value: auditLogs.filter((l) => l.action.startsWith("message")).length,
          },
          { label: "KB changes", value: auditLogs.filter((l) => l.action.startsWith("kb")).length },
          {
            label: "Team actions",
            value: auditLogs.filter(
              (l) => l.action.startsWith("user") || l.action.startsWith("workspace"),
            ).length,
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 text-sm w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACTION_CATEGORIES).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="h-8 text-sm w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(DATE_RANGE_LABELS) as [DateRange, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} events</span>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5 ml-auto"
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
        >
          <Download className="w-3 h-3" />
          Export CSV
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {filtered.map((log, idx) => {
          const config = ACTION_CONFIG[log.action] ?? {
            icon: <Bell className="w-3.5 h-3.5" />,
            label: log.action.replace(/\./g, " ").replace(/_/g, " "),
            color: "text-muted-foreground",
          };

          return (
            <div key={log.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center flex-shrink-0 ${config.color}`}
                >
                  {config.icon}
                </div>
                {idx < filtered.length - 1 && <div className="w-px flex-1 bg-border/40 my-1" />}
              </div>
              <div className="pb-3 flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium">{config.label}</span>
                  {log.entity_name && (
                    <span className="text-xs text-muted-foreground truncate">
                      {log.entity_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">by {log.actor_name}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(log.created_at)}
                  </span>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <div className="flex items-center gap-1">
                        {Object.entries(log.metadata)
                          .slice(0, 2)
                          .map(([k, v]) => (
                            <Badge key={k} variant="outline" className="text-[9px]">
                              {k}: {String(v)}
                            </Badge>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
}
