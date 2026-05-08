"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Lock,
  RefreshCw,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";

const COMING_SOON_CHANNELS = new Set(["whatsapp", "telegram", "meta_ads"]);

const PROVIDER_ICON: Record<string, { text: string; bg: string; fg: string }> = {
  gmail: { text: "G", bg: "#EA4335", fg: "#fff" },
  outlook: { text: "O", bg: "#0078D4", fg: "#fff" },
  twilio: { text: "T", bg: "#F22F46", fg: "#fff" },
  whatsapp_business: { text: "W", bg: "#25D366", fg: "#fff" },
  telegram_bot: { text: "Tg", bg: "#26A5E4", fg: "#fff" },
  linkedin_sales_nav: { text: "in", bg: "#0A66C2", fg: "#fff" },
  meta_ads: { text: "M", bg: "#1877F2", fg: "#fff" },
  hubspot: { text: "HS", bg: "#FF7A59", fg: "#fff" },
  salesforce: { text: "SF", bg: "#00A1E0", fg: "#fff" },
};

const CHANNEL_GROUP_LABELS: Record<string, string> = {
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn",
  crm: "CRM",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  meta_ads: "Meta Ads",
};

const STATUS_CONFIG = {
  connected: {
    label: "Connected",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle,
  },
  demo: {
    label: "Demo active",
    color: "text-brand bg-brand/10 border-brand/20",
    icon: Zap,
  },
  disconnected: {
    label: "Not connected",
    color: "text-muted-foreground bg-muted border-border",
    icon: AlertCircle,
  },
  error: {
    label: "Error",
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    icon: AlertCircle,
  },
} as const;

// Channels to render first, then coming-soon last
const GROUP_ORDER = ["email", "phone", "linkedin", "crm", "whatsapp", "telegram", "meta_ads"];

