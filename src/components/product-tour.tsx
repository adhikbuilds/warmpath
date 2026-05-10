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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const STEPS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "#cc785c",
    title: "Dashboard",
    tagline: "Your daily command center",
    description: "Start every morning here. Your warmest leads, messages waiting for approval, and urgent signals — all prioritised so you know exactly what to do first.",
    bullets: [
      "Today's top warm plays ranked by urgency",
      "Approval queue count — review before anything leaves",
      "Follow-up tasks due today, nothing slips",
    ],
  },
  {
    href: "/warm-leads",
    icon: Zap,
    color: "#cc785c",
    title: "Warm Leads",
    tagline: "Know exactly who to call today",
    description: "WarmPath ranks every prospect by how warm your team's connection is and shows the exact intro path to take.",
    bullets: [
      "Pipeline board — drag leads across stages",
      "Each card shows who on your team knows them",
      "Generate outreach with one click",
    ],
  },
  {
    href: "/approval-queue",
    icon: Bell,
    color: "#5db872",
    title: "Approval Queue",
    tagline: "AI drafts — you approve before it sends",
    description: "WarmPath writes personalised messages for each prospect. They land here first. Review, tweak, then approve — nothing goes out without your sign-off.",
    bullets: [
      "See buying signals and warm path for each draft",
      "Edit the message inline before approving",
      "Bulk approve or reject with one click",
    ],
  },
  {
    href: "/tasks",
    icon: ListChecks,
    color: "#e8a55a",
    title: "Tasks",
    tagline: "Your follow-up checklist",
    description: "Overdue follow-ups, intro requests waiting on teammates, meetings to confirm — all pending actions in one list.",
    bullets: [
      "Intro requests — ask teammates for warm intros",
      "Follow-ups — no prospect falls through the cracks",
      "Meeting prep — briefings before discovery calls",
    ],
  },
  {
    href: "/campaigns",
    icon: Megaphone,
    color: "#5db8a6",
    title: "Campaigns",
    tagline: "Multi-step outreach sequences",
    description: "Build sequences that route step 1 through the warmest intro path automatically. Falls back to cold outreach if no warm path exists.",
    bullets: [
      "AI wizard creates a full campaign from your goal",
      "Each step adapts: warm intro → email → LinkedIn",
      "Track replies and meetings per campaign",
    ],
  },
  {
    href: "/signals",
    icon: BarChart3,
    color: "#cc785c",
    title: "Signals",
    tagline: "Know the perfect moment to reach out",
    description: "WarmPath monitors 13 buying signals 24/7 — funding rounds, leadership changes, job postings, and more.",
    bullets: [
      "Act-Now score tells you which signals matter most",
      "Click any signal to reveal the warm intro path",
      "Generate outreach directly from the signal card",
    ],
  },
  {
    href: "/relationship-graph",
    icon: Network,
    color: "#5db8a6",
    title: "Relationship Graph",
    tagline: "Your team's entire network, visualised",
    description: "See every connection your team has and the shortest warm path to any prospect. Click any company to see who knows someone there.",
    bullets: [
      "Force-directed graph of all relationships",
      "Edge strength shows how warm each connection is",
      "Filter by team member to see their network",
    ],
  },
  {
    href: "/accounts",
    icon: Building2,
    color: "#e8a55a",
    title: "Accounts",
    tagline: "Your target companies",
    description: "Every company you're pursuing with their warmth score, active buying signals, and relationship strength at a glance.",
    bullets: [
      "Opportunity score combines fit, intent, and warmth",
      "See how many contacts and signals per account",
      "Generate outreach for an account in one click",
    ],
  },
  {
    href: "/knowledge-base",
    icon: BookOpen,
    color: "#cc785c",
    title: "Knowledge Base",
    tagline: "Your company's brain for the AI",
    description: "Add your messaging frameworks, case studies, pricing, and personas here. The AI uses these to write messages that sound exactly like your company.",
    bullets: [
      "Upload case studies, pricing, and ICP definitions",
      "AI references these when drafting outreach",
      "Update anytime — takes effect immediately",
    ],
  },
  {
    href: "/integrations",
    icon: Link2,
    color: "#5db8a6",
    title: "Integrations",
    tagline: "Connect your existing tools",
    description: "Link LinkedIn, Gmail, Salesforce, and more. WarmPath pulls relationship data from the tools your team already uses.",
    bullets: [
      "LinkedIn syncs connections for the relationship graph",
      "Gmail/Outlook pulls email history for warmth scoring",
      "Salesforce/HubSpot keeps contact data in sync",
    ],
  },
];

