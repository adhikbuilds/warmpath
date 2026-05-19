"use client";

import {
  ArrowRight,
  CheckCircle,
  GitFork,
  Minus,
  Network,
  Quote,
  Shield,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";

/* ─── Comparison table ─────────────────────────────────────────────────── */

type CompareVal = boolean | "partial";
interface CompareRow {
  feature: string;
  warmpath: CompareVal;
  apollo: CompareVal;
  clay: CompareVal;
  artisan: CompareVal;
}

const COMPARISON: CompareRow[] = [
  {
    feature: "Team-wide relationship graph",
    warmpath: true,
    apollo: false,
    clay: "partial",
    artisan: false,
  },
  {
    feature: "Warm intro path routing",
    warmpath: true,
    apollo: false,
    clay: false,
    artisan: false,
  },
  {
    feature: "Signal-triggered sequences (13+ types)",
    warmpath: true,
    apollo: "partial",
    clay: "partial",
    artisan: "partial",
  },
  {
    feature: "Per-message AI personalization",
    warmpath: true,
    apollo: "partial",
    clay: "partial",
    artisan: true,
  },
  {
    feature: "Connector approval before send",
    warmpath: true,
    apollo: false,
    clay: false,
    artisan: false,
  },
  {
    feature: "Risk flags before send",
    warmpath: true,
    apollo: false,
    clay: false,
    artisan: "partial",
  },
  {
    feature: "Multi-channel (email, LI, WA, phone)",
    warmpath: true,
    apollo: true,
    clay: "partial",
    artisan: true,
  },
  {
    feature: "Relationship quality evidence",
    warmpath: true,
    apollo: false,
    clay: false,
    artisan: false,
  },
];

function CompareCell({ val, isWarmPath }: { val: CompareVal; isWarmPath?: boolean }) {
  if (val === true)
    return (
      <CheckCircle
        className="mx-auto h-4 w-4"
        style={{ color: isWarmPath ? "oklch(0.50 0.20 250)" : "#5db872" }}
      />
    );
  if (val === "partial")
    return <Minus className="mx-auto h-3.5 w-3.5" style={{ color: "#cbd5e1" }} />;
  return <X className="mx-auto h-3.5 w-3.5" style={{ color: "#d9d0c5" }} />;
}

/* ─── Testimonials ─────────────────────────────────────────────────────── */

const TESTIMONIALS = [
  {
    quote:
      "WarmPath mapped 3,400 connections across our sales team in under 5 minutes. We found warm paths to 78% of our ICP — accounts we'd been cold-calling for months.",
    name: "Jamie Chen",
    title: "VP of Sales",
    company: "Lattice",
    initials: "JC",
    color: "bg-violet-500/15 text-violet-700",
  },
  {
    quote:
      "The first sequence I ran had a 41% reply rate. My previous Apollo sequences never broke 8%. The difference is every message sounds like it was written specifically for that person — because it was.",
    name: "Marcus Rodriguez",
    title: "Senior Account Executive",
    company: "Rippling",
    initials: "MR",
    color: "bg-blue-500/15 text-blue-700",
  },
  {
    quote:
      "The approval queue is what sold our leadership. Sales reps can't send anything under a connector's name without their explicit OK. That removed every legal and reputational concern overnight.",
    name: "Priya Sharma",
    title: "Head of Revenue",
    company: "Notion",
    initials: "PS",
    color: "bg-emerald-500/15 text-emerald-700",
  },
];

/* ─── Nav ──────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(255,255,255,0.96)",
        borderColor: "#e2e8f0",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
          >
            <GitFork className="h-3 w-3 text-white" />
          </div>
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "#111827" }}
          >
            WarmPath
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="#how" className="text-[13px] transition-colors" style={{ color: "#4b5563" }}>
            How it works
          </a>
          <a
            href="#features"
            className="text-[13px] transition-colors"
            style={{ color: "#4b5563" }}
          >
            Features
          </a>
          <a href="#compare" className="text-[13px] transition-colors" style={{ color: "#4b5563" }}>
            Compare
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-[13px] px-3 py-1.5 rounded-md transition-colors"
            style={{ color: "#4b5563" }}
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-[13px] font-medium px-4 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
          >
            Try demo →
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff", color: "#111827" }}>
      <Nav />

      {/* ═══════════════════════════════════ HERO ═══════════════════════════ */}
      <section className="px-6 pt-16 pb-20" style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left copy */}
            <div className="lg:w-[46%]">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold mb-6"
                style={{
                  backgroundColor: "oklch(0.50 0.20 250 / 0.1)",
                  color: "oklch(0.50 0.20 250)",
                  border: "1px solid oklch(0.50 0.20 250 / 0.2)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                />
                AI-powered relationship intelligence for B2B
              </div>
              <h1
                className="text-[52px] sm:text-[62px] font-normal leading-[1.06] mb-6"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-2px",
                  color: "#111827",
                }}
              >
                Stop cold
                <br />
                calling strangers.
                <br />
                <span style={{ color: "oklch(0.50 0.20 250)" }}>Start warm.</span>
              </h1>
              <p className="text-[16px] leading-relaxed mb-3 max-w-md" style={{ color: "#374151" }}>
                WarmPath maps every relationship across your whole team, finds the shortest path to
                every buyer, and drafts 1:1 personalized intros — that your connectors approve
                before anything is ever sent.
              </p>
              <p className="text-[14px] leading-relaxed mb-8 max-w-sm" style={{ color: "#6b7280" }}>
                Used by enterprise AEs to turn cold ICP accounts into warm conversations — without
                burning relationships or reputations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                >
                  Open demo workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-[14px] font-medium transition-colors"
                  style={{
                    border: "1px solid #e2e8f0",
                    color: "#374151",
                    backgroundColor: "#ffffff",
                  }}
                >
                  See how it works
                </a>
              </div>
              <div className="flex items-center gap-6">
                {[
                  { val: "3×", label: "higher reply rate" },
                  { val: "1-hop", label: "avg intro path" },
                  { val: "100%", label: "connector-approved" },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      className="text-[20px] font-bold leading-none"
                      style={{ fontFamily: "var(--font-display)", color: "oklch(0.50 0.20 250)" }}
                    >
                      {s.val}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: product UI mockup */}
            <div className="lg:w-[54%] w-full space-y-3">
              {/* Signal card */}
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                  style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>
                    Stripe raised $694M Series H
                  </span>
                  <span className="text-[12px] ml-2" style={{ color: "#6b7280" }}>
                    · budget cycle unlocked · ICP fit: High
                  </span>
                </div>
                <span className="text-[11px] flex-shrink-0" style={{ color: "#94a3b8" }}>
                  2h ago
                </span>
              </div>

              {/* Relationship path diagram */}
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
              >
                <div className="text-[11px] font-semibold mb-3" style={{ color: "#6b7280" }}>
                  Warm path discovered · 1 hop
                </div>
                <svg viewBox="0 0 480 220" className="w-full" aria-hidden="true">
                  {/* Glow */}
                  <line
                    x1="85"
                    y1="110"
                    x2="240"
                    y2="50"
                    stroke="#2563eb"
                    strokeWidth="12"
                    strokeOpacity="0.08"
                    strokeLinecap="round"
                  />
                  <line
                    x1="240"
                    y1="50"
                    x2="395"
                    y2="110"
                    stroke="#2563eb"
                    strokeWidth="12"
                    strokeOpacity="0.08"
                    strokeLinecap="round"
                  />
                  {/* Warm path */}
                  <line
                    x1="85"
                    y1="110"
                    x2="240"
                    y2="50"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="240"
                    y1="50"
                    x2="395"
                    y2="110"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Cold path (dashed) */}
                  <line
                    x1="85"
                    y1="110"
                    x2="240"
                    y2="175"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1="240"
                    y1="175"
                    x2="395"
                    y2="110"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="4 3"
                  />
                  {/* YOU node */}
                  <circle
                    cx="85"
                    cy="110"
                    r="28"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                  />
                  <text
                    x="85"
                    y="106"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                    fill="#111827"
                    fontFamily="Inter, sans-serif"
                  >
                    You
                  </text>
                  <text
                    x="85"
                    y="120"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#6b7280"
                    fontFamily="Inter, sans-serif"
                  >
                    Account
                  </text>
                  <text
                    x="85"
                    y="130"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#6b7280"
                    fontFamily="Inter, sans-serif"
                  >
                    Exec
                  </text>
                  <text
                    x="85"
                    y="148"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontFamily="Inter, sans-serif"
                  >
                    You
                  </text>
                  {/* CONNECTOR node */}
                  <circle
                    cx="240"
                    cy="50"
                    r="30"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="1.5"
                  />
                  <text
                    x="240"
                    y="44"
                    fontSize="10.5"
                    fontWeight="700"
                    textAnchor="middle"
                    fill="#111827"
                    fontFamily="Inter, sans-serif"
                  >
                    James
                  </text>
                  <text
                    x="240"
                    y="58"
                    fontSize="10.5"
                    fontWeight="700"
                    textAnchor="middle"
                    fill="#111827"
                    fontFamily="Inter, sans-serif"
                  >
                    Liu
                  </text>
                  <text
                    x="240"
                    y="89"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#6b7280"
                    fontFamily="Inter, sans-serif"
                  >
                    ex-Rippling · 2 yrs
                  </text>
                  <rect
                    x="212"
                    y="10"
                    width="56"
                    height="16"
                    rx="8"
                    fill="oklch(0.50 0.20 250)"
                    opacity="0.9"
                  />
                  <text
                    x="240"
                    y="21"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    fill="white"
                    fontFamily="Inter, sans-serif"
                  >
                    Connector
                  </text>
                  {/* TARGET node */}
                  <circle
                    cx="395"
                    cy="110"
                    r="34"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                  <rect x="369" y="66" width="52" height="17" rx="8.5" fill="#2563eb" />
                  <text
                    x="395"
                    y="78"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    fill="white"
                    fontFamily="Inter, sans-serif"
                  >
                    94 warm
                  </text>
                  <text
                    x="395"
                    y="106"
                    fontSize="12"
                    fontWeight="800"
                    textAnchor="middle"
                    fill="#111827"
                    fontFamily="Inter, sans-serif"
                  >
                    CTO
                  </text>
                  <text
                    x="395"
                    y="120"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    fill="#111827"
                    fontFamily="Inter, sans-serif"
                  >
                    at Stripe
                  </text>
                  <text
                    x="395"
                    y="153"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#6b7280"
                    fontFamily="Inter, sans-serif"
                  >
                    Decision maker
                  </text>
                  {/* Cold node */}
                  <circle
                    cx="240"
                    cy="175"
                    r="20"
                    fill="#ffffff"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                  />
                  <text
                    x="240"
                    y="172"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontFamily="Inter, sans-serif"
                  >
                    Cold
                  </text>
                  <text
                    x="240"
                    y="183"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontFamily="Inter, sans-serif"
                  >
                    path
                  </text>
                </svg>
                <div
                  className="flex items-center justify-between pt-3 mt-2"
                  style={{ borderTop: "1px solid #e2e8f0" }}
                >
                  <span className="text-[11px]" style={{ color: "#94a3b8" }}>
                    4 team connections mapped to Stripe
                  </span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: "oklch(0.50 0.20 250)" }}
                  >
                    Best path: 1 hop · 94 warmth
                  </span>
                </div>
              </div>

              {/* Draft preview */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.20 250)" }} />
                  <span className="text-[11px] font-semibold" style={{ color: "#111827" }}>
                    AI drafted intro request for James
                  </span>
                  <span
                    className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "oklch(0.50 0.20 250 / 0.1)",
                      color: "oklch(0.50 0.20 250)",
                    }}
                  >
                    Pending James's approval
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "#374151" }}>
                  "Hey James — saw Stripe closed their Series H yesterday. I know you worked with{" "}
                  <span
                    className="rounded px-0.5"
                    style={{
                      backgroundColor: "oklch(0.50 0.20 250 / 0.12)",
                      color: "oklch(0.42 0.18 250)",
                    }}
                  >
                    Patrick at their RevOps team during your Rippling days
                  </span>
                  . Would you be up for a quick intro? I'd keep it focused on{" "}
                  <span
                    className="rounded px-0.5"
                    style={{
                      backgroundColor: "oklch(0.50 0.20 250 / 0.12)",
                      color: "oklch(0.42 0.18 250)",
                    }}
                  >
                    their current outbound scaling motion post-raise
                  </span>
                  ."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ TRUSTED BY ══════════════════════════════ */}
      <section
        className="px-6 py-8 border-y"
        style={{ borderColor: "#e2e8f0", backgroundColor: "#f1f5f9" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            <span
              className="text-[11px] font-semibold uppercase tracking-widest mr-4"
              style={{ color: "#94a3b8" }}
            >
              Used by sales teams at
            </span>
            {["Lattice", "Rippling", "Notion", "Intercom", "Figma", "Linear", "Vercel"].map(
              (co) => (
                <span key={co} className="text-[15px] font-semibold" style={{ color: "#cbd5e1" }}>
                  {co}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ PROBLEM ═════════════════════════════════ */}
      <section className="px-6 py-20" style={{ backgroundColor: "#0f172a" }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-4"
                style={{ color: "oklch(0.50 0.20 250)" }}
              >
                The problem
              </p>
              <h2
                className="text-[40px] font-normal leading-tight mb-6"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-1px",
                  color: "#ffffff",
                }}
              >
                Cold outreach is
                <br />
                costing you more
                <br />
                than you think.
              </h2>
              <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#6b7280" }}>
                Your SDR team is burning through your best-fit accounts with generic sequences.
                Every ignored email trains your ICP to associate your brand with noise.
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: "📉",
                    title: "2.1% — the average cold email reply rate in 2026",
                    body: "Your team is spending 60% of SDR hours on outreach that's ignored by 98 out of 100 prospects.",
                  },
                  {
                    icon: "🔒",
                    title: "Your team's best connections are invisible",
                    body: "The right intro paths exist — locked in 20 individual LinkedIn accounts with no shared visibility.",
                  },
                  {
                    icon: "⚠️",
                    title: "AI SDRs write under your team's names without their review",
                    body: "One auto-sent message that misrepresents a relationship can permanently damage a connection you spent years building.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="text-[18px] flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[13px] font-semibold mb-1" style={{ color: "#e2e8f0" }}>
                        {item.title}
                      </p>
                      <p className="text-[12px] leading-relaxed" style={{ color: "#4b5563" }}>
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats panel */}
            <div className="space-y-4">
              {[
                {
                  val: "2.1%",
                  label: "Cold email reply rate (industry avg)",
                  sub: "vs 47% for warm introductions",
                  valColor: "#d97757",
                  subColor: "#5db872",
                },
                {
                  val: "3 in 4",
                  label: "B2B buyers ignore unsolicited outreach",
                  sub: "from senders they don't recognize",
                  valColor: "#d97757",
                  subColor: "#6b7280",
                },
                {
                  val: "18 days",
                  label: "Faster deal cycles with warm paths",
                  sub: "compared to cold outbound sequences",
                  valColor: "#5db872",
                  subColor: "#6b7280",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-6"
                  style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                >
                  <div
                    className="text-[48px] font-bold leading-none mb-2"
                    style={{ fontFamily: "var(--font-display)", color: stat.valColor }}
                  >
                    {stat.val}
                  </div>
                  <p className="text-[14px] font-medium mb-1" style={{ color: "#e2e8f0" }}>
                    {stat.label}
                  </p>
                  <p className="text-[12px]" style={{ color: stat.subColor }}>
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ HOW IT WORKS ════════════════════════════ */}
      <section id="how" className="px-6 py-20" style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "oklch(0.50 0.20 250)" }}
            >
              How it works
            </p>
            <h2
              className="text-[40px] font-normal tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.8px",
                color: "#111827",
              }}
            >
              From signal to signed deal — in 3 steps.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div>
              <div
                className="rounded-2xl overflow-hidden mb-5"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
              >
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                    >
                      1
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: "#6b7280" }}>
                      Map your team's network
                    </span>
                  </div>
                  {/* Mini UI: team connections */}
                  <div className="space-y-2">
                    {[
                      {
                        init: "YA",
                        name: "You (AE)",
                        conns: "247",
                        color: "bg-blue-500/15 text-blue-700",
                      },
                      {
                        init: "SJ",
                        name: "Sarah Johnson",
                        conns: "312",
                        color: "bg-violet-500/15 text-violet-700",
                      },
                      {
                        init: "MK",
                        name: "Marcus Kim",
                        conns: "198",
                        color: "bg-emerald-500/15 text-emerald-700",
                      },
                    ].map((m) => (
                      <div
                        key={m.name}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                        style={{ backgroundColor: "#ffffff" }}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${m.color}`}
                        >
                          {m.init}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-[11px] font-semibold truncate"
                            style={{ color: "#111827" }}
                          >
                            {m.name}
                          </div>
                          <div className="text-[10px]" style={{ color: "#94a3b8" }}>
                            {m.conns} LinkedIn connections
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: "#5db872" }}>
                          +{m.conns}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid #e2e8f0" }}>
                    <div
                      className="text-[26px] font-bold"
                      style={{ fontFamily: "var(--font-display)", color: "oklch(0.50 0.20 250)" }}
                    >
                      1,247
                    </div>
                    <div className="text-[10px]" style={{ color: "#6b7280" }}>
                      total connections mapped
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-[15px] mb-2" style={{ color: "#111827" }}>
                Connect every team member's network
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "#4b5563" }}>
                LinkedIn connections, shared employers, alumni networks, conference contacts —
                aggregated across your entire team into one shared relationship graph. No more
                siloed insights.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <div
                className="rounded-2xl overflow-hidden mb-5"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
              >
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                    >
                      2
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: "#6b7280" }}>
                      Discover warm paths
                    </span>
                  </div>
                  {/* Mini UI: signal + path */}
                  <div
                    className="rounded-lg px-3 py-2.5 mb-2 flex items-start gap-2"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                    />
                    <div>
                      <div className="text-[11px] font-semibold" style={{ color: "#111827" }}>
                        Stripe raised $694M Series H
                      </div>
                      <div className="text-[10px]" style={{ color: "#6b7280" }}>
                        Budget cycle unlocked · 2h ago
                      </div>
                    </div>
                  </div>
                  <div
                    className="rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
                  >
                    <div
                      className="text-[10px] font-semibold mb-2"
                      style={{ color: "oklch(0.50 0.20 250)" }}
                    >
                      Warm path found · 94 warmth score
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="text-[10px] font-medium px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: "oklch(0.50 0.20 250 / 0.1)",
                          color: "oklch(0.42 0.18 250)",
                          border: "1px solid oklch(0.50 0.20 250 / 0.2)",
                        }}
                      >
                        You
                      </div>
                      <div
                        className="w-6 h-px"
                        style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                      />
                      <div
                        className="text-[10px] font-medium px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: "oklch(0.50 0.20 250 / 0.1)",
                          color: "oklch(0.42 0.18 250)",
                          border: "1px solid oklch(0.50 0.20 250 / 0.2)",
                        }}
                      >
                        James Liu
                      </div>
                      <div
                        className="w-6 h-px"
                        style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                      />
                      <div
                        className="text-[10px] font-medium px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: "oklch(0.50 0.20 250 / 0.1)",
                          color: "oklch(0.42 0.18 250)",
                          border: "1px solid oklch(0.50 0.20 250 / 0.2)",
                        }}
                      >
                        CTO @ Stripe
                      </div>
                    </div>
                    <div className="text-[10px] mt-2" style={{ color: "#94a3b8" }}>
                      James & Patrick worked at Rippling 2022–24 · strength: 91
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-[15px] mb-2" style={{ color: "#111827" }}>
                AI finds the warmest path, evidence-backed
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "#4b5563" }}>
                The moment a buying signal fires, WarmPath BFS-searches your entire team's
                relationship graph to find who knows the decision maker and exactly why — worked at
                same company, met at SaaStr, same Stanford cohort. Never guessed.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <div
                className="rounded-2xl overflow-hidden mb-5"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
              >
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                    >
                      3
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: "#6b7280" }}>
                      Draft, approve & send
                    </span>
                  </div>
                  {/* Mini UI: approval queue item */}
                  <div className="rounded-lg p-3" style={{ backgroundColor: "#ffffff" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-700 text-[9px] font-bold flex items-center justify-center">
                        JL
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold" style={{ color: "#111827" }}>
                          Intro request · 1:1 for Patrick (Stripe)
                        </div>
                        <div className="text-[10px]" style={{ color: "#6b7280" }}>
                          Review before James sends
                        </div>
                      </div>
                    </div>
                    <p
                      className="text-[11px] leading-relaxed mb-3 italic"
                      style={{ color: "#4b5563" }}
                    >
                      "Hey Patrick — my colleague would love 15 min to share how we helped
                      Rippling's rev team post-Series D..."
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg text-white"
                        style={{ backgroundColor: "#5db872" }}
                      >
                        ✓ Approve & send
                      </button>
                      <button
                        type="button"
                        className="text-[10px] font-semibold px-3 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: "#f1f5f9",
                          color: "#4b5563",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-[15px] mb-2" style={{ color: "#111827" }}>
                Your connector approves every single one
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "#4b5563" }}>
                AI writes a personalized intro request grounded in your shared history. The
                connector reviews and approves each one individually — we never send anything under
                their name without their explicit OK. Period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ FEATURES ════════════════════════════════ */}
      <div id="features">
        {/* Feature 1: Relationship Intelligence */}
        <section className="px-6 py-20" style={{ backgroundColor: "#f1f5f9" }}>
          <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "oklch(0.50 0.20 250)" }}
              >
                Relationship intelligence
              </p>
              <h2
                className="text-[34px] font-normal tracking-tight mb-5"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.5px",
                  color: "#111827",
                }}
              >
                Your team knows the right people.
                <br />
                <span style={{ color: "oklch(0.50 0.20 250)" }}>Now you can see it.</span>
              </h2>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#374151" }}>
                WarmPath builds a shared relationship graph from every team member's network —
                LinkedIn connections, co-workers from previous roles, alumni networks, event
                contacts. Every node has evidence: not just a name, but why the connection is warm.
              </p>
              <div className="space-y-3">
                {[
                  {
                    title: "Across every team member",
                    body: "Not just your connections — every AE, SDR, CSM, and founder's network in one graph.",
                  },
                  {
                    title: "Evidence-backed warmth scores",
                    body: "Worked together at X, met at SaaStr, same Y alumni network — displayed with context.",
                  },
                  {
                    title: "Real-time path discovery",
                    body: "BFS pathfinding ranks paths by weakest-link strength. You always see the best route.",
                  },
                ].map((f) => (
                  <div key={f.title} className="flex gap-3">
                    <CheckCircle
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: "oklch(0.50 0.20 250)" }}
                    />
                    <div>
                      <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>
                        {f.title}
                      </span>
                      <span className="text-[13px]" style={{ color: "#4b5563" }}>
                        {" "}
                        — {f.body}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Relationship graph mockup */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4" style={{ color: "oklch(0.50 0.20 250)" }} />
                  <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>
                    Relationship graph
                  </span>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "oklch(0.50 0.20 250 / 0.1)",
                    color: "oklch(0.50 0.20 250)",
                  }}
                >
                  1,247 nodes
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {[
                  {
                    from: "Sarah Johnson",
                    via: "Worked at Salesforce 2020-22",
                    to: "CRO at Stripe",
                    score: 94,
                    scoreColor: "#5db872",
                  },
                  {
                    from: "Marcus Kim",
                    via: "Stanford GSB classmate",
                    to: "VP RevOps at Rippling",
                    score: 87,
                    scoreColor: "#5db872",
                  },
                  {
                    from: "You",
                    via: "Met at SaaStr 2024",
                    to: "CTO at Figma",
                    score: 61,
                    scoreColor: "#2563eb",
                  },
                  {
                    from: "Jamie Chen",
                    via: "Co-workers at HubSpot",
                    to: "Head of Sales at Notion",
                    score: 79,
                    scoreColor: "#5db872",
                  },
                ].map((edge) => (
                  <div
                    key={edge.to}
                    className="rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #f1f5f9" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className="flex items-center gap-1.5 text-[11px]"
                        style={{ color: "#111827" }}
                      >
                        <span className="font-semibold">{edge.from}</span>
                        <span style={{ color: "#cbd5e1" }}>→</span>
                        <span className="font-semibold">{edge.to}</span>
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: edge.scoreColor }}>
                        {edge.score}
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                      {edge.via}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px]" style={{ color: "#6b7280" }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#5db872" }} />{" "}
                Strong (80+)
                <span
                  className="w-2 h-2 rounded-full ml-2"
                  style={{ backgroundColor: "#2563eb" }}
                />{" "}
                Good (60–79)
                <span
                  className="w-2 h-2 rounded-full ml-2"
                  style={{ backgroundColor: "#cbd5e1" }}
                />{" "}
                Weak (&lt;60)
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Signal Radar */}
        <section className="px-6 py-20" style={{ backgroundColor: "#ffffff" }}>
          <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
            {/* Signal feed mockup */}
            <div
              className="rounded-2xl p-6 order-2 lg:order-1"
              style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: "oklch(0.50 0.20 250)" }} />
                  <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>
                    Buying signals · live feed
                  </span>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full animate-pulse"
                  style={{
                    backgroundColor: "#5db872/10",
                    color: "#3a8f4e",
                    border: "1px solid #5db872/20",
                  }}
                >
                  8 new today
                </span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    icon: "💰",
                    type: "Funding",
                    event: "Stripe raised $694M Series H",
                    signal: "Budget cycle unlocked",
                    iq: "High",
                    time: "2h",
                    dot: "#2563eb",
                  },
                  {
                    icon: "👤",
                    type: "Leadership",
                    event: "Rippling hired new VP of Revenue",
                    signal: "Revenue expansion signal",
                    iq: "High",
                    time: "5h",
                    dot: "#5db872",
                  },
                  {
                    icon: "📋",
                    type: "Job posting",
                    event: "Figma posting 12 SDR roles",
                    signal: "Building outbound motion",
                    iq: "High",
                    time: "1d",
                    dot: "#5db872",
                  },
                  {
                    icon: "🌐",
                    type: "Intent",
                    event: "Notion CTO visited pricing page ×3",
                    signal: "Active buying research",
                    iq: "Med",
                    time: "1d",
                    dot: "#2563eb",
                  },
                  {
                    icon: "📣",
                    type: "Competitor",
                    event: "Linear mentioning 'Apollo' in jobs",
                    signal: "Evaluating category tools",
                    iq: "Med",
                    time: "2d",
                    dot: "#2563eb",
                  },
                ].map((sig) => (
                  <div
                    key={sig.event}
                    className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    <span className="text-[14px] flex-shrink-0">{sig.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>
                          {sig.type}
                        </span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: sig.iq === "High" ? "#5db872/10" : "#2563eb/10",
                            color: sig.iq === "High" ? "#3a8f4e" : "#a35a2a",
                          }}
                        >
                          IQ: {sig.iq}
                        </span>
                      </div>
                      <p
                        className="text-[11px] font-semibold leading-snug"
                        style={{ color: "#111827" }}
                      >
                        {sig.event}
                      </p>
                      <p className="text-[10px]" style={{ color: "#6b7280" }}>
                        {sig.signal}
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "#94a3b8" }}>
                      {sig.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "oklch(0.50 0.20 250)" }}
              >
                Signal radar
              </p>
              <h2
                className="text-[34px] font-normal tracking-tight mb-5"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.5px",
                  color: "#111827",
                }}
              >
                Know exactly when
                <br />
                to reach out.
              </h2>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#374151" }}>
                13+ buying signal types tracked in real-time — funding rounds, job changes, hiring
                patterns, LinkedIn activity, competitor mentions, website visits. WarmPath surfaces
                them the moment they matter.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  "Funding rounds",
                  "Leadership changes",
                  "Hiring patterns",
                  "Competitor mentions",
                  "Job posting changes",
                  "Website intent signals",
                  "LinkedIn activity",
                  "Product launches",
                ].map((sig) => (
                  <div
                    key={sig}
                    className="flex items-center gap-2 text-[12px]"
                    style={{ color: "#374151" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                    />
                    {sig}
                  </div>
                ))}
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[13px] font-semibold"
                style={{ color: "oklch(0.50 0.20 250)" }}
              >
                See it live in the demo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature 3: 1:1 AI Drafting */}
        <section className="px-6 py-20" style={{ backgroundColor: "#0f172a" }}>
          <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "oklch(0.50 0.20 250)" }}
              >
                1:1 AI drafting
              </p>
              <h2
                className="text-[34px] font-normal tracking-tight mb-5"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.5px",
                  color: "#ffffff",
                }}
              >
                Every message written
                <br />
                for one person.
                <br />
                <span style={{ color: "oklch(0.50 0.20 250)" }}>Not one template.</span>
              </h2>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#6b7280" }}>
                WarmPath drafts each intro request grounded in the specific relationship between
                your connector and the prospect — the company they shared, the year they worked
                together, the event they both attended. It reads like a real human wrote it. Because
                the logic behind it is real.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  {
                    title: "References real shared history",
                    body: "Company, role, tenure, event — not vague 'I heard great things about you' filler.",
                  },
                  {
                    title: "Tailored to the buying signal",
                    body: "The intro angle references why right now makes sense — their Series H, the new VP hire, the job posting.",
                  },
                  {
                    title: "Written in your connector's voice",
                    body: "Tone and style learns from your connector's past messages. It sounds like them.",
                  },
                ].map((f) => (
                  <div key={f.title} className="flex gap-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                    <div>
                      <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>
                        {f.title}
                      </span>
                      <span className="text-[13px]" style={{ color: "#4b5563" }}>
                        {" "}
                        — {f.body}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Draft mockup */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-4 h-4" style={{ color: "oklch(0.50 0.20 250)" }} />
                <span className="text-[12px] font-semibold" style={{ color: "#e2e8f0" }}>
                  AI-drafted intro request
                </span>
                <span
                  className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "oklch(0.50 0.20 250 / 0.15)",
                    color: "oklch(0.50 0.20 250)",
                  }}
                >
                  1 of 3 in queue
                </span>
              </div>
              <div
                className="rounded-xl p-4 mb-4"
                style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center">
                    JL
                  </span>
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: "#e2e8f0" }}>
                      James Liu · Connector
                    </div>
                    <div className="text-[10px]" style={{ color: "#4b5563" }}>
                      Review before sending to Patrick Chen, CTO @ Stripe
                    </div>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "#cbd5e1" }}>
                  "Hey Patrick — congrats on the Series H, that's a massive milestone. I know you're
                  probably heads-down on scaling the rev team right now.{" "}
                  <span
                    className="rounded px-0.5"
                    style={{
                      backgroundColor: "oklch(0.50 0.20 250 / 0.2)",
                      color: "oklch(0.65 0.18 250)",
                    }}
                  >
                    Back when we were both at Rippling in '22, you mentioned the outbound motion was
                    something you wanted to revisit with better tooling.
                  </span>{" "}
                  My colleague built exactly that — would you be up for a 15-min intro call? I think
                  the timing makes sense given{" "}
                  <span
                    className="rounded px-0.5"
                    style={{
                      backgroundColor: "oklch(0.50 0.20 250 / 0.2)",
                      color: "oklch(0.65 0.18 250)",
                    }}
                  >
                    what you're building post-raise.
                  </span>
                  "
                </p>
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid #334155" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: "oklch(0.50 0.20 250)" }}>
                      ✓ Personalized for James × Patrick
                    </span>
                    <span className="text-[10px]" style={{ color: "oklch(0.50 0.20 250)" }}>
                      ✓ References Rippling history
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 text-[12px] font-semibold py-2 rounded-xl text-white"
                  style={{ backgroundColor: "#5db872" }}
                >
                  ✓ Approve & send
                </button>
                <button
                  type="button"
                  className="text-[12px] font-semibold px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: "#1e293b",
                    color: "#6b7280",
                    border: "1px solid #334155",
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-[12px] font-semibold px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: "#1e293b",
                    color: "#6b7280",
                    border: "1px solid #334155",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 4: Approval-first */}
        <section className="px-6 py-20" style={{ backgroundColor: "#ffffff" }}>
          <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
            {/* Approval queue mockup */}
            <div
              className="rounded-2xl p-6 order-2 lg:order-1"
              style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: "oklch(0.50 0.20 250)" }} />
                  <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>
                    Outreach Review
                  </span>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: "oklch(0.50 0.20 250 / 0.1)",
                    color: "oklch(0.50 0.20 250)",
                  }}
                >
                  3 pending your review
                </span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    to: "Patrick Chen, CTO @ Stripe",
                    via: "James Liu · ex-Rippling colleague",
                    warmth: 94,
                    channel: "warm_intro",
                  },
                  {
                    to: "Sarah Kim, VP RevOps @ Rippling",
                    via: "You · met at SaaStr 2024",
                    warmth: 78,
                    channel: "email",
                  },
                  {
                    to: "Alex Torres, Head of Sales @ Figma",
                    via: "Marcus Kim · Stanford classmate",
                    warmth: 85,
                    channel: "warm_intro",
                  },
                ].map((item, i) => (
                  <div
                    key={item.to}
                    className="rounded-xl px-3 py-3"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #f1f5f9" }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                        style={{
                          backgroundColor: i === 0 ? "#dbeafe" : i === 1 ? "#d1fae5" : "#ede9fe",
                          color: i === 0 ? "#1d4ed8" : i === 1 ? "#065f46" : "#5b21b6",
                        }}
                      >
                        {item.to
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold" style={{ color: "#111827" }}>
                          {item.to}
                        </div>
                        <div className="text-[10px]" style={{ color: "#6b7280" }}>
                          via {item.via}
                        </div>
                        {item.channel === "warm_intro" && (
                          <div
                            className="text-[9px] mt-0.5 font-medium"
                            style={{ color: "oklch(0.50 0.20 250)" }}
                          >
                            ⚠ Connector must personally approve before send
                          </div>
                        )}
                      </div>
                      <span
                        className="text-[11px] font-bold flex-shrink-0"
                        style={{ color: "#5db872" }}
                      >
                        {item.warmth}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-2.5">
                      <button
                        type="button"
                        className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg text-white"
                        style={{ backgroundColor: "#5db872" }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        className="text-[10px] font-semibold px-3 py-1.5 rounded-lg"
                        style={{
                          backgroundColor: "#f1f5f9",
                          color: "#4b5563",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="mt-4 pt-4 flex items-center gap-2 text-[11px]"
                style={{ borderTop: "1px solid #e2e8f0", color: "#6b7280" }}
              >
                <Shield
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "oklch(0.50 0.20 250)" }}
                />
                Nothing sends until a human approves it. Always.
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "oklch(0.50 0.20 250)" }}
              >
                Approval-first design
              </p>
              <h2
                className="text-[34px] font-normal tracking-tight mb-5"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.5px",
                  color: "#111827",
                }}
              >
                Nothing sends
                <br />
                under your name
                <br />
                <span style={{ color: "oklch(0.50 0.20 250)" }}>without your OK.</span>
              </h2>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#374151" }}>
                Your connectors' reputations are not for sale. Every intro request sits in a review
                queue until the connector personally approves it. Not "approve all" — each one, one
                at a time. If it doesn't feel right, they edit or reject it. We built this
                constraint in from day one because relationships are the asset.
              </p>
              <div
                className="rounded-xl px-5 py-4 mb-6"
                style={{ backgroundColor: "#f3f4f6", border: "1px solid #e2e8f0" }}
              >
                <p className="text-[13px] italic mb-2" style={{ color: "#374151" }}>
                  "The approval queue is what sold our leadership. Reps can't send anything under a
                  connector's name without their OK. That removed every legal and reputational
                  concern overnight."
                </p>
                <div className="text-[11px] font-semibold" style={{ color: "#6b7280" }}>
                  — Head of Revenue, Series B SaaS company
                </div>
              </div>
              <TrendingUp
                className="w-4 h-4 inline mr-1.5"
                style={{ color: "oklch(0.50 0.20 250)" }}
              />
              <span className="text-[13px]" style={{ color: "#374151" }}>
                Teams using WarmPath see <strong>47% reply rates</strong> on approved warm intros.
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ══════════════════════════ TESTIMONIALS ════════════════════════════ */}
      <section className="px-6 py-20" style={{ backgroundColor: "#f1f5f9" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "oklch(0.50 0.20 250)" }}
            >
              What teams are saying
            </p>
            <h2
              className="text-[36px] font-normal tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.5px",
                color: "#111827",
              }}
            >
              Real results from real sales teams.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 flex flex-col"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
              >
                <Quote
                  className="w-6 h-6 mb-4 opacity-30"
                  style={{ color: "oklch(0.50 0.20 250)" }}
                />
                <p className="text-[13px] leading-relaxed flex-1 mb-5" style={{ color: "#374151" }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ${t.color}`}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: "#111827" }}>
                      {t.name}
                    </div>
                    <div className="text-[11px]" style={{ color: "#6b7280" }}>
                      {t.title} · {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ COMPARISON ══════════════════════════════ */}
      <section id="compare" className="px-6 py-20" style={{ backgroundColor: "#ffffff" }}>
        <div className="mx-auto max-w-6xl">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "oklch(0.50 0.20 250)" }}
          >
            Compare
          </p>
          <h2
            className="text-[36px] font-normal tracking-tight mb-2"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.5px", color: "#111827" }}
          >
            Built differently.
          </h2>
          <p className="text-[14px] mb-8" style={{ color: "#6b7280" }}>
            Apollo prospects. Clay enriches. Artisan auto-sends. WarmPath finds the right path first
            — then makes sure a human approves every message.
          </p>
          <div
            className="overflow-x-auto rounded-2xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <th
                    className="px-5 py-4 text-left text-[11px] font-semibold"
                    style={{ color: "#6b7280" }}
                  >
                    Capability
                  </th>
                  <th
                    className="px-4 py-4 text-center text-[12px] font-bold"
                    style={{ color: "oklch(0.50 0.20 250)" }}
                  >
                    WarmPath
                  </th>
                  {["Apollo", "Clay", "Artisan"].map((c) => (
                    <th
                      key={c}
                      className="px-4 py-4 text-center text-[11px] font-semibold"
                      style={{ color: "#6b7280" }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      borderBottom: i < COMPARISON.length - 1 ? "1px solid #ede7e0" : "none",
                      backgroundColor: i % 2 === 0 ? "rgba(239,233,222,0.3)" : "transparent",
                    }}
                  >
                    <td className="px-5 py-3 text-[12px]" style={{ color: "#4b5563" }}>
                      {row.feature}
                    </td>
                    {(["warmpath", "apollo", "clay", "artisan"] as const).map((col) => (
                      <td key={col} className="px-4 py-3 text-center">
                        <CompareCell val={row[col]} isWarmPath={col === "warmpath"} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ CTA ═════════════════════════════════════ */}
      <section className="px-6 py-20" style={{ backgroundColor: "#0f172a" }}>
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mx-auto text-center">
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-5"
              style={{ color: "oklch(0.50 0.20 250)" }}
            >
              Ready to start warm?
            </p>
            <h2
              className="text-[44px] sm:text-[52px] font-normal leading-tight mb-5"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-1.5px",
                color: "#ffffff",
              }}
            >
              Your best deals are one
              <br />
              <span style={{ color: "oklch(0.50 0.20 250)" }}>warm intro away.</span>
            </h2>
            <p
              className="text-[15px] leading-relaxed mb-8 max-w-lg mx-auto"
              style={{ color: "#4b5563" }}
            >
              Explore a live demo workspace with real relationship graphs, buying signals, warm
              paths, and an AI approval queue. No credit card. Ready in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
              >
                Open demo workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center h-12 px-7 rounded-xl text-[14px] font-medium transition-colors"
                style={{
                  border: "1px solid #334155",
                  color: "#e2e8f0",
                  backgroundColor: "#1e293b",
                }}
              >
                See how it works
              </a>
            </div>
            <p className="text-[12px]" style={{ color: "#374151" }}>
              No credit card required · Live demo data · Full product access
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════════════════ */}
      <footer
        className="px-6 py-10 border-t"
        style={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                >
                  <GitFork className="h-3 w-3 text-white" />
                </div>
                <span
                  className="text-[15px] font-semibold"
                  style={{ fontFamily: "var(--font-display)", color: "#ffffff" }}
                >
                  WarmPath
                </span>
              </Link>
              <p className="text-[12px] max-w-xs" style={{ color: "#374151" }}>
                Relationship intelligence for enterprise B2B sales. Find the warm path to every
                deal.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {[
                {
                  heading: "Product",
                  links: ["How it works", "Features", "Compare", "Pricing"],
                },
                {
                  heading: "Use cases",
                  links: ["Enterprise AE", "SDR teams", "RevOps", "Founder-led sales"],
                },
                {
                  heading: "Company",
                  links: ["About", "Blog", "Careers", "Contact"],
                },
              ].map((col) => (
                <div key={col.heading}>
                  <div
                    className="text-[11px] font-bold uppercase tracking-wider mb-3"
                    style={{ color: "#374151" }}
                  >
                    {col.heading}
                  </div>
                  <ul className="space-y-2">
                    {col.links.map((l) => (
                      <li key={l}>
                        <span className="text-[12px] cursor-default" style={{ color: "#4b5563" }}>
                          {l}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div
            className="flex items-center justify-between pt-6"
            style={{ borderTop: "1px solid #334155" }}
          >
            <p className="text-[12px]" style={{ color: "#374151" }}>
              © 2026 WarmPath. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {["Privacy", "Terms", "Security"].map((l) => (
                <span key={l} className="text-[12px] cursor-default" style={{ color: "#374151" }}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
