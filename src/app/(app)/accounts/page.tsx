"use client";

import {
  Bookmark,
  Building2,
  DollarSign,
  Filter,
  GitFork,
  Pencil,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Account } from "@/types";

function CompanyLogo({ name, domain, size = 36 }: { name: string; domain?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const cleanDomain = domain?.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  const showLogo = !failed && cleanDomain && cleanDomain.includes(".");

  if (showLogo) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-lg border border-border/40 bg-white overflow-hidden flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <img
          src={`https://logo.clearbit.com/${cleanDomain}`}
          alt={name}
          width={size}
          height={size}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand hover:bg-brand/20 transition-colors"
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-muted text-muted-foreground",
  engaged: "bg-[#5db8a6]/10 text-[#4edea3] border-[#5db8a6]/20",
  meeting: "bg-[#7b6ea8]/10 text-[#c0c1ff] border-[#7b6ea8]/20",
  proposal: "bg-brand/10 text-brand border-brand/20",
  closed_won: "bg-[#5db872]/10 text-[#5db872] border-[#5db872]/20",
  closed_lost: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function AccountsPage() {
  const router = useRouter();
  const { accounts, contacts, signals, warmPaths, addMessageToQueue, addAccount, updateAccount } =
    useSalesStore();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [opportunityFilter, setOpportunityFilter] = useState<"all" | "hot" | "warm" | "cool">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"opportunity_score" | "intent_score" | "warmth_score">(
    "opportunity_score",
  );
  const [activeView, setActiveView] = useState<string | null>(null);

  // Hardcoded saved views — each applies a known combination of filters.
  type SavedView = { id: string; label: string; apply: () => void };
  const savedViews: SavedView[] = [
    {
      id: "engaged-warm",
      label: "Engaged + warm path",
      apply: () => {
        setStageFilter("engaged");
        setOpportunityFilter("all");
        setSortBy("warmth_score");
        setSearch("");
      },
    },
    {
      id: "hot-no-warm",
      label: "High intent, no warm path",
      apply: () => {
        setStageFilter("all");
        setOpportunityFilter("hot");
        setSortBy("intent_score");
        setSearch("");
      },
    },
    {
      id: "in-pipeline",
      label: "Active pipeline",
      apply: () => {
        setStageFilter("meeting");
        setOpportunityFilter("all");
        setSortBy("opportunity_score");
        setSearch("");
      },
    },
  ];
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  // Add-modal form state
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("SaaS");
  const [newStage, setNewStage] = useState<Account["stage"]>("prospect");
  const [newEmployees, setNewEmployees] = useState("100");
  const [newLocation, setNewLocation] = useState("United States");

  // Edit-modal form state (initialised when editAccount changes)
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editStage, setEditStage] = useState<Account["stage"]>("prospect");
  const [editEmployees, setEditEmployees] = useState("");
  const [editLocation, setEditLocation] = useState("");

  function openEdit(account: Account) {
    setEditName(account.name);
    setEditIndustry(account.industry);
    setEditStage(account.stage);
    setEditEmployees(String(account.employee_count ?? 100));
    setEditLocation(account.location);
    setEditAccount(account);
  }

  const filtered = accounts
    .filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.industry.toLowerCase().includes(search.toLowerCase()) ||
        a.location.toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "all" || a.stage === stageFilter;
      const matchOpp =
        opportunityFilter === "all" ||
        (opportunityFilter === "hot" && a.opportunity_score >= 80) ||
        (opportunityFilter === "warm" && a.opportunity_score >= 50 && a.opportunity_score < 80) ||
        (opportunityFilter === "cool" && a.opportunity_score < 50);
      return matchSearch && matchStage && matchOpp;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  // Pipeline value rollup — Account has no explicit pipeline $ field, so estimate
  // as opportunity_score × $1K (gives a usable, transparent rollup demo).
  const pipelineValue = filtered.reduce((sum, a) => sum + a.opportunity_score * 1000, 0);
  const totalPipelineValue = accounts.reduce((sum, a) => sum + a.opportunity_score * 1000, 0);
  const fmtMoney = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

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
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add account
        </Button>
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

      {/* Pipeline rollup */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border/60 bg-card">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Pipeline value (filtered)
            </p>
            <p className="text-lg font-bold tabular-nums">{fmtMoney(pipelineValue)}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total pipeline
          </p>
          <p className="text-sm font-semibold tabular-nums text-muted-foreground">
            {fmtMoney(totalPipelineValue)}
          </p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Accounts</p>
          <p className="text-sm font-semibold tabular-nums">
            {filtered.length}
            <span className="text-muted-foreground">/{accounts.length}</span>
          </p>
        </div>
        <span className="ml-auto text-[10px] text-muted-foreground italic">
          Estimated as opportunity score × $1K (replace with CRM amount when wired)
        </span>
      </div>

      {/* Saved views */}
      <div className="flex items-center gap-2 flex-wrap">
        <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Saved views
        </span>
        {savedViews.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              v.apply();
              setActiveView(v.id);
              toast.success(`Applied view: ${v.label}`);
            }}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              activeView === v.id
                ? "border-brand/60 bg-brand/10 text-brand"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => toast.success("Current view saved (demo) — wire to backend when ready")}
          className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-dashed border-border/60 text-muted-foreground hover:border-border hover:text-foreground transition-colors"
        >
          + Save current
        </button>
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
        <Select
          value={stageFilter}
          onValueChange={(v) => {
            setStageFilter(v);
            setActiveView(null);
          }}
        >
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
        <Select
          value={opportunityFilter}
          onValueChange={(v) => {
            setOpportunityFilter(v as typeof opportunityFilter);
            setActiveView(null);
          }}
        >
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="Opportunity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All opportunity</SelectItem>
            <SelectItem value="hot">Hot (80+)</SelectItem>
            <SelectItem value="warm">Warm (50–79)</SelectItem>
            <SelectItem value="cool">Cool (&lt; 50)</SelectItem>
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
          const hasWarmBlue = warmPaths.some((wp) =>
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
                    <CompanyLogo name={account.name} domain={account.domain} size={36} />
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
                      {hasWarmBlue && (
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
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        openEdit(account);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-brand"
                      onClick={() => {
                        const topContact = contacts.find((c) => c.account_id === account.id);
                        const warmPath = warmPaths.find((wp) => wp.account_id === account.id);
                        const topSignal = signals.find((s) => s.account_id === account.id);
                        addMessageToQueue({
                          account_id: account.id,
                          contact_id: topContact?.id ?? "",
                          warm_path_id: warmPath?.id,
                          signal_id: topSignal?.id,
                          channel: warmPath ? "warm_intro" : "email",
                          subject: `Outreach — ${account.name}`,
                          body: `Hi,\n\nI've been following ${account.name} and wanted to reach out about how we might help your team.\n\nWould love to find 15 minutes to share what we're working on.\n\nBest,\nAdhik`,
                          status: "draft",
                          approval_status: "pending",
                          generated_by_ai: true,
                          confidence_score: 0.82,
                          personalization_reason: `Account-level outreach to ${account.name} (${account.industry})`,
                          factual_claims: [],
                          supporting_sources: [],
                          risk_flags: [],
                        });
                        toast.success(
                          `Outreach drafted for ${account.name} — review in Approval Queue`,
                        );
                        router.push("/approval-queue");
                      }}
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

      {/* Add Account modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1.5 block">Company name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Acme Corp"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Industry</Label>
              <Input
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                placeholder="SaaS"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Stage</Label>
                <Select value={newStage} onValueChange={(v) => setNewStage(v as Account["stage"])}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "prospect",
                        "engaged",
                        "meeting",
                        "proposal",
                        "closed_won",
                        "closed_lost",
                      ] as const
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Employees</Label>
                <Input
                  value={newEmployees}
                  onChange={(e) => setNewEmployees(e.target.value)}
                  placeholder="100"
                  className="h-8 text-sm"
                  type="number"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Location</Label>
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="United States"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!newName.trim()) return;
                addAccount({
                  name: newName.trim(),
                  industry: newIndustry,
                  stage: newStage,
                  employee_count: Number(newEmployees) || 100,
                  location: newLocation,
                  domain: "",
                  description: "",
                  fit_score: 50,
                  intent_score: 50,
                  warmth_score: 50,
                  opportunity_score: 50,
                });
                toast.success(`${newName.trim()} added`);
                setNewName("");
                setNewIndustry("SaaS");
                setNewStage("prospect");
                setNewEmployees("100");
                setNewLocation("United States");
                setAddOpen(false);
              }}
            >
              Add account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account modal */}
      <Dialog open={!!editAccount} onOpenChange={(open) => !open && setEditAccount(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1.5 block">Company name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Industry</Label>
              <Input
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Stage</Label>
                <Select
                  value={editStage}
                  onValueChange={(v) => setEditStage(v as Account["stage"])}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "prospect",
                        "engaged",
                        "meeting",
                        "proposal",
                        "closed_won",
                        "closed_lost",
                      ] as const
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Employees</Label>
                <Input
                  value={editEmployees}
                  onChange={(e) => setEditEmployees(e.target.value)}
                  className="h-8 text-sm"
                  type="number"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Location</Label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditAccount(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editAccount || !editName.trim()) return;
                updateAccount(editAccount.id, {
                  name: editName.trim(),
                  industry: editIndustry,
                  stage: editStage,
                  employee_count: Number(editEmployees) || 100,
                  location: editLocation,
                });
                toast.success(`${editName.trim()} updated`);
                setEditAccount(null);
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
