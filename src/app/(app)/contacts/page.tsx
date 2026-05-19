"use client";

import {
  CheckCircle2,
  Filter,
  GitFork,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  Users,
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
import { scoreBgColor } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { Contact } from "@/types";

const SENIORITY_COLORS: Record<string, string> = {
  c_suite: "bg-brand/10 text-brand border-brand/20",
  vp: "bg-[#7b6ea8]/10 text-[#5c5180] border-[#7b6ea8]/20",
  director: "bg-[#5db8a6]/10 text-[#3a8f7e] border-[#5db8a6]/20",
  manager: "bg-[#5db872]/10 text-[#3a8f4e] border-[#5db872]/20",
  ic: "bg-muted text-muted-foreground",
};

export default function ContactsPage() {
  const router = useRouter();
  const { contacts, accounts, warmPaths, addMessageToQueue, addContact, updateContact } =
    useSalesStore();
  const [search, setSearch] = useState("");
  const [seniorityFilter, setSeniorityFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

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
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Contact list */}
      <div className="grid gap-2">
        {filtered.map((contact) => {
          const account = accounts.find((a) => a.id === contact.account_id);
          const hasWarmPath = warmPaths.some((wp) => wp.contact_id === contact.id);

          return (
            <Card
              key={contact.id}
              className="border-border/60 hover:border-brand/30 transition-colors group"
            >
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
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
                    className={`text-xs font-bold px-2 py-1 rounded border ${scoreBgColor(contact.warmth_score)}`}
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
      </div>

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
                Paste a CSV or LinkedIn export. WarmPath will match each contact against your team's
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
                  Add to WarmPath
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
