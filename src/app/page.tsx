"use client";

import { ArrowRight, Check, Minus, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";

// ─── Animated counter ───────────────────────────────────────────────────────
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

// ─── Intersection observer (fires once) ────────────────────────────────────
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

// ─── Typewriter ─────────────────────────────────────────────────────────────
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

// ─── Live demo card (cycles paths) ─────────────────────────────────────────
const PATHS = [
  {
    company: "Stripe CTO evaluation",
    acv: "$500k ACV",
    hops: "1-hop",
    warmth: 94,
    path: "You → James Liu (ex-Rippling) → CTO",
    status: "Approved",
  },
  {
    company: "Databricks VP Sales",
    acv: "$320k ACV",
    hops: "2-hop",
    warmth: 88,
    path: "You → Maria Chen → Alex Park → VP Sales",
    status: "Pending",
  },
  {
    company: "OpenAI Head of Eng",
    acv: "$800k ACV",
    hops: "1-hop",
    warmth: 91,
    path: "You → Kevin Zhang (ex-Google) → HoE",
    status: "Approved",
  },
];

function DemoCard({
  surface,
  border,
  text,
  muted,
  accent,
  primary,
}: {
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  primary: string;
}) {
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
      className="rounded-2xl p-6"
      style={{ background: "#f0f0f2", border: `1px solid ${border}` }}
    >
      {/* Live badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
        <span className="text-[11px] font-medium" style={{ color: muted }}>
          Live warm path engine
        </span>
      </div>

      {/* Path card */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{
          backgroundColor: surface,
          border: `1px solid ${border}`,
          opacity: fade ? 1 : 0,
          transform: fade ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[13px] font-semibold" style={{ color: text }}>
              {p.company}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: muted }}>
              {p.acv} opportunity
            </p>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-md"
            style={{
              backgroundColor: `${accent}18`,
              color: accent,
              border: `1px solid ${accent}35`,
            }}
          >
            {p.hops} path
          </span>
        </div>
        <div
          className="rounded-lg px-3 py-2 mb-3 flex items-center gap-2"
          style={{ backgroundColor: "#e8e8ea" }}
        >
          <span style={{ color: accent, fontSize: 12 }}>→</span>
          <span className="text-[12px]" style={{ color: text }}>
            {p.path}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: muted }}>
            Warmth {p.warmth} · Connector: {p.status}
          </span>
          <div className="flex gap-1">
            {PATHS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 14 : 5,
                  height: 5,
                  backgroundColor: i === idx ? primary : border,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: "1,240", l: "Prospects mapped" },
          { v: "847", l: "Warm paths found" },
          { v: "1.2 hops", l: "Avg path length" },
          { v: "99%", l: "Approval rate" },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-lg p-3"
            style={{ backgroundColor: surface, border: `1px solid ${border}` }}
          >
            <p className="text-[15px] font-bold" style={{ color: primary }}>
              {m.v}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: muted }}>
              {m.l}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated stats bar ──────────────────────────────────────────────────────
