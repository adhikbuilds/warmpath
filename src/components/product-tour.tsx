"use client";

import {
  BarChart3,
  Bell,
  CheckCircle,
  GitFork,
  Megaphone,
  Network,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Zap,
    color: "text-brand bg-brand/10 border-brand/20",
    title: "Warm Leads",
    subtitle: "Know exactly who to call today",
    description:
      "Every morning, WarmPath ranks your best opportunities by a composite score: signal urgency × account fit × warmth of your intro path. You start each day knowing exactly who to contact and how.",
    cta: "See warm leads",
    href: "/warm-leads",
    stat: "avg 8× higher reply rate",
  },
  {
    icon: Network,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    title: "Relationship Graph",
    subtitle: "Your team's hidden network, visualized",
    description:
      "WarmPath maps every relationship your team has past emails, LinkedIn connections, calendar meetings. A BFS pathfinding engine finds the shortest, warmest route to any prospect.",
    cta: "Explore the graph",
    href: "/relationship-graph",
    stat: "84 connections mapped per rep",
  },
  {
    icon: GitFork,
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    title: "Warm Intro Workflow",
    subtitle: "Track every intro from request to meeting",
    description:
      "The Warm Leads pipeline tracks every intro: Draft → Intro Requested → Accepted → Message Sent → Meeting Booked. Overdue intros surface automatically so nothing slips.",
    cta: "View pipeline",
    href: "/warm-leads?view=pipeline",
    stat: "5–10× faster deal velocity",
  },
  {
    icon: Bell,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    title: "Approval Queue",
    subtitle: "AI drafts. You approve. It sends.",
    description:
      "Every AI-generated message lands in the approval queue with a quality score, research hooks, and risk flags. You review in 10 seconds, approve, and the message goes out in your voice.",
    cta: "Open approval queue",
    href: "/approval-queue",
    stat: "zero hallucinations guarantee",
  },
  {
    icon: BarChart3,
    color: "text-brand bg-brand/10 border-brand/20",
    title: "Signal Feed",
    subtitle: "13 buying signals, monitored 24/7",
    description:
      "Funding rounds, leadership changes, job postings, website visits, G2 reviews WarmPath surfaces the moment to strike for every target account. Signals are ranked by 'act now' composite score.",
    cta: "View signals",
    href: "/signals",
    stat: "50+ data sources",
  },
  {
    icon: Megaphone,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    title: "Campaign Sequences",
    subtitle: "Warmth-first, multi-channel sequences",
    description:
      "Build sequences that automatically route step 1 through the warmest intro path. For accounts with no warm path, fall back to high-quality cold outreach clearly labeled. Every step drafted by AI in your voice.",
    cta: "Build a campaign",
    href: "/campaigns/new",
    stat: "6-channel omnichannel",
  },
];

interface ProductTourProps {
  open: boolean;
  onClose: () => void;
}

export function ProductTour({ open, onClose }: ProductTourProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setStep((s) => Math.max(s - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            <span className="text-sm font-semibold">WarmPath in 60 seconds</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step counter */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-2 mb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`h-1 rounded-full flex-1 transition-all ${
                  i === step ? "bg-brand" : i < step ? "bg-brand/30" : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${current.color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-lg font-bold mb-0.5">{current.title}</h2>
              <p className="text-sm text-brand font-medium mb-3">{current.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
            </div>
          </div>

          {/* Stat pill */}
          <div className="mb-5">
            <span className="text-[11px] font-semibold text-brand bg-brand/8 border border-brand/15 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" />
              {current.stat}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="text-muted-foreground"
          >
            ← Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild onClick={onClose}>
              <Link href={current.href}>{current.cta} →</Link>
            </Button>
            {isLast ? (
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
