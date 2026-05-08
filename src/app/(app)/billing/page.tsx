"use client";

import { Check, CreditCard, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Get started with relationship-driven outreach",
    features: [
      "5 target accounts",
      "25 AI messages / month",
      "Basic signal detection (2 types)",
      "Relationship graph (up to 50 nodes)",
      "Email support",
    ],
    limits: ["No campaign automation", "No CRM sync", "No LinkedIn integration"],
    cta: "Current plan",
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 149,
    description: "Full warm outbound automation for growing teams",
    features: [
      "50 target accounts",
      "Unlimited AI messages",
      "All 13 signal types",
      "Relationship graph (unlimited)",
      "Campaign automation",
      "Gmail + LinkedIn integration",
      "HubSpot / Salesforce sync",
      "HITL approval queue",
      "Priority support",
    ],
    limits: [],
    cta: "Upgrade to Growth",
    highlight: true,
    badge: "Most popular",
  },
  {
    id: "scale",
    name: "Scale",
    price: 399,
    description: "Multi-rep orchestration with full team graph",
    features: [
      "Unlimited accounts",
      "Multi-rep persona engine",
      "Full team relationship graph",
      "Custom signal sources (webhooks)",
      "Advanced analytics & reporting",
      "Slack integration",
      "Custom AI persona training",
      "API access",
      "Dedicated CSM",
    ],
    limits: [],
    cta: "Upgrade to Scale",
    highlight: false,
  },
];

export default function BillingPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const currentPlan = user?.plan ?? "free";

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    setLoading(planId);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(null);
    toast.success(`Demo mode: Stripe checkout would open here for the ${planId} plan`, {
      duration: 4000,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1100px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand" />
          Billing & Plans
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upgrade to unlock more accounts, signals, and automation.
        </p>
      </div>

      {/* Current plan banner */}
      <Card className="border-brand/30 bg-brand/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-brand" />
            <div>
              <p className="text-sm font-semibold">
                You're on the <span className="capitalize">{currentPlan}</span> plan
              </p>
              <p className="text-xs text-muted-foreground">
                {currentPlan === "free"
                  ? "5 accounts · 25 messages/mo · limited signals"
                  : currentPlan === "growth"
                    ? "50 accounts · unlimited messages · all 13 signal types"
                    : "Unlimited everything"}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="capitalize text-xs bg-brand/10 text-brand border-brand/20"
          >
            {currentPlan}
          </Badge>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <Card
              key={plan.id}
              className={`border-border/60 relative ${plan.highlight ? "border-brand/40 shadow-md shadow-primary/10" : ""}`}
            >
              {plan.badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="text-[10px] bg-brand text-brand-foreground px-2 py-0.5">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3 pt-5">
                <div className="flex items-baseline justify-between">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="text-right">
                    <span className="text-2xl font-bold">${plan.price}</span>
                    {plan.price > 0 && <span className="text-xs text-muted-foreground">/mo</span>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.limits.map((l) => (
                    <li
                      key={l}
                      className="flex items-center gap-2 text-xs text-muted-foreground line-through"
                    >
                      <span className="w-3.5 h-3.5 flex-shrink-0 text-center leading-none">×</span>
                      {l}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full h-8 text-xs"
                  variant={isCurrent ? "outline" : plan.highlight ? "default" : "outline"}
                  disabled={isCurrent || loading !== null}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 animate-pulse" />
                      Redirecting...
                    </span>
                  ) : isCurrent ? (
                    "Current plan"
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current usage</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          {[
            {
              label: "Accounts tracked",
              used: 10,
              limit: currentPlan === "free" ? 5 : currentPlan === "growth" ? 50 : 999,
            },
            { label: "AI messages this month", used: 5, limit: currentPlan === "free" ? 25 : 9999 },
            { label: "Active campaigns", used: 2, limit: currentPlan === "free" ? 0 : 10 },
          ].map((usage) => {
            const pct = usage.limit > 0 ? Math.min((usage.used / usage.limit) * 100, 100) : 0;
            const isOver = usage.used > usage.limit && usage.limit > 0;
            return (
              <div key={usage.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium">{usage.label}</span>
                  <span className={`text-muted-foreground ${isOver ? "text-red-500" : ""}`}>
                    {usage.used} / {usage.limit === 9999 ? "∞" : usage.limit}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : pct > 80 ? "bg-brand" : "bg-primary"}`}
                    style={{ width: `${usage.limit === 9999 ? 10 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Billing FAQ
          </p>
          {[
            {
              q: "Is there a free trial?",
              a: "Yes the Growth plan has a 14-day free trial, no credit card required.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from this page and your plan downgrades at the end of the billing cycle.",
            },
            {
              q: "What payment methods are accepted?",
              a: "All major credit cards via Stripe. Annual plans get 2 months free.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-t border-border/50 pt-3 first:border-0 first:pt-0">
              <p className="text-xs font-medium mb-0.5">{q}</p>
              <p className="text-xs text-muted-foreground">{a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
