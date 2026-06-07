"use client";

import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, RefreshCw, Shield, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSalesStore } from "@/stores/salesStore";

// ─── Connector catalog ────────────────────────────────────────────────────────

type ConnectorDef = {
  id: string;
  name: string;
  description: string;
  logo: string;
  logoBg: string;
  logoFg: string;
  provider: string;
  beta?: boolean;
  subItems?: string[];
};

const MAIN_CONNECTORS: ConnectorDef[] = [
  {
    id: "google",
    name: "Google",
    description:
      "Import your Gmail contacts, calendar events, and email history to map relationship strength.",
    logo: "G",
    logoBg: "#EA4335",
    logoFg: "#fff",
    provider: "gmail",
    subItems: ["Gmail", "Calendar", "Contacts"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description:
      "Add your LinkedIn connections to unlock intro paths through your professional network.",
    logo: "in",
    logoBg: "#0A66C2",
    logoFg: "#fff",
    provider: "linkedin_sales_nav",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    description: "Surface warm signals from mutual follows and engagement before reaching out.",
    logo: "𝕏",
    logoBg: "#000",
    logoFg: "#fff",
    provider: "twitter",
    beta: true,
  },
  {
    id: "outlook",
    name: "Outlook",
    description:
      "Connect your Microsoft 365 email and calendar to supplement Gmail relationship data.",
    logo: "O",
    logoBg: "#0078D4",
    logoFg: "#fff",
    provider: "outlook",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description:
      "Sync accounts, contacts, and deal stages so warm paths map directly to your CRM pipeline.",
    logo: "HS",
    logoBg: "#FF7A59",
    logoFg: "#fff",
    provider: "hubspot",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description:
      "Push warm intro actions into Salesforce activities and keep pipeline attribution clean.",
    logo: "SF",
    logoBg: "#00A1E0",
    logoFg: "#fff",
    provider: "salesforce",
  },
];

const REQUEST_CONNECTORS: {
  id: string;
  name: string;
  description: string;
  logo: string;
  logoBg: string;
  logoFg: string;
}[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Add your WhatsApp contacts.",
    logo: "W",
    logoBg: "#25D366",
    logoFg: "#fff",
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Add your Facebook Friends.",
    logo: "f",
    logoBg: "#1877F2",
    logoFg: "#fff",
  },
  {
    id: "apple",
    name: "Apple Contacts",
    description: "Add your iOS contacts.",
    logo: "🍎",
    logoBg: "#555",
    logoFg: "#fff",
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Add your Telegram contacts.",
    logo: "Tg",
    logoBg: "#26A5E4",
    logoFg: "#fff",
  },
];

// ─── Connector Row ────────────────────────────────────────────────────────────

