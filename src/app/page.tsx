"use client";

import {
  ArrowRight,
  BarChart3,
  Check,
  MessageSquare,
  Minus,
  Network,
  Play,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { WarmpathWorkflow } from "@/components/WarmpathWorkflow";
import "@/components/warmpath-workflow.css";

function useCountUp(target: number, duration = 1600, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cur = 0;
    const step = (target / duration) * 16;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Math.floor(cur));
      if (cur >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [active, target, duration]);
  return val;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, seen };
}

const PHRASES = [
  "relationship graph",
  "network intelligence",
  "warm intro engine",
  "revenue network",
];

function Typewriter({ color }: { color: string }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [erasing, setErasing] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const phrase = PHRASES[idx];
    if (paused) {
      const t = setTimeout(() => {
        setErasing(true);
        setPaused(false);
      }, 2000);
      return () => clearTimeout(t);
    }
    if (!erasing) {
      if (text.length < phrase.length) {
        const t = setTimeout(() => setText(phrase.slice(0, text.length + 1)), 55);
        return () => clearTimeout(t);
      }
      setPaused(true);
    } else {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), 30);
        return () => clearTimeout(t);
      }
      setErasing(false);
      setIdx((i) => (i + 1) % PHRASES.length);
    }
  }, [text, erasing, paused, idx]);
  return (
    <span style={{ color }}>
      {text}
      <span style={{ color, opacity: 0.6, animation: "blink 1s step-end infinite" }}>|</span>
    </span>
  );
}

const PATHS = [
  {
    company: "Stripe",
    role: "CTO Evaluation",
    acv: "$500k",
    hops: "1-hop",
    warmth: 94,
    path: ["You", "James Liu (ex-Rippling)", "David Singleton · CTO"],
    approved: true,
    timing: "Responded in 4h",
  },
  {
    company: "Databricks",
    role: "VP Sales",
    acv: "$320k",
    hops: "2-hop",
    warmth: 88,
    path: ["You", "Maria Chen (ex-Salesforce)", "Alex Park · VP Sales"],
    approved: false,
    timing: "Sent 2h ago",
  },
  {
    company: "OpenAI",
    role: "Head of Engineering",
    acv: "$800k",
    hops: "1-hop",
    warmth: 91,
    path: ["You", "Kevin Zhang (ex-Google)", "HoE · Meeting booked"],
    approved: true,
    timing: "Meeting booked",
  },
];

