"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  LayoutDashboard,
  Link2,
  ListChecks,
  Megaphone,
  Network,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const STEPS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "#cc785c",
    title: "Dashboard",
    tagline: "Your daily command center",
    description:
      "Every morning, start here. You'll see your warmest leads, messages waiting for approval, and any urgent signals — all prioritised so you know exactly what to do first.",
  },
  {
    href: "/warm-leads",
    icon: Zap,
    color: "#cc785c",
    title: "Warm Leads",
    tagline: "Know exactly who to call today",
    description:
      "Instead of guessing, WarmPath ranks every prospect by how warm your team's connection is. Each lead shows you the exact path — who to ask for the intro and what to say.",
  },
  {
    href: "/approval-queue",
    icon: Bell,
    color: "#5db872",
    title: "Approval Queue",
    tagline: "AI drafts — you approve before it sends",
    description:
      "WarmPath writes personalised messages for each prospect. They land here first. Review, tweak if needed, then approve with one click. Nothing goes out without your sign-off.",
  },
  {
    href: "/tasks",
    icon: ListChecks,
    color: "#e8a55a",
    title: "Tasks",
    tagline: "Your follow-up checklist",
    description:
      "Overdue follow-ups, intro requests waiting on teammates, meetings to confirm — all your pending actions in one list so nothing slips through.",
  },
  {
    href: "/campaigns",
    icon: Megaphone,
    color: "#5db8a6",
    title: "Campaigns",
    tagline: "Multi-step outreach sequences",
    description:
      "Build sequences that route step 1 through the warmest intro path automatically. If no warm path exists, it falls back to high-quality cold outreach — clearly labelled.",
  },
  {
    href: "/signals",
    icon: BarChart3,
    color: "#cc785c",
    title: "Signals",
    tagline: "Know the perfect moment to reach out",
    description:
      "WarmPath monitors 13 buying signals 24/7 — funding rounds, leadership changes, job postings, and more. Each signal is scored so you act when it matters most.",
  },
  {
    href: "/relationship-graph",
    icon: Network,
    color: "#5db8a6",
    title: "Relationship Graph",
    tagline: "Your team's entire network, visualised",
    description:
      "See every connection your team has and the shortest warm path to any prospect. Click any company to find who on your team knows someone there.",
  },
  {
    href: "/accounts",
    icon: Building2,
    color: "#e8a55a",
    title: "Accounts",
    tagline: "Your target companies",
    description:
      "Every company you're pursuing with their warmth score, active buying signals, and relationship strength at a glance.",
  },
  {
    href: "/knowledge-base",
    icon: BookOpen,
    color: "#cc785c",
    title: "Knowledge Base",
    tagline: "Your company's brain for the AI",
    description:
      "Add your messaging frameworks, case studies, pricing, and personas here. The AI uses these to write messages that sound exactly like your company — not like a generic template.",
  },
  {
    href: "/integrations",
    icon: Link2,
    color: "#5db8a6",
    title: "Integrations",
    tagline: "Connect your existing tools",
    description:
      "Link LinkedIn, Gmail, Salesforce, and more. WarmPath pulls relationship data from the tools your team already uses to keep the graph accurate.",
  },
];

interface ProductTourProps {
  open: boolean;
  onClose: () => void;
}

export function ProductTour({ open, onClose }: ProductTourProps) {
  const [step, setStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const current = STEPS[step];

  // Find and track the sidebar nav item for the current step
  useEffect(() => {
    if (!open || !mounted) return;

    const measure = () => {
      const el = document.querySelector(`a[href="${current.href}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        setHighlightRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setHighlightRect(null);
      }
    };

    measure();
    const timer = setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [open, mounted, step, current.href]);

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

  if (!mounted) return null;
  if (!open) return null;

  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const PAD = 6;

  // Card position: just to the right of the sidebar (~256px), vertically near the highlighted item
  const sidebarRight = highlightRect ? highlightRect.left + highlightRect.width + PAD + 16 : 272;
  const cardY = highlightRect
    ? Math.max(16, Math.min(highlightRect.top + highlightRect.height / 2 - 150, window.innerHeight - 360))
    : Math.floor(window.innerHeight / 2) - 150;

  return createPortal(
    <>
      {/* Dark backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
        }}
        onClick={onClose}
      />

      {/* Spotlight ring around sidebar item */}
      {highlightRect && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            top: highlightRect.top - PAD,
            left: highlightRect.left - PAD,
            width: highlightRect.width + PAD * 2,
            height: highlightRect.height + PAD * 2,
            borderRadius: 8,
            border: `2px solid ${current.color}`,
            boxShadow: `0 0 0 4000px rgba(0,0,0,0.55), 0 0 20px ${current.color}88`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tour card */}
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          zIndex: 10000,
          top: cardY,
          left: sidebarRight,
          width: 340,
          pointerEvents: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            background: "#faf9f5",
            border: "1px solid #e6dfd8",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid #e6dfd8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${current.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon style={{ width: 14, height: 14, color: current.color }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#141413" }}>
                WarmPath Tour
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6c6a64",
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "#e6dfd8" }}>
            <div
              style={{
                height: "100%",
                width: `${((step + 1) / STEPS.length) * 100}%`,
                background: current.color,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: "20px 20px 16px" }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: current.color,
                marginBottom: 4,
              }}
            >
              {step + 1} of {STEPS.length}
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#141413", marginBottom: 2, lineHeight: 1.2 }}>
              {current.title}
            </h2>
            <p style={{ fontSize: 13, fontWeight: 600, color: current.color, marginBottom: 12 }}>
              {current.tagline}
            </p>
            <p style={{ fontSize: 13, color: "#6c6a64", lineHeight: 1.65, marginBottom: 0 }}>
              {current.description}
            </p>
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 12 }}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: "none",
                  cursor: "pointer",
                  background: i === step ? current.color : i < step ? `${current.color}55` : "#e6dfd8",
                  transition: "width 0.2s, background 0.2s",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderTop: "1px solid #e6dfd8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#6c6a64",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Skip tour
              </button>
              {step > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#6c6a64",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <ArrowLeft style={{ width: 12, height: 12 }} />
                  Back
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={next}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: current.color,
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              {isLast ? "Done" : "Next"}
              {!isLast && <ArrowRight style={{ width: 13, height: 13 }} />}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