export default function IntegrationsPage() {
  const { integrations, toggleIntegrationDemo, logAuditEvent } = useSalesStore();

  const liveCount = integrations.filter(
    (i) =>
      !COMING_SOON_CHANNELS.has(i.channel) && (i.status === "connected" || i.status === "demo"),
  ).length;
  const demoCount = integrations.filter(
    (i) => !COMING_SOON_CHANNELS.has(i.channel) && i.status === "demo",
  ).length;
  const healthInts = integrations.filter(
    (i) => !COMING_SOON_CHANNELS.has(i.channel) && i.health_score !== undefined,
  );
  const avgHealth = healthInts.length
    ? Math.round(healthInts.reduce((s, i) => s + (i.health_score ?? 0), 0) / healthInts.length)
    : 0;

  const groups: Record<string, typeof integrations> = {};
  for (const int of integrations) {
    groups[int.channel] = [...(groups[int.channel] ?? []), int];
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect your GTM stack Gmail, LinkedIn, and your CRM drive 95% of warm-path value.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 animate-fade-up delay-1">
        {[
          { label: "Active channels", value: liveCount, color: "text-emerald-500" },
          { label: "Demo active", value: demoCount, color: "text-brand" },
          { label: "Avg health", value: `${avgHealth}%`, color: "text-foreground" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo mode notice */}
      <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 animate-fade-up delay-1">
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand">Demo Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Channels in demo mode simulate real behavior no actual messages are sent. Real
              connections require OAuth or API key setup.
            </p>
          </div>
        </div>
      </div>

      {/* Integration groups */}
      <div className="space-y-8">
        {GROUP_ORDER.map((groupKey) => {
          const groupIntegrations = groups[groupKey];
          if (!groupIntegrations || groupIntegrations.length === 0) return null;
          const isComingSoon = COMING_SOON_CHANNELS.has(groupKey);

          return (
            <div key={groupKey} className="animate-fade-up delay-2">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-semibold text-sm">
                  {CHANNEL_GROUP_LABELS[groupKey] ?? groupKey}
                </h2>
                {isComingSoon && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20"
                  >
                    <Lock className="w-2.5 h-2.5 mr-1" />
                    Coming soon
                  </Badge>
                )}
                <div className="flex-1 h-px bg-border/60" />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupIntegrations.map((integration) => {
                  const iconCfg = PROVIDER_ICON[integration.provider] ?? {
                    text: integration.provider[0].toUpperCase(),
                    bg: integration.icon_color ?? "#64748b",
                    fg: "#fff",
                  };

                  if (isComingSoon) {
                    return (
                      <Card key={integration.id} className="border-border/40 opacity-60">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm grayscale"
                              style={{ backgroundColor: iconCfg.bg, color: iconCfg.fg }}
                            >
                              {iconCfg.text}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{integration.display_name}</p>
                              <Badge
                                variant="outline"
                                className="text-[10px] mt-0.5 text-muted-foreground"
                              >
                                <Lock className="w-2.5 h-2.5 mr-0.5" />
                                Coming soon
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                            {integration.description}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-8 text-xs"
                            onClick={() =>
                              toast.info("We'll notify you when this channel launches.")
                            }
                          >
                            Notify me when available
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }

                  const statusCfg = STATUS_CONFIG[integration.status] ?? STATUS_CONFIG.disconnected;
                  const StatusIcon = statusCfg.icon;
                  const isActive =
                    integration.status === "connected" || integration.status === "demo";

                  return (
                    <Card
                      key={integration.id}
                      className={`border-border/60 transition-all ${isActive ? "" : "opacity-70"}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                              style={{ backgroundColor: iconCfg.bg, color: iconCfg.fg }}
                            >
                              {iconCfg.text}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{integration.display_name}</p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] mt-0.5 ${statusCfg.color}`}
                              >
                                <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                                {statusCfg.label}
                              </Badge>
                            </div>
                          </div>
                          {integration.health_score !== undefined && isActive && (
                            <div className="text-right">
                              <div
                                className={`text-sm font-bold ${
                                  integration.health_score >= 90
                                    ? "text-emerald-500"
                                    : integration.health_score >= 70
                                      ? "text-brand"
                                      : "text-red-500"
                                }`}
                              >
                                {integration.health_score}%
                              </div>
                              <div className="text-[9px] text-muted-foreground">health</div>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {integration.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {integration.capabilities.slice(0, 3).map((cap) => (
                            <span
                              key={cap}
                              className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground"
                            >
                              {cap.replace(/_/g, " ")}
                            </span>
                          ))}
                          {integration.capabilities.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground">
                              +{integration.capabilities.length - 3} more
                            </span>
                          )}
                        </div>

                        {integration.last_sync_at && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
                            <Clock className="w-3 h-3" />
                            Synced {formatRelativeTime(integration.last_sync_at)}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {integration.status === "disconnected" ? (
                            <Button
                              size="sm"
                              className="flex-1 h-8 text-xs"
                              onClick={() =>
                                toast.info(
                                  `Connect ${integration.display_name} OAuth setup required`,
                                )
                              }
                            >
                              Connect
                            </Button>
                          ) : (
                            <>
                              {integration.status === "demo" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs"
                                  onClick={() => {
                                    toggleIntegrationDemo(integration.id);
                                    logAuditEvent("integration.connected", {
                                      entityType: "integration",
                                      entityId: integration.id,
                                      entityName: integration.display_name,
                                    });
                                    toast.info(`${integration.display_name} demo toggled`);
                                  }}
                                >
                                  <Zap className="w-3 h-3 mr-1" />
                                  Demo on
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => toast.success(`${integration.display_name} synced`)}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => toast.info("Settings coming soon")}
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <Card className="border-border/60 animate-fade-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Security & compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: Shield,
                title: "OAuth 2.0",
                desc: "Real connections use OAuth we never store passwords",
              },
              {
                icon: Activity,
                title: "Full audit trail",
                desc: "Every action is logged and timestamped",
              },
              {
                icon: CheckCircle,
                title: "Human-in-the-loop",
                desc: "No message sends without explicit human approval",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
