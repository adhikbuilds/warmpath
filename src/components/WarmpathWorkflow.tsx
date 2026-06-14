/**
 * WarmpathWorkflow — BlueWarm warm-path journey animation.
 *
 * A self-contained React + TypeScript component that loops through the
 * 5-step warm-path workflow (Connect → Signal → Warm Path → AI Draft →
 * Human Approval), panning a camera down a glowing spine — matching the
 * "Warmpath Workflow.html" design.
 *
 * Usage:
 *   import { WarmpathWorkflow } from "./WarmpathWorkflow";
 *   import "./warmpath-workflow.css";
 *
 *   <WarmpathWorkflow />                          // defaults
 *   <WarmpathWorkflow theme="dark" secondsPerStep={3} />
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ------------------------------------------------------------------ */
/* Types & data                                                        */
/* ------------------------------------------------------------------ */

export interface WorkflowChip {
  label: string;
  /** "accent" = blue filled chip with dot, "plain" = outlined gray chip */
  variant: "accent" | "plain";
}

export interface WorkflowStep {
  kicker: string;
  title: string;
  sub: string;
  chips?: WorkflowChip[];
  /** Renders the You → Sarah → Buyer mini path visualization */
  pathViz?: boolean;
  /** Renders the "Approve & send" button that fills in mid-step */
  approveButton?: boolean;
}

export interface WarmpathWorkflowProps {
  /** Steps to display. Defaults to the BlueWarm warm-path journey. */
  steps?: WorkflowStep[];
  /** Seconds each step stays focused. Default 2.5 */
  secondsPerStep?: number;
  /** Light (brand off-white) or dark. Default "light" */
  theme?: "light" | "dark";
  /** Show the proof chips rows. Default true */
  showChips?: boolean;
  /** Freeze the loop on a given step (for screenshots). */
  paused?: boolean;
  /** Optional extra class on the outer container. */
  className?: string;
}

export const DEFAULT_STEPS: WorkflowStep[] = [
  {
    kicker: "Connect",
    title: "Map the relationship graph",
    sub: "Every inbox, network and CRM record becomes one team-wide graph of who knows whom.",
    chips: [
      { label: "Email", variant: "accent" },
      { label: "LinkedIn", variant: "accent" },
      { label: "CRM", variant: "accent" },
    ],
  },
  {
    kicker: "Signal",
    title: "A buying signal fires",
    sub: "A target account just hired a new VP of Sales — verified, time-stamped, in your ICP.",
    chips: [
      { label: "New VP Sales", variant: "accent" },
      { label: "Verified signal", variant: "plain" },
      { label: "13+ signal types", variant: "plain" },
    ],
  },
  {
    kicker: "Warm Path",
    title: "Shortest warm path found",
    sub: "Pathfinding across the graph surfaces the strongest route to the buyer.",
    pathViz: true,
    chips: [
      { label: "2 hops", variant: "accent" },
      { label: "Strength 87", variant: "accent" },
    ],
  },
  {
    kicker: "AI Draft",
    title: "A 1:1 message, personalized",
    sub: "AI drafts the intro in your voice anchored to the verified signal, never spray-and-pray.",
    chips: [
      { label: "Signal-grounded", variant: "accent" },
      { label: "Your tone & voice", variant: "plain" },
    ],
  },
  {
    kicker: "Human Approval",
    title: "A real person hits send",
    sub: "Nothing leaves without your sign-off. The intro goes out in their own name.",
    approveButton: true,
  },
];

/* ------------------------------------------------------------------ */
/* Layout constants (canvas-space pixels)                              */
/* ------------------------------------------------------------------ */