function StatsBar({
  surface,
  border,
  text,
  muted,
  accent,
}: {
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
}) {
  const { ref, seen } = useInView(0.2);
  const v1 = useCountUp(47, 1400, seen);
  const v2 = useCountUp(18, 1200, seen);
  const v3 = useCountUp(60, 1400, seen);
  return (
    <div
      ref={ref}
      className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-2xl p-8"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
    >
      {[
        { value: "3.2×", label: "higher reply rate vs cold email", src: "industry data" },
        { value: `${v1}%`, label: "reply rate on warm intros", src: "HubSpot research" },
        { value: `${v2}d`, label: "faster deal cycle", src: "customer average" },
        { value: `${v3}%`, label: "reduction in cold spend", src: "customer report" },
      ].map((s, i) => (
        <div key={i} className="pl-5 border-l" style={{ borderColor: border }}>
          <p className="text-[36px] font-bold leading-none mb-1" style={{ color: accent }}>
            {s.value}
          </p>
          <p className="text-[13px] font-medium mb-1" style={{ color: text }}>
            {s.label}
          </p>
          <p className="text-[11px]" style={{ color: muted }}>
            {s.src}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Use cases tabs ──────────────────────────────────────────────────────────
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

// ─── ROI calculator ──────────────────────────────────────────────────────────
type Persona = "ae" | "director" | "revops";

const PERSONA_PRESETS: Record<
  Persona,
  { aes: number; acv: number; label: string; description: string }
> = {
  ae: {
    aes: 1,
    acv: 80,
    label: "Account Executive",
    description: "Personal quota lift from warm intros vs cold outbound.",
  },
  director: {
    aes: 12,
    acv: 120,
    label: "Sales Director",
    description: "Team-wide pipeline lift and cold-spend reduction across reps.",
  },
  revops: {
    aes: 30,
    acv: 90,
    label: "RevOps",
    description: "Network-driven pipeline efficiency and shortened sales cycle.",
  },
};

function ROICalc({
  surface,
  border,
  text,
  muted,
  primary,
  accent,
}: {
  surface: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  accent: string;
}) {
  const [persona, setPersona] = useState<Persona>("ae");
  const [aes, setAes] = useState(PERSONA_PRESETS.ae.aes);
  const [acv, setAcv] = useState(PERSONA_PRESETS.ae.acv);

  const switchPersona = (p: Persona) => {
    setPersona(p);
    setAes(PERSONA_PRESETS[p].aes);
    setAcv(PERSONA_PRESETS[p].acv);
  };

  // Shared math
  const addARR = Math.round(aes * acv * 1000 * 0.032 * 3);
  const payback = Math.max(6, Math.round(14 - aes / 6));
  const roi = (Math.round((addARR / Math.max(aes * 3600, 1)) * 10) / 10).toFixed(1);
  const coldSpendSaved = Math.round(aes * 18); // $k saved/yr
  const cycleDays = Math.max(8, 18 - Math.floor(aes / 3));
  const pipelineLift = Math.round((addARR * 2.4) / 1000); // pipeline $k

  // Persona-specific output triplet
  const outputs =
    persona === "ae"
      ? [
          {
            label: "Additional ARR (personal)",
            value: `+$${(addARR / 1000).toFixed(0)}K`,
            color: primary,
          },
          { label: "Payback period", value: `${payback} wks`, color: accent },
          { label: "Year-1 ROI", value: `${roi}×`, color: accent },
        ]
      : persona === "director"
        ? [
            { label: "Team ARR lift", value: `+$${(addARR / 1000).toFixed(0)}K`, color: primary },
            { label: "Cold spend saved /yr", value: `$${coldSpendSaved}K`, color: accent },
            { label: "Reply-rate uplift", value: `3.2×`, color: accent },
          ]
        : [
            { label: "Pipeline lift /yr", value: `+$${pipelineLift}K`, color: primary },
            { label: "Avg cycle reduction", value: `${cycleDays}d faster`, color: accent },
            { label: "Network-sourced %", value: `${Math.min(72, 40 + aes)}%`, color: accent },
          ];

  const sliderLabel =
    persona === "ae"
      ? "Your monthly target accounts"
      : persona === "director"
        ? "Account Executives on team"
        : "AEs across org";

  const sliderMin = persona === "ae" ? 1 : persona === "director" ? 3 : 8;
  const sliderMax = persona === "ae" ? 25 : persona === "director" ? 40 : 120;

  return (
    <div
      className="rounded-2xl p-8 md:p-10"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
    >
      {/* Persona switcher */}
      <div className="mb-8">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3"
          style={{ color: muted }}
        >
          I am a&hellip;
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERSONA_PRESETS) as Persona[]).map((p) => {
            const active = p === persona;
            return (
              <button
                key={p}
                type="button"
                onClick={() => switchPersona(p)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "9px 18px",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: active ? primary : "#e8e8ea",
                  color: active ? "#fff" : text,
                  border: `1px solid ${active ? primary : border}`,
                }}
              >
                {PERSONA_PRESETS[p].label}
              </button>
            );
          })}
        </div>
        <p className="text-[12px] mt-3" style={{ color: muted }}>
          {PERSONA_PRESETS[persona].description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Sliders */}
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-[14px] font-medium" style={{ color: text }}>
                {sliderLabel}
              </label>
              <span className="text-[20px] font-bold" style={{ color: primary }}>
                {aes}
              </span>
            </div>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              value={aes}
              onChange={(e) => setAes(+e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: primary }}
            />
            <div className="flex justify-between text-[11px] mt-1" style={{ color: muted }}>
              <span>{sliderMin}</span>
              <span>{sliderMax}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-[14px] font-medium" style={{ color: text }}>
                Average deal size
              </label>
              <span className="text-[20px] font-bold" style={{ color: primary }}>
                ${acv}k
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={500}
              value={acv}
              onChange={(e) => setAcv(+e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: primary }}
            />
            <div className="flex justify-between text-[11px] mt-1" style={{ color: muted }}>
              <span>$20k</span>
              <span>$500k</span>
            </div>
          </div>
        </div>

        {/* Outputs */}
        <div className="grid grid-cols-3 gap-4 content-center">
          {outputs.map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-5 text-center"
              style={{
                backgroundColor: "#e8e8ea",
                border: `1px solid ${border}`,
              }}
            >
              <p className="text-[24px] font-bold leading-none mb-1" style={{ color: m.color }}>
                {m.value}
              </p>
              <p className="text-[11px]" style={{ color: muted }}>
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[14px] font-semibold px-8 py-3.5 rounded-xl transition-opacity hover:opacity-90"
          style={{ backgroundColor: primary, color: "#fff" }}
        >
          See full ROI model <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeCase, setActiveCase] = useState(0);

  const bg = "#fafafa";
  const surface = "#f0f0f2";
  const border = "#e0e0e3";
  const text = "#111111";
  const muted = "#666";
  const primary = "#2563eb";
  const accent = "#10b981";

  return (
    <div
      style={{
        backgroundColor: bg,
        color: text,
        minHeight: "100vh",
      }}
    >
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "rgba(250,250,250,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
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
            aria-label="WarmBlue home"
          >
            <Logo size={26} />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>WarmBlue</span>
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
                style={{
                  fontSize: 13,
                  color: muted,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
              >
                {label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/login" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>
              Sign in
            </Link>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: primary,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "140px 24px 80px" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
        >
          {/* Left */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: `${primary}12`,
                border: `1px solid ${primary}25`,
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: accent,
                  display: "inline-block",
                  animation: "pulse 2s ease infinite",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: primary }}>
                Beta · 500+ revenue teams
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(40px, 5vw, 64px)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
                marginBottom: 24,
              }}
            >
              Activate your <br />
              <Typewriter color={accent} /> for
              <br />
              revenue.
            </h1>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: muted,
                maxWidth: 480,
                marginBottom: 36,
              }}
            >
              Map warm paths to every decision maker on your target accounts. AI-drafted intros,
              human-approved. Close more deals through relationships — not cold outreach.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "14px 28px",
                  borderRadius: 10,
                  backgroundColor: primary,
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                Start free trial <ArrowRight size={16} />
              </Link>
              <a
                href="#usecases"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "14px 24px",
                  borderRadius: 10,
                  backgroundColor: surface,
                  color: text,
                  textDecoration: "none",
                  border: `1px solid ${border}`,
                }}
              >
                <Play size={13} /> See how it works
              </a>
            </div>
            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex" }}>
                {["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: c,
                      border: `2px solid ${bg}`,
                      marginLeft: i ? -8 : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {["SC", "MK", "JL", "AR", "TN"][i]}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: muted }}>
                Used by 500+ revenue teams at Series B+ companies
              </p>
            </div>
          </div>

          {/* Right — animated demo */}
          <DemoCard
            surface={surface}
            border={border}
            text={text}
            muted={muted}
            accent={accent}
            primary={primary}
          />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto 96px", padding: "0 24px" }}>
        <StatsBar surface={surface} border={border} text={text} muted={muted} accent={accent} />
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto 120px", padding: "0 24px" }}>
        <div style={{ marginBottom: 56 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: primary,
              marginBottom: 12,
            }}
          >
            How it works
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              marginBottom: 12,
            }}
          >
            From cold list to warm intro in 3 steps.
          </h2>
          <p style={{ fontSize: 16, color: muted, maxWidth: 560 }}>
            No magic. Real BFS pathfinding across your team's real relationship data.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            {
              n: "01",
              icon: "⬡",
              title: "Map your relationship graph",
              body: "Connect email, LinkedIn, and CRM. WarmBlue builds a real graph of every relationship across your team — scored by warmth, recency, and mutual connections.",
            },
            {
              n: "02",
              icon: "→",
              title: "Find warm paths to any buyer",
              body: "Upload your target list. BFS pathfinding surfaces the shortest warm path to every decision maker — ranked by warmth score. 847 paths in under 10 seconds.",
            },
            {
              n: "03",
              icon: "✓",
              title: "Get intros approved instantly",
              body: "AI drafts the intro. The connector reviews it — one click to approve or edit. Every message goes through a human. No cold outreach. Ever.",
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                borderRadius: 16,
                padding: 32,
                backgroundColor: surface,
                border: `1px solid ${border}`,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${primary}12`,
                  border: `1px solid ${primary}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: primary,
                  marginBottom: 24,
                }}
              >
                {s.icon}
              </div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: muted,
                  marginBottom: 8,
                }}
              >
                Step {s.n}
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: muted }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── USE CASES ────────────────────────────────────────────────────── */}
      <section id="usecases" style={{ maxWidth: 1280, margin: "0 auto 120px", padding: "0 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: primary,
              marginBottom: 12,
            }}
          >
            Use cases
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              marginBottom: 12,
            }}
          >
            Built for your revenue playbook.
          </h2>
          <p style={{ fontSize: 16, color: muted }}>
            From AEs to RevOps — warm paths unlock different levers at every level.
          </p>
        </div>
        {/* Tab pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {CASES.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveCase(i)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 18px",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeCase === i ? primary : surface,
                color: activeCase === i ? "#fff" : muted,
                border: `1px solid ${activeCase === i ? primary : border}`,
              }}
            >
              {c.tab}
            </button>
          ))}
        </div>
        {/* Content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${border}`,
          }}
        >
          <div style={{ padding: 48, backgroundColor: surface }}>
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
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, lineHeight: 1.4 }}>
              {CASES[activeCase].scenario}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: muted, marginBottom: 24 }}>
              {CASES[activeCase].solution}
            </p>
            <span
              style={{
                display: "inline-block",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor: `${accent}12`,
                color: accent,
                border: `1px solid ${accent}25`,
              }}
            >
              {CASES[activeCase].impact}
            </span>
          </div>
          <div style={{ padding: 48, backgroundColor: "#e8e8ea" }}>
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
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: `${accent}18`,
                      border: `1px solid ${accent}35`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={13} color={accent} />
                  </div>
                  <span style={{ fontSize: 14, color: text }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARE ──────────────────────────────────────────────────────── */}
      <section id="compare" style={{ maxWidth: 1280, margin: "0 auto 120px", padding: "0 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: primary,
              marginBottom: 12,
            }}
          >
            Compare
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              marginBottom: 12,
            }}
          >
            The &ldquo;Connector-Approved&rdquo; difference.
          </h2>
          <p style={{ fontSize: 16, color: muted, maxWidth: 680 }}>
            Unify finds contacts. Vieu enriches them. Commsor maps community. WarmBlue routes every
            message through your team&rsquo;s real relationships — then puts a human in the loop for
            approval.
          </p>
        </div>
        <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: surface, borderBottom: `1px solid ${border}` }}>
                {["Capability", "WarmBlue", "Unify", "Vieu", "Commsor"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "16px 24px",
                      textAlign: i === 0 ? "left" : "center",
                      fontWeight: 600,
                      color: i === 1 ? primary : text,
                    }}
                  >
                    {h}
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
                    backgroundColor:
                      ri % 2 === 0 ? "transparent" : "#f5f5f708",
                  }}
                >
                  <td style={{ padding: "14px 24px", color: text }}>{feat}</td>
                  {vals.map((v, ci) => (
                    <td key={ci} style={{ padding: "14px 24px", textAlign: "center" }}>
                      {v === "yes" ? (
                        <Check
                          size={16}
                          style={{ margin: "0 auto", color: ci === 0 ? accent : muted }}
                        />
                      ) : v === "partial" ? (
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 999,
                            color: "#f59e0b",
                            backgroundColor: "rgba(245,158,11,0.12)",
                            border: "1px solid rgba(245,158,11,0.3)",
                          }}
                        >
                          Partial
                        </span>
                      ) : (
                        <Minus
                          size={16}
                          style={{ margin: "0 auto", color: "#d0d0d4" }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── ROI CALCULATOR ───────────────────────────────────────────────── */}
      <section id="roi" style={{ maxWidth: 1280, margin: "0 auto 120px", padding: "0 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: primary,
              marginBottom: 12,
            }}
          >
            ROI calculator
          </p>
          <h2
            style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.5px" }}
          >
            Your revenue potential.
          </h2>
        </div>
        <ROICalc
          surface={surface}
          border={border}
          text={text}
          muted={muted}
          primary={primary}
          accent={accent}
        />
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        style={{ maxWidth: 800, margin: "0 auto 120px", padding: "0 24px", textAlign: "center" }}
      >
        <h2
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-1px",
            marginBottom: 20,
            lineHeight: 1.1,
          }}
        >
          Ready to activate
          <br />
          warm paths?
        </h2>
        <p style={{ fontSize: 17, color: muted, marginBottom: 36 }}>
          Start free. No credit card. Full access for 14 days.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 700,
            padding: "16px 36px",
            borderRadius: 12,
            backgroundColor: primary,
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Start your free trial <ArrowRight size={18} />
        </Link>
        <p style={{ fontSize: 12, color: muted, marginTop: 16 }}>
          No credit card · 14-day free trial · Cancel anytime
        </p>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${border}`, backgroundColor: surface }}>
        <div
          style={{
            maxWidth: 1280,
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
              <span style={{ fontSize: 16, fontWeight: 700 }}>WarmBlue</span>
            </div>
            <p style={{ fontSize: 12, color: muted }}>© 2026 WarmBlue. All rights reserved.</p>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Docs", "Security", "Privacy", "Status"].map((l) => (
              <a key={l} href="#" style={{ fontSize: 12, color: muted, textDecoration: "none" }}>
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