function DemoCard() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PATHS.length);
        setFade(true);
      }, 350);
    }, 3500);
    return () => clearInterval(t);
  }, []);
  const p = PATHS[idx];

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 32px rgba(37,99,235,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
              animation: "pulse 2s ease infinite",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
            Live warm path engine
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {PATHS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === idx ? "#2563eb" : "#e2e8f0",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Path card body */}
      <div
        style={{
          padding: "20px",
          opacity: fade ? 1 : 0,
          transform: fade ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {/* Company row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{p.company}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #bfdbfe",
                }}
              >
                {p.hops}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b" }}>
              {p.role} · {p.acv} ACV
            </p>
          </div>
          {/* Warmth ring */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `conic-gradient(#10b981 ${p.warmth * 3.6}deg, #e2e8f0 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 5,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981" }}>{p.warmth}</span>
              </div>
            </div>
            <p
              style={{
                fontSize: 9,
                color: "#94a3b8",
                marginTop: 2,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Warmth
            </p>
          </div>
        </div>

        {/* Path visualization */}
        <div
          style={{
            background: "#f8faff",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 16,
            border: "1px solid #eff2ff",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#94a3b8",
              marginBottom: 10,
            }}
          >
            Intro path
          </p>
          {p.path.map((node, i) => (
            <div key={i}>
              {i > 0 && (
                <div
                  style={{ width: 1, height: 10, background: "#c7d2fe", margin: "2px 0 2px 5px" }}
                />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      i === 0 ? "#2563eb" : i === p.path.length - 1 ? "#10b981" : "#2563eb",
                    border: "2px solid #fff",
                    boxShadow: `0 0 0 1px ${i === 0 ? "#2563eb" : i === p.path.length - 1 ? "#10b981" : "#2563eb"}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: i === 0 ? "#2563eb" : i === p.path.length - 1 ? "#0f172a" : "#374151",
                    fontWeight: i === 0 || i === p.path.length - 1 ? 600 : 400,
                  }}
                >
                  {node}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Status row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: p.approved ? "#10b981" : "#f59e0b",
              }}
            />
            <span style={{ fontSize: 11, color: "#64748b" }}>{p.timing}</span>
          </div>
          <button
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "7px 16px",
              borderRadius: 8,
              cursor: "pointer",
              background: p.approved ? "#ecfdf5" : "#2563eb",
              color: p.approved ? "#059669" : "#fff",
              border: p.approved ? "1px solid #a7f3d0" : "none",
            }}
          >
            {p.approved ? "✓ Approved" : "Approve →"}
          </button>
        </div>
      </div>

      {/* Metrics footer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid #f1f5f9",
        }}
      >
        {[
          { v: "1,240", l: "Prospects" },
          { v: "847", l: "Warm paths" },
          { v: "1.2", l: "Avg hops" },
          { v: "99%", l: "Approvals" },
        ].map((m, i) => (
          <div
            key={m.l}
            style={{
              padding: "12px 8px",
              textAlign: "center",
              borderRight: i < 3 ? "1px solid #f1f5f9" : "none",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 800, color: "#2563eb" }}>{m.v}</p>
            <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{m.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const CASES = [
  {
    tab: "Account Executives",
    scenario: "40 target accounts, zero direct relationships.",
    solution:
      "WarmBlue surfaces warm connections to 28 of them in under 2 hours. AI drafts the intro message — your connector approves in 30 seconds. You're in front of buyers, not inboxes.",
    impact: "3.2× higher reply rate than cold email",
    steps: [
      "Upload target account list",
      "Graph maps 847 warm connections",
      "AI drafts intro per path",
      "Connector approves in 30s",
    ],
  },
  {
    tab: "Sales Directors",
    scenario: "Team sends cold outreach, nobody replies.",
    solution:
      "Route every message through the warmest relationship path. Every outreach goes through a human approver — no rogue sends, full visibility, measurable improvement in reply rate.",
    impact: "60% less cold spend, 47% warm reply rate",
    steps: [
      "Set team approval rules",
      "Route through connector",
      "Track approval queue live",
      "Measure reply uplift in CRM",
    ],
  },
  {
    tab: "Revenue Ops",
    scenario: "No visibility into which relationships drive pipeline.",
    solution:
      "WarmBlue maps your entire team's network, scores every path by warmth × recency, auto-syncs closed deals, and surfaces a full relationship ROI dashboard.",
    impact: "18-day faster sales cycle on warm deals",
    steps: [
      "Connect CRM + LinkedIn + email",
      "Auto-score all relationship edges",
      "Sync closed deals to graph",
      "Report on relationship ROI",
    ],
  },
];

const PERSONAS = [
  {
    key: "ae",
    label: "Account Executive",
    role: "Individual quota carrier",
    color: "#2563eb",
    sliderLabel: "Monthly target accounts",
    sliderMin: 1,
    sliderMax: 25,
    defaultTeamSize: 1,
    metrics: (teamSize: number, acv: number) => {
      const addARR = Math.round(teamSize * acv * 1000 * 0.032 * 3);
      const payback = Math.max(6, Math.round(14 - teamSize / 6));
      const roi = (Math.round((addARR / Math.max(teamSize * 3600, 1)) * 10) / 10).toFixed(1);
      return [
        { label: "Additional ARR", value: `+$${(addARR / 1000).toFixed(0)}K` },
        { label: "Payback period", value: `${payback} wks` },
        { label: "Year-1 ROI", value: `${roi}×` },
      ];
    },
  },
  {
    key: "director",
    label: "Sales Director",
    role: "Team-wide pipeline lift",
    color: "#10b981",
    sliderLabel: "Account Executives on team",
    sliderMin: 3,
    sliderMax: 40,
    defaultTeamSize: 12,
    metrics: (teamSize: number, acv: number) => {
      const addARR = Math.round(teamSize * acv * 1000 * 0.032 * 3);
      const coldSpendSaved = Math.round(teamSize * 18);
      return [
        { label: "Team ARR lift", value: `+$${(addARR / 1000).toFixed(0)}K` },
        { label: "Cold spend saved /yr", value: `$${coldSpendSaved}K` },
        { label: "Reply-rate uplift", value: `3.2×` },
      ];
    },
  },
  {
    key: "revops",
    label: "RevOps",
    role: "Network-driven efficiency",
    color: "#8b5cf6",
    sliderLabel: "AEs across org",
    sliderMin: 8,
    sliderMax: 120,
    defaultTeamSize: 30,
    metrics: (teamSize: number, acv: number) => {
      const addARR = Math.round(teamSize * acv * 1000 * 0.032 * 3);
      const pipelineLift = Math.round((addARR * 2.4) / 1000);
      const cycleDays = Math.max(8, 18 - Math.floor(teamSize / 3));
      const networkPct = Math.min(72, 40 + teamSize);
      return [
        { label: "Pipeline lift /yr", value: `+$${pipelineLift}K` },
        { label: "Cycle reduction", value: `${cycleDays}d faster` },
        { label: "Network-sourced", value: `${networkPct}%` },
      ];
    },
  },
] as const;

const LANDING_PERSONAS = [
  {
    id: "ae",
    icon: "🎯",
    title: "Account Executive",
    subtitle: "I carry quota",
    story:
      "You have 40 target accounts and zero warm intros. WarmBlue maps your team's network, finds the warmest path to each buyer, and drafts the intro in seconds. Your connector approves in 30 seconds — you're in the meeting.",
    outcomes: [
      { label: "Reply rate", value: "3.2×", sub: "vs cold email" },
      { label: "Avg path", value: "1.2 hops", sub: "to decision maker" },
      { label: "Time to meeting", value: "4 days", sub: "from first signal" },
    ],
    color: "#2563eb",
  },
  {
    id: "director",
    icon: "📊",
    title: "Sales Director",
    subtitle: "I lead a team",
    story:
      "Your team burns budget on cold outreach that nobody replies to. WarmBlue routes every message through the warmest relationship in your combined network — and puts a human in the loop for every approval.",
    outcomes: [
      { label: "Cold spend", value: "−60%", sub: "year over year" },
      { label: "Team reply rate", value: "47%", sub: "on warm intros" },
      { label: "Rogue sends", value: "Zero", sub: "full audit trail" },
    ],
    color: "#10b981",
  },
  {
    id: "revops",
    icon: "⚙️",
    title: "Revenue Ops",
    subtitle: "I run GTM",
    story:
      "You have no visibility into which relationships actually drive pipeline. WarmBlue scores every path, tracks every intro to closed deal, and gives you a relationship ROI dashboard your CFO can read.",
    outcomes: [
      { label: "Deal cycle", value: "18d faster", sub: "on warm deals" },
      { label: "Attribution", value: "Full", sub: "intro → closed deal" },
      { label: "Network ROI", value: "Provable", sub: "to CFO" },
    ],
    color: "#8b5cf6",
  },
  {
    id: "founder",
    icon: "🚀",
    title: "Founder / CEO",
    subtitle: "I'm building",
    story:
      "You need to land your first 10 enterprise customers running on relationship capital. WarmBlue turns your personal network into structured warm paths — to enterprise buyers, key hires, and investors.",
    outcomes: [
      { label: "Network reach", value: "10×", sub: "vs direct connects" },
      { label: "Intro quality", value: "Scored", sub: "warmth + ICP fit" },
      { label: "Deal velocity", value: "4× faster", sub: "referral closes" },
    ],
    color: "#ec4899",
  },
];

function PersonaSection() {
  const [active, setActive] = useState("ae");
  const persona = LANDING_PERSONAS.find((p) => p.id === active) ?? LANDING_PERSONAS[0];
  const primary = "#2563eb";
  const muted = "#64748b";
  const border = "#e2e8f0";
  const text = "#0f172a";

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: primary,
            marginBottom: 12,
          }}
        >
          Who is WarmBlue for?
        </p>
        <h2
          style={{
            fontSize: "clamp(24px, 3.5vw, 40px)",
            fontWeight: 900,
            letterSpacing: "-1px",
            marginBottom: 12,
            color: text,
          }}
        >
          See your story in WarmBlue.
        </h2>
        <p style={{ fontSize: 16, color: muted }}>
          Click your role to see exactly how it works for you.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          marginBottom: 40,
          flexWrap: "wrap",
        }}
      >
        {LANDING_PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(p.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: active === p.id ? p.color : "#fff",
              color: active === p.id ? "#fff" : muted,
              border: `1.5px solid ${active === p.id ? p.color : border}`,
              boxShadow: active === p.id ? `0 4px 14px ${p.color}35` : "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <span>{p.icon}</span>
            {p.title}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${border}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ padding: "40px 44px", backgroundColor: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: `${persona.color}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {persona.icon}
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: text }}>{persona.title}</p>
              <p style={{ fontSize: 12, color: muted }}>{persona.subtitle}</p>
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.85, color: "#475569", marginBottom: 28 }}>
            {persona.story}
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              padding: "11px 22px",
              borderRadius: 9,
              backgroundColor: persona.color,
              color: "#fff",
              textDecoration: "none",
              boxShadow: `0 3px 12px ${persona.color}40`,
            }}
          >
            Start as {persona.title} <ArrowRight size={14} />
          </Link>
        </div>

        <div
          style={{
            padding: "40px 44px",
            backgroundColor: "#f8f9fb",
            borderLeft: `1px solid ${border}`,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#94a3b8",
              marginBottom: 28,
            }}
          >
            Your outcomes
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {persona.outcomes.map((o) => (
              <div
                key={o.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderRadius: 12,
                  backgroundColor: "#fff",
                  border: `1px solid ${persona.color}18`,
                  borderLeft: `3px solid ${persona.color}`,
                }}
              >
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: muted, marginBottom: 2 }}>
                    {o.label}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8" }}>{o.sub}</p>
                </div>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: persona.color,
                    letterSpacing: "-1px",
                  }}
                >
                  {o.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ROICalc() {
  const [acv, setAcv] = useState(120);
  const [teamSizes, setTeamSizes] = useState({ ae: 1, director: 12, revops: 30 });
  const primary = "#2563eb";
  const muted = "#64748b";
  const text = "#0f172a";

  return (
    <div
      style={{
        borderRadius: 20,
        padding: "32px",
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          marginBottom: 32,
          padding: "20px 24px",
          borderRadius: 12,
          backgroundColor: "#f8faff",
          border: "1px solid #e0e9ff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <label style={{ fontSize: 14, fontWeight: 600, color: text }}>
            Average deal size — applies to all personas
          </label>
          <span style={{ fontSize: 26, fontWeight: 900, color: primary, letterSpacing: "-1px" }}>
            ${acv}k
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={500}
          value={acv}
          onChange={(e) => setAcv(+e.target.value)}
          style={{ width: "100%", accentColor: primary, cursor: "pointer" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: muted,
            marginTop: 4,
          }}
        >
          <span>$20k</span>
          <span>$500k</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {PERSONAS.map((p) => {
          const tSize = teamSizes[p.key as keyof typeof teamSizes];
          const metrics = p.metrics(tSize, acv);
          return (
            <div
              key={p.key}
              style={{
                borderRadius: 14,
                padding: "22px 20px",
                border: `1.5px solid ${p.color}28`,
                backgroundColor: `${p.color}05`,
                borderTop: `3px solid ${p.color}`,
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: p.color, marginBottom: 2 }}>
                  {p.label}
                </p>
                <p style={{ fontSize: 11, color: muted }}>{p.role}</p>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <label style={{ fontSize: 12, color: muted }}>{p.sliderLabel}</label>
                  <span style={{ fontSize: 18, fontWeight: 800, color: p.color }}>{tSize}</span>
                </div>
                <input
                  type="range"
                  min={p.sliderMin}
                  max={p.sliderMax}
                  value={tSize}
                  onChange={(e) => setTeamSizes((prev) => ({ ...prev, [p.key]: +e.target.value }))}
                  style={{ width: "100%", accentColor: p.color, cursor: "pointer" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: muted,
                    marginTop: 2,
                  }}
                >
                  <span>{p.sliderMin}</span>
                  <span>{p.sliderMax}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 8,
                      backgroundColor: `${p.color}0a`,
                      border: `1px solid ${p.color}18`,
                    }}
                  >
                    <span style={{ fontSize: 11, color: muted }}>{m.label}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: p.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28, textAlign: "center" }}>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 700,
            padding: "14px 32px",
            borderRadius: 12,
            backgroundColor: primary,
            color: "#fff",
            textDecoration: "none",
            boxShadow: `0 4px 16px rgba(37,99,235,0.35)`,
          }}
        >
          Start free trial — see your real ROI <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeCase, setActiveCase] = useState(0);
  const { ref: statsRef, seen: statsSeen } = useInView(0.2);
  const v1 = useCountUp(47, 1400, statsSeen);
  const v2 = useCountUp(18, 1200, statsSeen);
  const v3 = useCountUp(60, 1400, statsSeen);

  const bg = "#ffffff";
  const surface = "#f8f9fb";
  const border = "#e2e8f0";
  const text = "#0f172a";
  const muted = "#64748b";
  const primary = "#2563eb";
  const accent = "#10b981";
  const indigo = "#2563eb";

  const FEATURES = [
    {
      Icon: Network,
      color: primary,
      title: "Relationship Graph",
      stat: "35+ nodes/workspace",
      body: "Builds a live graph from email, LinkedIn, and CRM across your entire team. Every node scored by warmth, recency, and mutual connections. BFS pathfinding surfaces intros you didn't know existed.",
    },
    {
      Icon: Target,
      color: accent,
      title: "Warm Path Scoring",
      stat: "4-factor model",
      body: "Each path scored across 4 factors: relationship strength, recency of last touch, ICP fit, and active buying signal. Algorithm updates daily as your network changes.",
    },
    {
      Icon: Zap,
      color: "#f59e0b",
      title: "Signal Detection",
      stat: "18 days ahead of intent",
      body: "Track 7 real buying signals — funding rounds, leadership changes, hiring sprees, champion moves, tech stack changes, pricing page visits, and G2 reviews.",
    },
    {
      Icon: MessageSquare,
      color: indigo,
      title: "Personalised Outreach",
      stat: "3.2× reply rate vs cold",
      body: "Intros drafted with factual claims from the prospect's public profile, tone-matched to your writing style, and verified by your connector before anything sends.",
    },
    {
      Icon: ShieldCheck,
      color: "#06b6d4",
      title: "Human Approval Queue",
      stat: "47% warm reply rate",
      body: "Every message goes through a connector before it's sent. One-click approve, edit inline, or re-route to the next warmest path. Full audit trail. No spam, ever.",
    },
    {
      Icon: BarChart3,
      color: "#ec4899",
      title: "Revenue Attribution",
      stat: "Full pipeline attribution",
      body: "Track every warm intro from first approval to closed deal. See exactly which relationships drive revenue. Prove network-sourced pipeline ROI to your CFO with hard numbers.",
    },
  ];

  return (
    <div style={{ backgroundColor: bg, color: text, minHeight: "100vh" }}>
      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              color: text,
              textDecoration: "none",
            }}
          >
            <Logo size={26} />
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" }}>WarmBlue</span>
          </Link>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {[
              ["Use cases", "#usecases"],
              ["Compare", "#compare"],
              ["ROI", "#roi"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{ fontSize: 13, fontWeight: 500, color: muted, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
              >
                {label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: muted,
                textDecoration: "none",
                padding: "8px 12px",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "9px 18px",
                borderRadius: 8,
                backgroundColor: primary,
                color: "#fff",
                textDecoration: "none",
                boxShadow: `0 2px 8px rgba(37,99,235,0.30)`,
              }}
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "140px 24px 100px",
        }}
      >
        {/* Ambient glows */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "0%",
            width: 600,
            height: 600,
            background: `radial-gradient(circle, ${indigo}12 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "45%",
            right: "20%",
            width: 350,
            height: 350,
            background: `radial-gradient(circle, ${accent}0e 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
        >
          {/* Left */}
          <div>
            <h1
              style={{
                fontSize: "clamp(44px, 5vw, 68px)",
                fontWeight: 900,
                lineHeight: 1.06,
                letterSpacing: "-2.5px",
                marginBottom: 24,
              }}
            >
              Activate your
              <br />
              <Typewriter color={primary} />
              <br />
              <span style={{ color: text }}>for revenue.</span>
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.75,
                color: muted,
                maxWidth: 460,
                marginBottom: 36,
              }}
            >
              Map warm paths to every decision maker. AI-drafted intros, human-approved. Close more
              deals through relationships — not cold outreach.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
              <Link
                href="/login?tab=signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "14px 28px",
                  borderRadius: 10,
                  backgroundColor: primary,
                  color: "#fff",
                  textDecoration: "none",
                  boxShadow: `0 4px 16px rgba(37,99,235,0.38)`,
                }}
              >
                Get started free <ArrowRight size={16} />
              </Link>
              <a
                href="#"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "14px 22px",
                  borderRadius: 10,
                  backgroundColor: "#fff",
                  color: text,
                  textDecoration: "none",
                  border: `1px solid ${border}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <Play size={13} /> Book a demo
              </a>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {[
                { label: "Reply rate", value: "3.2×", color: primary },
                { label: "Avg path length", value: "1.2 hops", color: primary },
                { label: "Cold spend saved", value: "60%", color: primary },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: s.color,
                      letterSpacing: "-0.5px",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ fontSize: 11, color: muted, marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <DemoCard />
        </div>
      </section>

      {/* ── TRUST LOGOS ──────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: `1px solid ${border}`,
          borderBottom: `1px solid ${border}`,
          backgroundColor: surface,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
          <p
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#b0b8c8",
              marginBottom: 24,
            }}
          >
            Connects with your existing stack
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            {/* Salesforce */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, opacity: 0.55 }}>
              <svg width="22" height="16" viewBox="0 0 48 34" fill="none">
                <path
                  d="M20 0C16.7 0 13.8 1.6 12 4.1 10.8 2.8 9 2 7 2 3.1 2 0 5.1 0 9c0 .5.1 1 .2 1.5C-.2 11.4-.5 12.8.5 14.5 1 16 2.5 17 4 17.2V17H20V0z"
                  fill="#00A1E0"
                />
                <path
                  d="M48 13c0-4.4-3.6-8-8-8-1.1 0-2.2.2-3.2.6C35.5 3.1 32.8 1 29.5 1c-2 0-3.8.8-5.1 2C22.8 1.1 20.5 0 18 0v17h30v-.3c0-.1 0-.2-.1-.3C48.6 15.5 48 14.3 48 13z"
                  fill="#00A1E0"
                />
                <rect x="0" y="17" width="48" height="17" rx="4" fill="#00A1E0" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Salesforce</span>
            </div>
            {/* HubSpot */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, opacity: 0.55 }}>
              <svg width="20" height="20" viewBox="0 0 512 512" fill="none">
                <circle cx="256" cy="256" r="256" fill="#FF7A59" />
                <path
                  d="M312 192v-48a32 32 0 1 0-64 0v48h-64v64h64v32c0 17.7 14.3 32 32 32h64v-64h-48v-32h48v-32h-32z"
                  fill="white"
                />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>HubSpot</span>
            </div>
            {/* Slack */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, opacity: 0.55 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
                  fill="#E01E5A"
                />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Slack</span>
            </div>
            {/* LinkedIn */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, opacity: 0.55 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#0A66C2" />
                <path
                  fill="white"
                  d="M6.5 9h2.6v8H6.5zm1.3-3.7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.6 9h2.5v1.1h.03c.35-.66 1.2-1.36 2.47-1.36 2.65 0 3.14 1.74 3.14 4V17h-2.6v-3.6c0-.86-.02-1.97-1.2-1.97-1.2 0-1.39.94-1.39 1.9V17h-2.6V9z"
                />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>LinkedIn</span>
            </div>
            {/* Gmail */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, opacity: 0.55 }}>
              <svg width="20" height="16" viewBox="0 0 24 20" fill="none">
                <path
                  d="M0 4a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4z"
                  fill="#FAFAFA"
                />
                <path d="M0 4l12 8L24 4" stroke="#EA4335" strokeWidth="2" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Gmail</span>
            </div>
            {/* Outreach */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, opacity: 0.55 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#5951FF" />
                <path
                  d="M7 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0zm3.5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"
                  fill="white"
                />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Outreach</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── WHO IS IT FOR ────────────────────────────────────────────────── */}
      <PersonaSection />

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        <div
          ref={statsRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${border}`,
            backgroundColor: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          {[
            { value: "3.2×", label: "higher reply rate", sub: "vs cold email", color: primary },
            {
              value: `${v1}%`,
              label: "warm intro reply rate",
              sub: "HubSpot research",
              color: primary,
            },
            {
              value: `${v2}d`,
              label: "faster deal cycle",
              sub: "customer average",
              color: primary,
            },
            {
              value: `${v3}%`,
              label: "reduction in cold spend",
              sub: "customer report",
              color: primary,
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: "36px 28px",
                borderRight: i < 3 ? `1px solid ${border}` : "none",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  lineHeight: 1,
                  marginBottom: 8,
                  color: s.color,
                  letterSpacing: "-2px",
                }}
              >
                {s.value}
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 11, color: "#94a3b8" }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto 100px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: primary,
              marginBottom: 12,
            }}
          >
            How it works
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 46px)",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              marginBottom: 12,
            }}
          >
            From network to closed deal in 3 steps.
          </h2>
          <p style={{ fontSize: 16, color: muted, maxWidth: 500, margin: "0 auto" }}>
            WarmBlue finds the warmest path to every buyer, drafts the intro, and puts a human in
            the loop before anything sends.
          </p>
        </div>

        <WarmpathWorkflow theme="light" secondsPerStep={3} />
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: surface,
          borderTop: `1px solid ${border}`,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ marginBottom: 56 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: primary,
                marginBottom: 12,
              }}
            >
              Product features
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontWeight: 900,
                letterSpacing: "-1.5px",
                marginBottom: 12,
              }}
            >
              Every layer of B2B outbound, rebuilt.
            </h2>
            <p style={{ fontSize: 16, color: muted, maxWidth: 560 }}>
              Not another spray-and-pray tool. WarmPath is a relationship intelligence engine — from
              your first signal to a closed deal.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 14,
                  padding: "28px",
                  backgroundColor: "#fff",
                  border: `1px solid ${border}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  borderTop: `3px solid ${f.color}`,
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 8px 28px rgba(0,0,0,0.09)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 1px 4px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      backgroundColor: `${f.color}12`,
                      border: `1px solid ${f.color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <f.Icon size={20} color={f.color} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 20,
                      backgroundColor: `${f.color}0e`,
                      color: f.color,
                      border: `1px solid ${f.color}1c`,
                    }}
                  >
                    {f.stat}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: text }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: muted, flex: 1 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ────────────────────────────────────────────────────── */}
      <section id="usecases" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: primary,
              marginBottom: 12,
            }}
          >
            Use cases
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 46px)",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              marginBottom: 12,
            }}
          >
            Built for your revenue playbook.
          </h2>
          <p style={{ fontSize: 16, color: muted }}>
            From AEs to RevOps — warm paths unlock different levers at every level.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {CASES.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveCase(i)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 20px",
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: activeCase === i ? primary : "#fff",
                color: activeCase === i ? "#fff" : muted,
                border: `1px solid ${activeCase === i ? primary : border}`,
                boxShadow:
                  activeCase === i
                    ? `0 2px 10px rgba(37,99,235,0.28)`
                    : "0 1px 2px rgba(0,0,0,0.04)",
                transition: "all 0.2s",
              }}
            >
              {c.tab}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ padding: 48, backgroundColor: "#fff" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: primary,
                marginBottom: 16,
              }}
            >
              {CASES[activeCase].tab}
            </p>
            <h3
              style={{
                fontSize: 23,
                fontWeight: 800,
                marginBottom: 16,
                lineHeight: 1.35,
                color: text,
                letterSpacing: "-0.5px",
              }}
            >
              {CASES[activeCase].scenario}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: muted, marginBottom: 24 }}>
              {CASES[activeCase].solution}
            </p>
            <span
              style={{
                display: "inline-block",
                fontSize: 13,
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: `${accent}0f`,
                color: "#059669",
                border: `1px solid ${accent}25`,
              }}
            >
              {CASES[activeCase].impact}
            </span>
          </div>
          <div style={{ padding: 48, backgroundColor: surface, borderLeft: `1px solid ${border}` }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: muted,
                marginBottom: 24,
              }}
            >
              What happens
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {CASES[activeCase].steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: `${accent}12`,
                      border: `1px solid ${accent}28`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#059669",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 14, color: text, fontWeight: 500 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARE ──────────────────────────────────────────────────────── */}
      <section
        id="compare"
        style={{
          backgroundColor: surface,
          borderTop: `1px solid ${border}`,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
          <div style={{ marginBottom: 48 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: primary,
                marginBottom: 12,
              }}
            >
              Compare
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 46px)",
                fontWeight: 900,
                letterSpacing: "-1.5px",
                marginBottom: 12,
              }}
            >
              The &ldquo;Connector-Approved&rdquo; difference.
            </h2>
            <p style={{ fontSize: 16, color: muted, maxWidth: 680 }}>
              Unify finds contacts. Vieu enriches them. Commsor maps community. WarmBlue routes
              every message through your team&rsquo;s real relationships — then puts a human in the
              loop for approval.
            </p>
          </div>

          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${border}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              backgroundColor: "#fff",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: surface, borderBottom: `1px solid ${border}` }}>
                  {["Capability", "WarmBlue", "Unify", "Vieu", "Commsor"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "16px 24px",
                        textAlign: i === 0 ? "left" : "center",
                        fontWeight: 700,
                        fontSize: 12,
                        color: i === 1 ? primary : text,
                      }}
                    >
                      {h}
                      {i === 1 && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            marginLeft: 6,
                            padding: "2px 6px",
                            borderRadius: 99,
                            backgroundColor: `${primary}12`,
                            color: primary,
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Team-wide relationship graph", "yes", "no", "no", "partial"],
                    ["Warm intro path routing", "yes", "no", "no", "no"],
                    ["Connector approval (human-in-the-loop)", "yes", "no", "partial", "partial"],
                    ["Real-time buying signals (13+ types)", "yes", "yes", "no", "no"],
                    ["AI-drafted personalisation", "yes", "yes", "yes", "no"],
                    ["Relationship-strength scoring", "yes", "no", "partial", "yes"],
                    ["Multi-channel send (WA / Phone / LI)", "yes", "yes", "no", "no"],
                    ["Enterprise security & compliance", "yes", "yes", "yes", "yes"],
                  ] as const
                ).map(([feat, ...vals], ri) => (
                  <tr
                    key={ri}
                    style={{
                      borderBottom: `1px solid ${border}`,
                      backgroundColor: ri % 2 === 0 ? "#fff" : "#fafbfc",
                    }}
                  >
                    <td style={{ padding: "14px 24px", color: text, fontWeight: 500 }}>{feat}</td>
                    {vals.map((v, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: "14px 24px",
                          textAlign: "center",
                          backgroundColor: ci === 0 ? `${primary}04` : "transparent",
                        }}
                      >
                        {v === "yes" ? (
                          <Check
                            size={16}
                            style={{ margin: "0 auto", color: ci === 0 ? accent : "#94a3b8" }}
                          />
                        ) : v === "partial" ? (
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 999,
                              color: "#d97706",
                              backgroundColor: "rgba(245,158,11,0.10)",
                              border: "1px solid rgba(245,158,11,0.28)",
                            }}
                          >
                            Partial
                          </span>
                        ) : (
                          <Minus size={16} style={{ margin: "0 auto", color: "#e2e8f0" }} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ───────────────────────────────────────────────── */}
      <section id="roi" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: primary,
              marginBottom: 12,
            }}
          >
            ROI calculator
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 46px)",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              marginBottom: 12,
            }}
          >
            Your revenue potential.
          </h2>
          <p style={{ fontSize: 16, color: muted, maxWidth: 560 }}>
            Adjust team size and deal size for each persona — see the impact simultaneously.
          </p>
        </div>
        <ROICalc />
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: `linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #7c3aed 100%)`,
          padding: "100px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.65)",
              marginBottom: 20,
            }}
          >
            Start today
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 58px)",
              fontWeight: 900,
              letterSpacing: "-2px",
              marginBottom: 20,
              color: "#fff",
              lineHeight: 1.08,
            }}
          >
            Ready to activate
            <br />
            warm paths?
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.72)",
              marginBottom: 40,
              maxWidth: 420,
              margin: "0 auto 40px",
            }}
          >
            Start free. No credit card. Full access for 14 days.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 15,
              fontWeight: 700,
              padding: "16px 36px",
              borderRadius: 12,
              backgroundColor: "#fff",
              color: primary,
              textDecoration: "none",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            Start your free trial <ArrowRight size={18} />
          </Link>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 20 }}>
            No credit card · 14-day free trial · Cancel anytime
          </p>
          <a
            href="#"
            style={{
              display: "inline-block",
              marginTop: 16,
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.70)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,1)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
          >
            or book a 20-min demo →
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${border}`, backgroundColor: surface }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "40px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                color: text,
              }}
            >
              <Logo size={22} />
              <span style={{ fontSize: 16, fontWeight: 800 }}>WarmBlue</span>
            </div>
            <p style={{ fontSize: 12, color: muted }}>© 2026 WarmBlue. All rights reserved.</p>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {["Docs", "Security", "Privacy", "Status"].map((l) => (
              <a
                key={l}
                href="#"
                style={{ fontSize: 12, color: muted, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
