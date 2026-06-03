"use client";

import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Shield, Zap } from "lucide-react";
import { useState } from "react";
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