interface ProductTourProps {
  open: boolean;
  onClose: () => void;
}

export function ProductTour({ open, onClose }: ProductTourProps) {
  const router = useRouter();
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
    if (open) {
      setStep(0);
      router.push(STEPS[0].href);
    }
  }, [open, router]);

  const current = STEPS[step];

  // Find sidebar nav item — scope to [data-sidebar] to avoid matching header badges
  useEffect(() => {
    if (!open || !mounted) return;

    const measure = () => {
      // Scope to sidebar to avoid matching header badge links with same href
      const sidebar = document.querySelector('[data-sidebar="sidebar"]') ?? document.body;
      const el =
        (sidebar.querySelector(`a[href="${current.href}"]`) as HTMLElement | null) ??
        (document.querySelector(`a[href="${current.href}"]`) as HTMLElement | null);
      if (el) {
        const r = el.getBoundingClientRect();
        setHighlightRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setHighlightRect(null);
      }
    };

    measure();
    const timer = setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [open, mounted, step, current.href]);

  const goToStep = useCallback(
    (nextStep: number) => {
      setStep(nextStep);
      router.push(STEPS[nextStep].href);
    },
    [router],
  );

  const next = useCallback(() => {
    if (step < STEPS.length - 1) goToStep(step + 1);
    else onClose();
  }, [step, onClose, goToStep]);

  const prev = useCallback(() => {
    if (step > 0) goToStep(step - 1);
  }, [step, goToStep]);

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
  const PAD = 8;

  const sidebarRight = highlightRect ? highlightRect.left + highlightRect.width + PAD + 20 : 280;
  const cardY = highlightRect
    ? Math.max(16, Math.min(highlightRect.top + highlightRect.height / 2 - 180, window.innerHeight - 420))
    : Math.floor(window.innerHeight / 2) - 180;

  return createPortal(
    <>
      {/* Soft backdrop — light enough to see the page behind */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(1px)",
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
            borderRadius: 10,
            border: `2px solid ${current.color}`,
            boxShadow: `0 0 0 4000px rgba(0,0,0,0.45), 0 0 24px ${current.color}99`,
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
          width: 360,
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
            boxShadow: "0 24px 64px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {/* Coloured top banner */}
          <div
            style={{
              background: `linear-gradient(135deg, ${current.color}18 0%, ${current.color}08 100%)`,
              borderBottom: `1px solid ${current.color}25`,
              padding: "18px 20px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${current.color}20`,
                border: `1.5px solid ${current.color}35`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: 22, height: 22, color: current.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: current.color, marginBottom: 3 }}>
                {step + 1} of {STEPS.length}
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#141413", lineHeight: 1.2, marginBottom: 2 }}>
                {current.title}
              </h2>
              <p style={{ fontSize: 12, fontWeight: 600, color: current.color }}>
                {current.tagline}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6c6a64",
                flexShrink: 0,
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
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 13, color: "#6c6a64", lineHeight: 1.6, marginBottom: 14 }}>
              {current.description}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {current.bullets.map((bullet) => (
                <div key={bullet} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: current.color,
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <span style={{ fontSize: 12.5, color: "#3d3b35", lineHeight: 1.5 }}>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 14, paddingTop: 2 }}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToStep(i)}
                style={{
                  width: i === step ? 20 : 6,
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
                padding: "8px 18px",
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
    document.body,
  );
}
