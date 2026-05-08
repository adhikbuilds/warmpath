"use client";

import { Building2, Filter, GitFork, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scoreBgColor } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-muted text-muted-foreground",
  engaged: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  meeting: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  proposal: "bg-brand/10 text-brand border-brand/20",
  closed_won: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed_lost: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function AccountsPage() {
  const { accounts, contacts, signals, warmPaths } = useSalesStore();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"opportunity_score" | "intent_score" | "warmth_score">(
    "opportunity_score",
  );

  const industries = Array.from(new Set(accounts.map((a) => a.industry))).sort();

  const filtered = accounts
    .filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.industry.toLowerCase().includes(search.toLowerCase()) ||
        a.location.toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "all" || a.stage === stageFilter;
      return matchSearch && matchStage;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand" />
            Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All target accounts with scoring, signals, and relationship data.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {(["prospect", "engaged", "meeting", "proposal", "closed_won", "closed_lost"] as const).map(
          (stage) => {
            const count = accounts.filter((a) => a.stage === stage).length;
            return (
              <button
                type="button"
                key={stage}
                onClick={() => setStageFilter(stageFilter === stage ? "all" : stage)}
                className={`p-2 rounded-lg border text-center transition-colors text-left ${
                  stageFilter === stage
                    ? "border-brand/40 bg-brand/5"
                    : "border-border/50 hover:border-border bg-card"
                }`}
              >
                <div className="text-base font-bold">{count}</div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {stage.replace("_", " ")}
                </div>
              </button>
            );
          },
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="engaged">Engaged</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="closed_won">Closed Won</SelectItem>
            <SelectItem value="closed_lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="opportunity_score">Opportunity</SelectItem>
            <SelectItem value="intent_score">Intent</SelectItem>
            <SelectItem value="warmth_score">Warmth</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {accounts.length} accounts
        </span>
      </div>

      <div className="grid gap-2">
        {filtered.map((account) => {
          const accountContacts = contacts.filter((c) => c.account_id === account.id);
          const accountSignals = signals.filter((s) => s.account_id === account.id);
          const hasWarmPath = warmPaths.some((wp) =>
            accountContacts.some((c) => c.id === wp.contact_id),
          );
          const urgentSignals = accountSignals.filter(
            (s) => s.urgency_score !== undefined && s.urgency_score >= 75,
          );

          return (
            <Card
              key={account.id}
              className="border-border/60 hover:border-brand/30 transition-colors group"
            >
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <Link href={`/accounts/${account.id}`}>
                    <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand hover:bg-brand/20 transition-colors">
                      {account.name[0]}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/accounts/${account.id}`}
                        className="font-semibold text-sm hover:text-brand transition-colors"
                      >
                        {account.name}
                      </Link>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${STAGE_COLORS[account.stage]}`}
                      >
                        {account.stage.replace("_", " ")}
                      </Badge>
                      {hasWarmPath && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-brand/10 text-brand border-brand/20"
                        >
                          <GitFork className="w-2.5 h-2.5 mr-1" />
                          warm path
                        </Badge>
                      )}
                      {urgentSignals.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-red-500/10 text-red-500 border-red-500/20"
                        >
                          <Zap className="w-2.5 h-2.5 mr-1" />
                          {urgentSignals.length} urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {account.industry} · {account.employee_count?.toLocaleString()} emp ·{" "}
                      {account.location}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      {[
                        { label: "Fit", value: account.fit_score },
                        { label: "Intent", value: account.intent_score },
                        { label: "Warmth", value: account.warmth_score },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground w-8">{s.label}</span>
                          <Progress value={s.value} className="w-14 h-1" />
                          <span className="text-[10px] font-medium">{s.value}</span>
                        </div>
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {accountContacts.length} contact{accountContacts.length !== 1 ? "s" : ""} ·{" "}
                        {accountSignals.length} signal{accountSignals.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Hover actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-brand"
                      onClick={() => toast.success(`Research brief generated for ${account.name}`)}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div
                    className={`text-xs font-bold px-2 py-1 rounded border flex-shrink-0 ${scoreBgColor(account.opportunity_score)}`}
                  >
                    {account.opportunity_score}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0" asChild>
                    <Link href={`/accounts/${account.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm space-y-1">
            <Building2 className="w-8 h-8 mx-auto text-muted-foreground/30" />
            <p className="font-medium">No accounts found</p>
            <p className="text-xs">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
