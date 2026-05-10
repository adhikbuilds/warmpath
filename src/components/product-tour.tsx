"use client";

import { X, ArrowRight, ArrowLeft, Zap, Bell, ListChecks, Megaphone, BarChart3, Network, Building2, BookOpen, Link2, LayoutDashboard } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState, useCallback } from "react";

const STEPS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "#cc785c",
    title: "Dashboard",
    tagline: "Your daily command center",
    description: "Every morning, start here. You'll see your warmest leads, messages waiting for approval, and any urgent signals — all prioritised for you.",
  },
  {
    href: "/warm-leads",
    icon: Zap,
    color: "#cc785c",
    title: "Warm Leads",
    tagline: "Know exactly who to call today",
    description: "Instead of guessing, WarmPath ranks every prospect by how warm your team's connection is. Each lead shows you the exact path — who to ask for the intro, and what to say.",
  },
  {
    href: "/approval-queue",
    icon: Bell,
    color: "#5db872",
    title: "Approval Queue",
    tagline: "AI drafts — you approve before it sends",
    description: "WarmPath writes personalised messages for each prospect. They land here first. You review, tweak if needed, then approve with one click. Nothing goes out without your sign-off.",
  },
  {
    href: "/tasks",
    icon: ListChecks,
    color: "#e8a55a",
    title: "Tasks",
    tagline: "Your follow-up checklist",
    description: "Overdue follow-ups, intro requests waiting on teammates, meetings to confirm — all your pending actions in one list so nothing slips.",
  },
  {
    href: "/campaigns",
    icon: Megaphone,
    color: "#5db8a6",
    title: "Campaigns",
    tagline: "Multi-step outreach sequences",
    description: "Build sequences that automatically route step 1 through the warmest intro path. If no warm path exists, it falls back to high-quality cold outreach — clearly labelled.",
  },
  {
    href: "/signals",
    icon: BarChart3,
    color: "#cc785c",
    title: "Signals",
    tagline: "Know the perfect moment to reach out",
    description: "WarmPath monitors 13 buying signals 24/7 — funding rounds, leadership changes, job postings, and more. Each signal is scored so you act when it matters most.",
  },
  {
    href: "/relationship-graph",
    icon: Network,
    color: "#5db8a6",
    title: "Relationship Graph",
    tagline: "Your team's entire network, visualised",
    description: "See every connection your team has and the shortest warm path to any prospect. Click any company to find who on your team knows someone there.",
  },
  {
    href: "/accounts",
    icon: Building2,
    color: "#e8a55a",
    title: "Accounts",
    tagline: "Your target companies",
    description: "Every company you're pursuing, with their warmth score, active buying signals, and relationship strength shown at a glance.",
  },
  {
    href: "/knowledge-base",
    icon: BookOpen,
    color: "#cc785c",
    title: "Knowledge Base",
    tagline: "Your company's brain for the AI",
    description: "Add your messaging frameworks, case studies, pricing, and personas here. The AI uses these to write messages that sound exactly like your company — not like a template.",
  },
  {
    href: "/integrations",
    icon: Link2,
    color: "#5db8a6",
    title: "Integrations",
    tagline: "Connect your existing tools",
    description: "Link LinkedIn, Gmail, Salesforce, and more. WarmPath pulls relationship data from the tools your team already uses to keep the graph accurate.",
  },
];

interface ProductTourProps {
  open: boolean;
  onClose: () => void;
}

export function ProductTour({ open, onClose }: ProductTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (open) setStep(0); }, [open]);

  const current = STEPS[step];

  // Find the sidebar nav element for the current step and track its position
  useEffect(() => {
    if (!open || !mounted) return;

    const update = () => {
      // Next.js Link renders <a> tags with the href
      const el = document.querySelector(`a[href="${current.href}"]`) as HTMLElement | null;
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    };

    update();
    // Small delay for layout to settle
    const t = setTimeout(update, 50);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
    };
  }, [open, mounted, current.href, step]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else onClose();
  }, [step, onClose]);

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, next, prev]);

  if (!open || !mounted) return null;

  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  // Card positioning: right of sidebar, vertically centred on the highlighted element
  const SIDEBAR_W = rect ? Math.max(rect.right + 20, 276) : 276;
  const cardTop = rect
    ? Math.max(24, Math.min(rect.top + rect.height / 2 - 140, (typeof window !== "undefined" ? window.innerHeight : 800) - 320))
    : 120;

  // Spotlight rect with padding
  const pad = 5;
  const sr = rect
    ? { x: rect.x - pad, y: rect.y - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 }
    : null;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {/* SVG overlay with spotlight cutout */}
      {sr && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={sr.x} y={sr.y} width={sr.w} height={sr.h} rx="7" fill="black" />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.62)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      )}

      {/* Click backdrop to close */}
      <div className="absolute inset-0" style={{ zIndex: 1 }} onClick={onClose} />

      {/* Spotlight glow ring around highlighted element */}
      {sr && (
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 2,
            top: sr.y,
            left: sr.x,
            width: sr.w,
            height: sr.h,
            borderRadius: 7,
            border: `2px solid ${current.color}`,
            boxShadow: `0 0 0 3px ${current.color}22, 0 0 24px ${current.color}55`,
          }}
        />
      )}

      {/* Connecting line from spotlight to card */}
      {sr && (
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 2,
            top: sr.y + sr.h / 2 - 1,
            left: sr.x + sr.w,
            width: Math.max(8, SIDEBAR_W - sr.x - sr.w - 4),
            height: 2,
            background: `linear-gradient(to right, ${current.color}88, ${current.color}22)`,
          }}
        />
      )}

      {/* Tour card */}
      <div
        className="absolute pointer-events-auto"
        style={{
          zIndex: 3,
          top: cardTop,
          left: SIDEBAR_W,
          width: 340,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--card, #efe9de)",
            border: "1px solid var(--border, #e6dfd8)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border, #e6dfd8)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${current.color}18` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: current.color }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--foreground, #141413)" }}>
                WarmPath Tour
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:opacity-70"
              style={{ color: "var(--muted-foreground, #6c6a64)" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 w-full" style={{ backgroundColor: "var(--border, #e6dfd8)" }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((step + 1) / STEPS.length) * 100}%`,
                backgroundColor: current.color,
              }}
            />
          </div>

          {/* Content */}
          <div className="p-5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: current.color }}>
              {step + 1} of {STEPS.length}
            </p>
            <h2 className="mb-0.5 text-xl font-bold" style={{ color: "var(--foreground, #141413)" }}>
              {current.title}
            </h2>
            <p className="mb-3 text-sm font-medium" style={{ color: current.color }}>
              {current.tagline}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground, #6c6a64)" }}>
              {current.description}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  backgroundColor: i === step ? current.color : i < step ? `${current.color}50` : "var(--border, #e6dfd8)",
                }}
              />
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderTop: "1px solid var(--border, #e6dfd8)" }}
          >
            {/* Skip / Back */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--muted-foreground, #6c6a64)" }}
              >
                Skip tour
              </button>
              {step > 0 && (
                <>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <button
                    type="button"
                    onClick={prev}
                    className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ color: "var(--muted-foreground, #6c6a64)" }}
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                </>
              )}
            </div>

            {/* Next / Done */}
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: current.color }}
            >
              {isLast ? "Done" : "Next"}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