function ConnectorRow({
  def,
  isActive,
  isDemo,
  onConnect,
  onManage,
}: {
  def: ConnectorDef;
  isActive: boolean;
  isDemo: boolean;
  onConnect: () => void;
  onManage: () => void;
}) {
  const [expanded, setExpanded] = useState(isActive);

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 border-b last:border-b-0 transition-colors hover:bg-muted/30"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 select-none"
        style={{ backgroundColor: def.logoBg, color: def.logoFg }}
      >
        {def.logo}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
            {def.name}
          </span>
          {isActive && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Active
            </span>
          )}
          {isDemo && !isActive && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
              Demo
            </span>
          )}
          {def.beta && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Beta
            </span>
          )}
        </div>
        <p className="text-[12px] leading-snug" style={{ color: "var(--muted-foreground)" }}>
          {def.description}
        </p>
        {/* Sub-items for Google when active */}
        {isActive && def.subItems && (
          <div className="flex items-center gap-1 mt-1.5">
            {def.subItems.map((s) => (
              <span
                key={s}
                className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="shrink-0">
        {isActive ? (
          <button
            type="button"
            onClick={onManage}
            className="text-[12px] font-semibold px-4 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--foreground)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Manage
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="text-[12px] font-semibold px-4 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#5456d4" }}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Request connector card ───────────────────────────────────────────────────

function RequestCard({ item }: { item: (typeof REQUEST_CONNECTORS)[0] }) {
  const [requested, setRequested] = useState(false);

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl border transition-colors"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
        style={{ backgroundColor: item.logoBg, color: item.logoFg }}
      >
        {item.logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold">{item.name}</p>
        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          {item.description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setRequested(true);
          toast.success(`We'll notify you when ${item.name} launches!`);
        }}
        disabled={requested}
        className="text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        {requested ? "Requested" : "Request"}
      </button>
    </div>
  );
}

// ─── Twenty CRM card ──────────────────────────────────────────────────────────

function TwentyCrmCard() {
  const { accounts, contacts, setAccounts, setContacts } = useSalesStore();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<{ accounts: number; contacts: number } | null>(null);

  useEffect(() => {
    fetch("/api/twenty/status")
      .then((r) => r.json())
      .then((d) => setConfigured(d.configured))
      .catch(() => setConfigured(false));
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const r = await fetch("/api/twenty/sync");
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error ?? "Sync failed");
      // Merge Twenty data into the store (prepend, deduplicate by id)
      const existingAccountIds = new Set(accounts.map((a) => a.id));
      const existingContactIds = new Set(contacts.map((c) => c.id));
      const newAccounts = (d.data?.accounts ?? []).filter(
        (a: { id: string }) => !existingAccountIds.has(a.id),
      );
      const newContacts = (d.data?.contacts ?? []).filter(
        (c: { id: string }) => !existingContactIds.has(c.id),
      );
      if (newAccounts.length > 0) setAccounts([...newAccounts, ...accounts]);
      if (newContacts.length > 0) setContacts([...newContacts, ...contacts]);
      setLastSync({ accounts: d.accounts, contacts: d.contacts });
      toast.success(
        `Synced ${d.accounts} accounts · ${d.contacts} contacts from Twenty CRM`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const isLoading = configured === null;

  return (
    <div
      className="rounded-xl border overflow-hidden mb-8"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
    >
      {/* Section header */}
      <div
        className="px-6 py-3 border-b"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#c7c4d7]">
          CRM Backend
        </p>
      </div>

      <div className="flex items-center gap-4 px-6 py-4">
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 select-none"
          style={{ backgroundColor: "#1d2433", color: "#fff", border: "1.5px solid #374151" }}
        >
          20
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
              Twenty CRM
            </span>
            {!isLoading && configured && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Connected
              </span>
            )}
            {!isLoading && !configured && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Not configured
              </span>
            )}
          </div>
          <p className="text-[12px] leading-snug" style={{ color: "var(--muted-foreground)" }}>
            {configured
              ? "Your self-hosted Twenty CRM is connected. Sync accounts and contacts into WarmPath."
              : "Self-hosted open-source CRM. Deploy Twenty on Azure and set TWENTY_API_URL + TWENTY_API_KEY to connect."}
          </p>
          {lastSync && (
            <p className="text-[11px] mt-1 text-emerald-500">
              Last sync: +{lastSync.accounts} accounts · +{lastSync.contacts} contacts
            </p>
          )}
        </div>

        {/* Action */}
        <div className="shrink-0">
          {configured ? (
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#5456d4" }}
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          ) : (
            <a
              href="https://github.com/twentyhq/twenty"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold px-4 py-1.5 rounded-lg border transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              Deploy guide ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { integrations, toggleIntegrationDemo, logAuditEvent } = useSalesStore();

  function getStatus(provider: string) {
    const match = integrations.find((i) => i.provider === provider);
    if (!match) return { isActive: false, isDemo: false };
    const isActive = match.status === "connected" || match.status === "demo";
    const isDemo = match.status === "demo";
    return { isActive, isDemo, integration: match };
  }

  function handleConnect(def: ConnectorDef) {
    const { integration } = getStatus(def.provider);
    if (integration) {
      toggleIntegrationDemo(integration.id);
      logAuditEvent("integration.connected", {
        entityType: "integration",
        entityId: integration.id,
        entityName: def.name,
      });
      toast.success(`${def.name} connected in demo mode`);
    } else {
      toast.info(`${def.name} requires OAuth setup — coming soon.`);
    }
  }

  function handleManage(def: ConnectorDef) {
    toast.info(`${def.name} settings panel coming soon.`);
  }

  const activeCount = MAIN_CONNECTORS.filter((d) => getStatus(d.provider).isActive).length;

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
          Connectors
        </h1>
        <p className="text-[14px]" style={{ color: "var(--muted-foreground)" }}>
          Make your network searchable by connecting your data sources.
        </p>
      </div>

      {/* Status summary */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 text-[12px]">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-500 font-medium">
            {activeCount} connector{activeCount !== 1 ? "s" : ""} active
          </span>
          <span style={{ color: "var(--muted-foreground)" }}>· your network is being mapped</span>
        </div>
      )}

      {/* Twenty CRM */}
      <TwentyCrmCard />

      {/* Main connectors list */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
      >
        {MAIN_CONNECTORS.map((def) => {
          const { isActive, isDemo } = getStatus(def.provider);
          return (
            <ConnectorRow
              key={def.id}
              def={def}
              isActive={isActive}
              isDemo={isDemo}
              onConnect={() => handleConnect(def)}
              onManage={() => handleManage(def)}
            />
          );
        })}
      </div>

      {/* Request a connector */}
      <div>
        <h2 className="text-[13px] font-semibold mb-3" style={{ color: "var(--foreground)" }}>
          Request a connector
        </h2>
        <p className="text-[12px] mb-4" style={{ color: "var(--muted-foreground)" }}>
          Tell us what you'd like us to build next. We'll reach out when it's ready.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {REQUEST_CONNECTORS.map((item) => (
            <RequestCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Security footer */}
      <div
        className="flex items-start gap-3 pt-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <Shield className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>
            OAuth 2.0 only · no passwords stored
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            All connections use OAuth. We read only what's needed: email headers (not bodies),
            calendar titles, and contact names.
          </p>
        </div>
      </div>
    </div>
  );
}