const CANVAS_W = 1200;
const CANVAS_H = 750;
const STEP_GAP = 420; // distance between nodes in world space
const FIRST_Y = 180; // y of node 0
const FOCUS_Y = 240; // where the active node sits on screen
const NODE_CENTER_OFFSET = 22; // half of node height

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function WarmpathWorkflow({
  steps = DEFAULT_STEPS,
  secondsPerStep = 2.5,
  theme = "light",
  showChips = true,
  paused = false,
  className,
}: WarmpathWorkflowProps): React.ReactElement {
  const n = steps.length;
  const [active, setActive] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  /* Advance the loop */
  useEffect(() => {
    if (paused || n <= 1) return;
    const id = window.setInterval(() => {
      setActive((cur) => (cur + 1) % n);
    }, Math.max(800, secondsPerStep * 1000));
    return () => window.clearInterval(id);
  }, [paused, secondsPerStep, n]);

  /* Scale the fixed 1200x750 canvas to the container width */
  const rescale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScale(el.clientWidth / CANVAS_W);
  }, []);

  useEffect(() => {
    rescale();
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", rescale);
      return () => window.removeEventListener("resize", rescale);
    }
    const ro = new ResizeObserver(rescale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rescale]);

  /* Camera + spine fill */
  const nodeY = FIRST_Y + active * STEP_GAP + NODE_CENTER_OFFSET;
  const worldShift = FOCUS_Y - nodeY;
  const spineTop = FIRST_Y - 120;
  const spineHeight = (n - 1) * STEP_GAP + 240;
  const fillHeight = nodeY - spineTop;

  const pips = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);

  return (
    <div
      ref={containerRef}
      className={["wpw-container", className].filter(Boolean).join(" ")}
      style={{ height: CANVAS_H * scale }}
    >
      <div
        className={`wpw-canvas ${showChips ? "" : "wpw-no-chips"}`}
        data-wpw-theme={theme}
        style={{ transform: `scale(${scale})` }}
        data-screen-label="Warmpath workflow animation"
      >
        <div className="wpw-brand">
          <span className="wpw-brand-mark"></span>
          <span className="wpw-brand-word">
            <strong>BlueWarm</strong>&nbsp;·&nbsp;Warm Path
          </span>
        </div>

        <div className="wpw-pips">
          {pips.map((i) => (
            <span key={i} className={i <= active ? "wpw-on" : ""}></span>
          ))}
        </div>

        <div
          className="wpw-world"
          style={{ transform: `translateY(${worldShift}px)` }}
        >
          <div
            className="wpw-spine"
            style={{ top: spineTop, height: spineHeight }}
          >
            <div className="wpw-spine-fill" style={{ height: fillHeight }}></div>
          </div>

          {steps.map((step, i) => (
            <StepCard
              key={i}
              step={step}
              index={i}
              state={i === active ? "active" : i < active ? "passed" : "idle"}
              top={FIRST_Y + i * STEP_GAP}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Internals                                                           */
/* ------------------------------------------------------------------ */

interface StepCardProps {
  step: WorkflowStep;
  index: number;
  state: "active" | "passed" | "idle";
  top: number;
}

function StepCard({ step, index, state, top }: StepCardProps): React.ReactElement {
  return (
    <div className={`wpw-step wpw-${state}`} style={{ top }}>
      <div className="wpw-node">{String(index + 1).padStart(2, "0")}</div>
      <div className="wpw-card">
        <p className="wpw-kicker">{step.kicker}</p>
        <h2 className="wpw-title">{step.title}</h2>
        <p className="wpw-sub">{step.sub}</p>

        {step.pathViz === true && (
          <div className="wpw-pathviz">
            <div className="wpw-person wpw-p1">
              <span className="wpw-avatar"></span>
              <span className="wpw-person-name">You</span>
            </div>
            <span className="wpw-seg wpw-s1"></span>
            <div className="wpw-person wpw-p2">
              <span className="wpw-avatar"></span>
              <span className="wpw-person-name">Sarah · Eng</span>
            </div>
            <span className="wpw-seg wpw-s2"></span>
            <div className="wpw-person wpw-p3">
              <span className="wpw-avatar"></span>
              <span className="wpw-person-name">Buyer</span>
            </div>
          </div>
        )}

        {step.approveButton === true && (
          <div className="wpw-approve">
            <span className="wpw-check">✓&nbsp;</span>Approve &amp; send
          </div>
        )}

        {step.chips !== undefined && step.chips.length > 0 && (
          <div className="wpw-chips">
            {step.chips.map((chip, ci) => (
              <span
                key={ci}
                className={`wpw-chip ${chip.variant === "plain" ? "wpw-chip-plain" : ""}`}
              >
                {chip.variant === "accent" && <span className="wpw-dot"></span>}
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WarmpathWorkflow;
