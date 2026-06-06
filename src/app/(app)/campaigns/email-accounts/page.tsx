"use client";

import {
  AlertTriangle,
  CheckCircle,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type EmailAccount = {
  id: string;
  name: string;
  email: string;
  vendor: "Smartlead" | "Google" | "Microsoft" | "Custom";
  dailyLimit: number;
  sent: number;
  warmupEnabled: boolean;
  warmupReputation: "Good" | "OK" | "Poor";
  reputationScore: number;
  mailboxIssue: boolean;
  issueType: string | null;
  expiryDate: string | null;
};

const DEMO_ACCOUNTS: EmailAccount[] = [
  {
    id: "ea-1",
    name: "Raman Vijay",
    email: "raman@seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: true,
    warmupReputation: "Good",
    reputationScore: 96,
    mailboxIssue: false,
    issueType: null,
    expiryDate: null,
  },
  {
    id: "ea-2",
    name: "Raman Vijay",
    email: "raman.v@outreach.seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: false,
    warmupReputation: "OK",
    reputationScore: 72,
    mailboxIssue: true,
    issueType: "Low reputation",
    expiryDate: null,
  },
  {
    id: "ea-3",
    name: "Lokesh Kumar",
    email: "lokesh@seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: true,
    warmupReputation: "Good",
    reputationScore: 91,
    mailboxIssue: false,
    issueType: null,
    expiryDate: null,
  },
  {
    id: "ea-4",
    name: "Geeta Bansal",
    email: "geeta@seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: true,
    warmupReputation: "Good",
    reputationScore: 88,
    mailboxIssue: false,
    issueType: null,
    expiryDate: "2026-12-31",
  },
  {
    id: "ea-5",
    name: "Lokesh Kumar",
    email: "lokesh.kumar@growth.seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: true,
    warmupReputation: "OK",
    reputationScore: 77,
    mailboxIssue: true,
    issueType: "Auth failure",
    expiryDate: null,
  },
  {
    id: "ea-6",
    name: "Geeta Bansal",
    email: "geeta.bansal@seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: true,
    warmupReputation: "Good",
    reputationScore: 93,
    mailboxIssue: false,
    issueType: null,
    expiryDate: null,
  },
  {
    id: "ea-7",
    name: "Mohit Kumar",
    email: "mohit@seedlinglabs.com",
    vendor: "Google",
    dailyLimit: 50,
    sent: 20,
    warmupEnabled: true,
    warmupReputation: "Good",
    reputationScore: 95,
    mailboxIssue: false,
    issueType: null,
    expiryDate: null,
  },
  {
    id: "ea-8",
    name: "Jatin Tigheria",
    email: "jatin@seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 35,
    sent: 10,
    warmupEnabled: false,
    warmupReputation: "Poor",
    reputationScore: 48,
    mailboxIssue: true,
    issueType: "Blacklisted IP",
    expiryDate: null,
  },
  {
    id: "ea-9",
    name: "Raman Vijay",
    email: "raman.vijay@enterprise.seedlinglabs.com",
    vendor: "Microsoft",
    dailyLimit: 45,
    sent: 15,
    warmupEnabled: true,
    warmupReputation: "Good",
    reputationScore: 90,
    mailboxIssue: false,
    issueType: null,
    expiryDate: null,
  },
  {
    id: "ea-10",
    name: "Mohit Kumar",
    email: "mohit.kumar@campaigns.seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: true,
    warmupReputation: "OK",
    reputationScore: 81,
    mailboxIssue: false,
    issueType: null,
    expiryDate: null,
  },
  {
    id: "ea-11",
    name: "Geeta Bansal",
    email: "geeta.b@reach.seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: true,
    warmupReputation: "Good",
    reputationScore: 94,
    mailboxIssue: false,
    issueType: null,
    expiryDate: "2026-09-15",
  },
  {
    id: "ea-12",
    name: "Lokesh Kumar",
    email: "lokesh@outbound.seedlinglabs.com",
    vendor: "Smartlead",
    dailyLimit: 40,
    sent: 15,
    warmupEnabled: false,
    warmupReputation: "Poor",
    reputationScore: 41,
    mailboxIssue: true,
    issueType: "DMARC failure",
    expiryDate: null,
  },
  {
    id: "ea-13",
    name: "Dhruval Gandhe",
    email: "dhruval@seedlinglabs.com",
    vendor: "Google",
    dailyLimit: 50,
    sent: 22,
    warmupEnabled: true,
    warmupReputation: "Good",
    reputationScore: 97,
    mailboxIssue: false,
    issueType: null,
    expiryDate: null,
  },
];

type TabKey = "accounts" | "domains" | "objects";

const REPUTATION_COLORS = {
  Good: "text-emerald-600 bg-emerald-500/10",
  OK: "text-amber-600 bg-amber-500/10",
  Poor: "text-red-500 bg-red-500/10",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

export default function EmailAccountsPage() {
  const [tab, setTab] = useState<TabKey>("accounts");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const issueCount = DEMO_ACCOUNTS.filter((a) => a.mailboxIssue).length;

  const filtered = DEMO_ACCOUNTS.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map((a) => a.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 px-5 pt-4 pb-0 shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold tracking-tight">Email Accounts</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Manage sending mailboxes, warmup, and deliverability.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts…"
                className="h-8 w-48 pl-8 pr-3 rounded-md border border-border/60 bg-background text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
            <button
              type="button"
              className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            <button
              type="button"
              className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace
            </button>
            <Button size="sm" className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Mailbox issue banner */}
        {issueCount > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-2.5 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[12px] font-semibold text-amber-600">
              Mailbox Issues Found — {issueCount} account{issueCount !== 1 ? "s" : ""} need
              attention
            </p>
            <button
              type="button"
              className="ml-auto text-[11px] font-semibold text-amber-600 border border-amber-500/30 rounded-md px-2.5 py-1 hover:bg-amber-500/10 transition-colors"
            >
              Fix Now
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-0 -mx-5 px-5">
          {(
            [
              { key: "accounts", label: `Email Accounts (${DEMO_ACCOUNTS.length})` },
              { key: "domains", label: "Domains" },
              { key: "objects", label: "SmartSenders Objects" },
            ] as { key: TabKey; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3.5 py-2.5 text-[12px] font-medium border-b-2 transition-colors -mb-px ${
                tab === key
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {tab === "accounts" && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 sticky top-0 z-10">
                <th className="w-8 pl-4 pr-2 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-border/60 accent-brand"
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">
                  Email Address
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">
                  Vendor
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground whitespace-nowrap">
                  Daily Limit
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground whitespace-nowrap">
                  Warmup Enabled
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground whitespace-nowrap">
                  Warmup Reputation
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground whitespace-nowrap">
                  Mailbox Issue
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground whitespace-nowrap">
                  Expiry Date
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc) => (
                <tr
                  key={acc.id}
                  className={`border-b border-border/40 hover:bg-muted/20 transition-colors group ${
                    selected.has(acc.id) ? "bg-brand/5" : ""
                  }`}
                >
                  <td className="pl-4 pr-2 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(acc.id)}
                      onChange={() => toggleOne(acc.id)}
                      className="w-3.5 h-3.5 rounded border-border/60 accent-brand"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                        {acc.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span className="font-medium whitespace-nowrap">{acc.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{acc.email}</td>
                  <td className="px-3 py-3">
                    <span className="text-muted-foreground">{acc.vendor}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-[11px] font-medium">
                      {acc.sent}/{acc.dailyLimit}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {acc.warmupEnabled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle className="w-3 h-3" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <XCircle className="w-3 h-3" />
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${REPUTATION_COLORS[acc.warmupReputation]}`}
                    >
                      {acc.reputationScore}% · {acc.warmupReputation}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {acc.mailboxIssue ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          Issue
                        </span>
                        {acc.issueType && (
                          <span className="text-[9px] text-muted-foreground">{acc.issueType}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">
                    {acc.expiryDate ? fmtDate(acc.expiryDate) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Domains tab placeholder */}
      {tab === "domains" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
          <p className="text-[13px] font-semibold">Domains</p>
          <p className="text-[12px]">Manage sending domains and DKIM/DMARC records.</p>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled>
            Coming soon
          </Button>
        </div>
      )}

      {/* Objects tab placeholder */}
      {tab === "objects" && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
          <p className="text-[13px] font-semibold">SmartSenders Objects</p>
          <p className="text-[12px]">Configure sender pools and rotation logic.</p>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled>
            Coming soon
          </Button>
        </div>
      )}
    </div>
  );
}
