"use client";

import {
  ArrowRight,
  CheckCircle2,
  Download,
  Filter,
  GitFork,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Upload,
  UserCheck,
  UserPlus,
  Users,
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
import { Textarea } from "@/components/ui/textarea";
import { computeWarmthFromDemoData } from "@/lib/scoring/warmth";
import { scoreBgColor } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { Contact } from "@/types";

const SENIORITY_COLORS: Record<string, string> = {
  c_suite: "bg-brand/10 text-brand border-brand/20",
  vp: "bg-[#7b6ea8]/10 text-[#c0c1ff] border-[#7b6ea8]/20",
  director: "bg-[#5db8a6]/10 text-[#4edea3] border-[#5db8a6]/20",
  manager: "bg-[#5db872]/10 text-[#5db872] border-[#5db872]/20",
  ic: "bg-muted text-muted-foreground",
};

const PAGE_SIZE = 100; // virtualised window cap

// ─── Research a Person feature ────────────────────────────────────────────────

const RESEARCH_SUGGESTIONS = [
  "Joanne Jang (OpenAI)",
  "Reid Hoffman (LinkedIn)",
  "Sarah Franklin (Salesforce)",
];

const MOCK_RESEARCH_RESULTS: Record<
  string,
  {
    name: string;
    title: string;
    company: string;
    linkedin: string;
    warmth: number;
    mutual: string[];
    summary: string;
  }
> = {
  default: {
    name: "Priya Sharma",
    title: "VP of Sales",
    company: "Acme AI",
    linkedin: "linkedin.com/in/priyasharma",
    warmth: 72,
    mutual: ["Alex Chen", "Marcus Williams"],
    summary:
      "Growth-focused sales leader with 12+ years in B2B SaaS. Recently expanded her team by 40% and is evaluating new tools for pipeline management.",
  },
};

function ResearchAPersonSection({
  onAdd,
}: {
  onAdd: (name: string, title: string, company: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [autoResearch, setAutoResearch] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "result">("idle");
  const [result, setResult] = useState<(typeof MOCK_RESEARCH_RESULTS)["default"] | null>(null);

  function runResearch(q: string) {
    if (!q.trim()) return;
    setState("loading");
    setTimeout(() => {
      const r = MOCK_RESEARCH_RESULTS.default;
      const parts = q.split(" ");
      setResult({ ...r, name: parts[0] || r.name });
      setState("result");
    }, 1600);
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-brand" />
            Research a Person
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Auto-research before meetings</span>
            <button
              type="button"
              onClick={() => setAutoResearch(!autoResearch)}
              className={`relative w-8 h-4 rounded-full transition-colors ${autoResearch ? "bg-brand" : "bg-muted"}`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${autoResearch ? "left-4" : "left-0.5"}`}
              />
            </button>
            <span className="text-[9px] font-medium border border-amber-500/40 text-amber-500 bg-amber-500/10 rounded px-1 py-0.5">
              Beta
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runResearch(query);
              }}
              placeholder="Write a name and one detail about them…"
              className="w-full h-10 rounded-lg border border-border bg-background px-4 text-[13px] outline-none focus:border-brand/50 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => runResearch(query)}
            disabled={state === "loading"}
            className="w-10 h-10 rounded-lg bg-brand text-white flex items-center justify-center disabled:opacity-50 transition-opacity shrink-0"
          >
            {state === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {RESEARCH_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                runResearch(s);
              }}
              className="text-[11px] border border-border/50 rounded-full px-3 py-1 text-muted-foreground hover:text-foreground hover:border-brand/40 hover:bg-brand/5 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {state === "result" && result && (
        <div className="border-t border-border/50 px-5 py-4 bg-brand/3">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand/15 text-brand flex items-center justify-center text-lg font-bold shrink-0">
              {result.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[14px] font-semibold">{result.name}</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${scoreBgColor(result.warmth)}`}
                >
                  {result.warmth}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mb-1">
                {result.title} · {result.company}
              </p>
              <p className="text-[12px] text-muted-foreground/80 leading-relaxed mb-2">
                {result.summary}
              </p>
              {result.mutual.length > 0 && (
                <p className="text-[11px] text-brand">
                  Mutual connections: {result.mutual.join(", ")}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onAdd(result.name, result.title, result.company);
                  setState("idle");
                  setQuery("");
                  toast.success(`${result.name} added to contacts`);
                }}
                className="flex items-center gap-1.5 text-[11px] font-medium border border-brand text-brand rounded-lg px-3 py-1.5 hover:bg-brand hover:text-white transition-colors"
              >
                <UserPlus className="w-3 h-3" /> Add contact
              </button>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="text-[10px] text-muted-foreground hover:text-foreground text-center"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── People you may know ──────────────────────────────────────────────────────

const SUGGESTED_PEOPLE = [
  {
    id: "sp1",
    name: "Priya Sharma",
    title: "VP of Sales",
    company: "Acme AI",
    color: "#8b5cf6",
    connections: "1.2K",
    warmth: 72,
  },
  {
    id: "sp2",
    name: "Liam Chen",
    title: "CTO",
    company: "CloudStack",
    color: "#2563eb",
    connections: "843",
    warmth: 65,
  },
  {
    id: "sp3",
    name: "Aisha Patel",
    title: "Head of Growth",
    company: "Finflow",
    color: "#10b981",
    connections: "2.1K",
    warmth: 58,
  },
  {
    id: "sp4",
    name: "Marcus Williams",
    title: "Founder",
    company: "GridOps",
    color: "#f59e0b",
    connections: "3.4K",
    warmth: 81,
  },
  {
    id: "sp5",
    name: "Elena Rodriguez",
    title: "Dir. of Engineering",
    company: "NovaTech",
    color: "#ec4899",
    connections: "671",
    warmth: 49,
  },
  {
    id: "sp6",
    name: "David Kim",
    title: "Chief Revenue Officer",
    company: "SalesForge",
    color: "#06b6d4",
    connections: "5.2K",
    warmth: 76,
  },
];

function PeopleSuggestions({
  onAdd,
}: {
  onAdd: (id: string, name: string, title: string, company: string) => void;
}) {
  const [added, setAdded] = useState<Set<string>>(new Set());

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold text-muted-foreground">
          Suggested contacts based on your network
        </h2>
        <span className="text-[11px] text-muted-foreground">2nd degree connections</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {SUGGESTED_PEOPLE.map((p) => {
          const isAdded = added.has(p.id);
          const initials = p.name
            .split(" ")
            .map((n) => n[0])
            .join("");
          return (
            <div
              key={p.id}
              className={`rounded-xl border p-4 transition-all ${isAdded ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 bg-card hover:border-border"}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
                  style={{ backgroundColor: `${p.color}20`, color: p.color }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground/70 truncate">{p.company}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {p.connections} connections
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${scoreBgColor(p.warmth)}`}
                  >
                    {p.warmth}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isAdded}
                  onClick={() => {
                    setAdded((prev) => new Set([...prev, p.id]));
                    onAdd(p.id, p.name, p.title, p.company);
                  }}
                  className={`flex items-center gap-1 text-[10px] font-medium rounded-lg px-2.5 py-1.5 transition-colors ${isAdded ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-brand text-white hover:bg-brand/90"}`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Added
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" /> Add
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const router = useRouter();
  const {
    contacts,
    accounts,
    warmPaths,
    teamMembers,
    addMessageToQueue,
    addContact,
    updateContact,
  } = useSalesStore();
  const [search, setSearch] = useState("");
  const [seniorityFilter, setSeniorityFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showAssignOwner, setShowAssignOwner] = useState(false);
  const [showAddToSequence, setShowAddToSequence] = useState(false);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible(visibleIds: string[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = visibleIds.every((id) => next.has(id));
      if (allSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  function exportSelected(selected: Contact[]) {
    const header = "name,email,title,department,seniority,account,warmth_score";
    const rows = selected.map((c) => {
      const account = accounts.find((a) => a.id === c.account_id)?.name ?? "";
      return [
        c.name,
        c.email ?? "",
        c.title ?? "",
        c.department ?? "",
        c.seniority ?? "",
        account,
        c.warmth_score,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} contacts`);
  }

  // Import modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<"idle" | "matching" | "done">("idle");
  const [importCsv, setImportCsv] = useState("");
  const [matchingPhase, setMatchingPhase] = useState("");

  // Add-modal form state
  const [newContactName, setNewContactName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newSeniority, setNewSeniority] = useState<Contact["seniority"]>("ic");
  const [newEmail, setNewEmail] = useState("");
  const [newAccountId, setNewAccountId] = useState("");

  // Edit-modal form state
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSeniority, setEditSeniority] = useState<Contact["seniority"]>("ic");
  const [editEmail, setEditEmail] = useState("");
  const [editAccountId, setEditAccountId] = useState("");

  function startImport() {
    setImportStep("matching");
    const phases = [
      "Parsing contacts…",
      "Matching against your team's LinkedIn network…",
      "Scoring warm paths via relationship graph…",
    ];
    let i = 0;
    setMatchingPhase(phases[0]);
    const interval = setInterval(() => {
      i++;
      if (i < phases.length) {
        setMatchingPhase(phases[i]);
      } else {
        clearInterval(interval);
        setImportStep("done");
      }
    }, 900);
  }

  function closeImport() {
    setImportOpen(false);
    setImportStep("idle");
    setImportCsv("");
    setMatchingPhase("");
  }

  function openEdit(contact: Contact) {
    setEditName(contact.name);
    setEditTitle(contact.title ?? "");
    setEditDepartment(contact.department ?? "");
    setEditSeniority(contact.seniority ?? "ic");
    setEditEmail(contact.email ?? "");
    setEditAccountId(contact.account_id ?? "");
    setEditContact(contact);
  }

  const departments = Array.from(
    new Set(contacts.map((c) => c.department).filter(Boolean)),
  ).sort() as string[];

  const filtered = contacts
    .filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.department?.toLowerCase().includes(search.toLowerCase());
      const matchSeniority = seniorityFilter === "all" || c.seniority === seniorityFilter;
      const matchDept = deptFilter === "all" || c.department === deptFilter;
      return matchSearch && matchSeniority && matchDept;
    })
    .sort((a, b) => b.warmth_score - a.warmth_score);

  const warmPathContacts = contacts.filter((c) =>
    warmPaths.some((wp) => wp.contact_id === c.id),
  ).length;
  const avgWarmth = Math.round(
    contacts.reduce((s, c) => s + c.warmth_score, 0) / (contacts.length || 1),
  );
  const cSuiteCount = contacts.filter(
    (c) => c.seniority === "c_suite" || c.seniority === "vp",
  ).length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            Contacts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All target contacts ranked by relationship warmth.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add contact
          </Button>
        </div>
      </div>

      {/* Research a Person */}
      <ResearchAPersonSection
        onAdd={(name, title, company) => {
          addContact({
            name,
            title,
            email: undefined,
            phone: undefined,
            account_id: undefined,
            linkedin_url: undefined,
            seniority: "ic",
            department: undefined,
            persona: undefined,
          });
        }}
      />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total contacts", value: contacts.length, sub: "across all accounts" },
          {
            label: "Warm path coverage",
            value: `${warmPathContacts}`,
            sub: `of ${contacts.length} have a path in`,
          },
          { label: "Avg warmth score", value: avgWarmth, sub: `${cSuiteCount} C-Suite / VP` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-xl border border-border/50 bg-card text-center"
          >
            <div className="text-2xl font-bold text-brand">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            <div className="text-[10px] text-muted-foreground/60">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Input
            placeholder="Search by name, title, or department…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="pl-8 h-8 text-sm"
          />
          <Filter className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <Select value={seniorityFilter} onValueChange={setSeniorityFilter}>
          <SelectTrigger className="w-[150px] h-8 text-sm">
            <SelectValue placeholder="Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All seniority</SelectItem>
            <SelectItem value="c_suite">C-Suite</SelectItem>
            <SelectItem value="vp">VP</SelectItem>
            <SelectItem value="director">Director</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="ic">IC</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[150px] h-8 text-sm">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {contacts.length} contacts
        </span>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand/40 bg-brand/5 sticky top-0 z-10">
          <span className="text-xs font-semibold text-brand">{selectedIds.size} selected</span>
          <span className="w-px h-4 bg-border" />
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAddToSequence((v) => !v)}
          >
            <Zap className="w-3 h-3" />
            Add to sequence
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAssignOwner((v) => !v)}
          >
            <UserCheck className="w-3 h-3" />
            Assign owner
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => {
              const selected = filtered.filter((c) => selectedIds.has(c.id));
              exportSelected(selected);
            }}
          >
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-[11px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Inline panels for bulk actions */}
      {selectedIds.size > 0 && showAssignOwner && (
        <div className="flex items-center gap-2 flex-wrap p-2.5 rounded-md border border-border/60 bg-card">
          <span className="text-[11px] text-muted-foreground mr-1">
            Assign {selectedIds.size} to
          </span>
          {teamMembers.slice(0, 6).map((tm) => (
            <Button
              key={tm.id}
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => {
                toast.success(`Assigned ${selectedIds.size} contacts to ${tm.name}`);
                setShowAssignOwner(false);
                setSelectedIds(new Set());
              }}
            >
              {tm.name}
            </Button>
          ))}
          {teamMembers.length === 0 && (
            <span className="text-[11px] text-muted-foreground italic">
              No team members configured
            </span>
          )}
        </div>
      )}
      {selectedIds.size > 0 && showAddToSequence && (
        <div className="flex items-center gap-2 flex-wrap p-2.5 rounded-md border border-border/60 bg-card">
          <span className="text-[11px] text-muted-foreground mr-1">Add {selectedIds.size} to</span>
          {["Warm intro · default", "Q3 enterprise outbound", "Champion follow-up"].map((seq) => (
            <Button
              key={seq}
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => {
                toast.success(`Added ${selectedIds.size} contacts to "${seq}"`);
                setShowAddToSequence(false);
                setSelectedIds(new Set());
              }}
            >
              {seq}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] border-dashed"
            onClick={() => router.push("/campaigns/new")}
          >
            + New sequence
          </Button>
        </div>
      )}

      {/* Select-all row + result count (above list for clarity) */}
      <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          aria-label="Select all visible contacts"
          checked={
            filtered.slice(0, visibleCount).every((c) => selectedIds.has(c.id)) &&
            filtered.length > 0
          }
          onChange={() => selectAllVisible(filtered.slice(0, visibleCount).map((c) => c.id))}
          className="accent-brand"
        />
        <span>Select all visible</span>
        <span className="ml-auto">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}
        </span>
      </div>

      {/* Contact list */}
      <div className="grid gap-2">
        {filtered.slice(0, visibleCount).map((contact) => {
          const account = accounts.find((a) => a.id === contact.account_id);
          const hasWarmPath = warmPaths.some((wp) => wp.contact_id === contact.id);

          return (
            <Card
              key={contact.id}
              className={`border-border/60 hover:border-brand/30 transition-colors group ${
                selectedIds.has(contact.id) ? "ring-1 ring-brand/40 bg-brand/[0.03]" : ""
              }`}
            >
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${contact.name}`}
                    checked={selectedIds.has(contact.id)}
                    onChange={() => toggleSelected(contact.id)}
                    className="accent-brand"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Link href={`/contacts/${contact.id}`}>
                    <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-brand hover:bg-brand/20 transition-colors">
                      {contact.name[0]}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-semibold text-sm hover:text-brand transition-colors"
                      >
                        {contact.name}
                      </Link>
                      {contact.seniority && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${SENIORITY_COLORS[contact.seniority] ?? ""}`}
                        >
                          {contact.seniority.replace("_", " ")}
                        </Badge>
                      )}
                      {hasWarmPath && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-brand/10 text-brand border-brand/20"
                        >
                          <GitFork className="w-2.5 h-2.5 mr-1" />
                          warm path
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                    <div className="flex items-center gap-4 mt-1.5">
                      {[
                        { label: "Warmth", value: contact.warmth_score },
                        { label: "Engage", value: contact.engagement_score },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground w-12">{s.label}</span>
                          <Progress value={s.value} className="w-14 h-1" />
                          <span className="text-[10px] font-medium">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        openEdit(contact);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {contact.email && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => window.open(`mailto:${contact.email}`, "_blank")}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-brand"
                      onClick={() => {
                        const warmPath = warmPaths.find(
                          (wp) => wp.account_id === contact.account_id,
                        );
                        addMessageToQueue({
                          account_id: contact.account_id ?? "",
                          contact_id: contact.id,
                          warm_path_id: warmPath?.id,
                          channel: "email",
                          subject: `Outreach to ${contact.name}`,
                          body: `Hi ${contact.name.split(" ")[0]},\n\nI came across your profile and wanted to reach out — your work at ${accounts.find((a) => a.id === contact.account_id)?.name ?? "your company"} looks impressive.\n\nWould love to connect and share how we're helping similar teams.\n\nBest,\nAdhik`,
                          status: "draft",
                          approval_status: "pending",
                          generated_by_ai: true,
                          confidence_score: 0.8,
                          personalization_reason: `Direct outreach to ${contact.title ?? "contact"} at ${accounts.find((a) => a.id === contact.account_id)?.name ?? "company"}`,
                          factual_claims: [],
                          supporting_sources: [],
                          risk_flags: [],
                        });
                        toast.success(
                          `Outreach drafted for ${contact.name} — review in Approval Queue`,
                        );
                        router.push("/approval-queue");
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div
                    className={`text-xs font-bold px-2 py-1 rounded border cursor-help ${scoreBgColor(contact.warmth_score)}`}
                    title={computeWarmthFromDemoData({ contact }).breakdown}
                  >
                    {contact.warmth_score}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <Link href={`/contacts/${contact.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm space-y-1">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/30" />
            <p className="font-medium">No contacts found</p>
            <p className="text-xs">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Virtualised window: render in PAGE_SIZE chunks so 1,000-contact lists stay smooth */}
        {visibleCount < filtered.length && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="w-full py-2.5 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            Load next {Math.min(PAGE_SIZE, filtered.length - visibleCount)} (showing {visibleCount}{" "}
            of {filtered.length})
          </button>
        )}
      </div>

      {/* People you may know */}
      <PeopleSuggestions
        onAdd={(id, name, title, company) => {
          addContact({
            name,
            title,
            email: undefined,
            phone: undefined,
            account_id: undefined,
            linkedin_url: undefined,
            seniority: "ic",
            department: undefined,
            persona: undefined,
          });
          toast.success(`${name} added to contacts`);
        }}
      />

      {/* Import Contacts modal */}
      <Dialog open={importOpen} onOpenChange={(o) => !o && closeImport()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-brand" />
              Import contacts
            </DialogTitle>
          </DialogHeader>

          {importStep === "idle" && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Paste a CSV or LinkedIn export. WarmBlue will match each contact against your team's
                relationship graph to find warm intro paths.
              </p>
              <Textarea
                placeholder={
                  "Name,Email,Company\nJane Smith,jane@acme.com,Acme Corp\nTom Lee,tom@techco.com,TechCo"
                }
                value={importCsv}
                onChange={(e) => setImportCsv(e.target.value)}
                className="text-xs min-h-[110px] resize-none font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Accepts: CSV, LinkedIn connections export, or Clay-enriched list
              </p>
            </div>
          )}

          {importStep === "matching" && (
            <div className="py-10 space-y-4 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{matchingPhase}</p>
                <p className="text-xs text-muted-foreground">
                  Checking mutual connections, shared companies, and alumni networks…
                </p>
              </div>
            </div>
          )}

          {importStep === "done" && (
            <div className="py-4 space-y-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-brand" />
                </div>
                <p className="font-semibold">47 contacts analyzed</p>
                <p className="text-sm text-muted-foreground">
                  12 have warm paths via your team's network
                </p>
              </div>
              <div className="rounded-xl border border-border/50 divide-y divide-border/40 overflow-hidden">
                {[
                  {
                    name: "Sarah Park",
                    company: "Stripe",
                    via: "James Liu",
                    evidence: "Worked together at Salesforce 2022–24",
                  },
                  {
                    name: "Alex Morgan",
                    company: "Plaid",
                    via: "Mark Johnson",
                    evidence: "Alumni from Stanford MBA cohort",
                  },
                  {
                    name: "Chris Wu",
                    company: "Brex",
                    via: "Sarah Chen",
                    evidence: "Met at SaaStr Annual 2025",
                  },
                ].map((m) => (
                  <div key={m.name} className="flex items-start gap-3 px-3 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-semibold text-brand flex-shrink-0">
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">
                        {m.name} · {m.company}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        via {m.via} ·{" "}
                        <span className="italic text-muted-foreground/80">{m.evidence}</span>
                      </p>
                    </div>
                    <GitFork className="w-3.5 h-3.5 text-brand flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                35 more contacts added without warm paths — reachable via cold email
              </p>
            </div>
          )}

          <DialogFooter>
            {importStep === "idle" && (
              <>
                <Button variant="outline" size="sm" onClick={closeImport}>
                  Cancel
                </Button>
                <Button size="sm" onClick={startImport} disabled={!importCsv.trim()}>
                  Find warm paths
                </Button>
              </>
            )}
            {importStep === "done" && (
              <>
                <Button variant="outline" size="sm" onClick={closeImport}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success("47 contacts added · 12 warm paths ready in Warm Leads");
                    closeImport();
                  }}
                >
                  Add to WarmBlue
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1.5 block">Full name</Label>
              <Input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Jane Smith"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VP of Sales"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Department</Label>
                <Input
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Sales"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Seniority</Label>
                <Select
                  value={newSeniority ?? "ic"}
                  onValueChange={(v) => setNewSeniority(v as Contact["seniority"])}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["c_suite", "vp", "director", "manager", "ic"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Account</Label>
                <Select value={newAccountId} onValueChange={setNewAccountId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Email</Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jane@acme.com"
                className="h-8 text-sm"
                type="email"
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
                if (!newContactName.trim()) return;
                addContact({
                  account_id: newAccountId,
                  name: newContactName.trim(),
                  email: newEmail,
                  title: newTitle,
                  seniority: newSeniority ?? "ic",
                  department: newDepartment,
                  persona: "",
                  fit_score: 50,
                  warmth_score: 50,
                  engagement_score: 50,
                });
                toast.success(`${newContactName.trim()} added`);
                setNewContactName("");
                setNewTitle("");
                setNewDepartment("");
                setNewSeniority("ic");
                setNewEmail("");
                setNewAccountId("");
                setAddOpen(false);
              }}
            >
              Add contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact modal */}
      <Dialog open={!!editContact} onOpenChange={(open) => !open && setEditContact(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs mb-1.5 block">Full name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Department</Label>
                <Input
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Seniority</Label>
                <Select
                  value={editSeniority ?? "ic"}
                  onValueChange={(v) => setEditSeniority(v as Contact["seniority"])}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["c_suite", "vp", "director", "manager", "ic"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Account</Label>
                <Select value={editAccountId} onValueChange={setEditAccountId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Email</Label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="h-8 text-sm"
                type="email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditContact(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editContact || !editName.trim()) return;
                updateContact(editContact.id, {
                  name: editName.trim(),
                  title: editTitle,
                  department: editDepartment,
                  seniority: editSeniority,
                  email: editEmail,
                  account_id: editAccountId,
                });
                toast.success(`${editName.trim()} updated`);
                setEditContact(null);
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
