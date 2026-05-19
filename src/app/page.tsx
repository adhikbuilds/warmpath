"use client";

import { ArrowRight, CheckCircle, GitFork, Minus, X } from "lucide-react";
import Link from "next/link";

/* ─── Comparison ────────────────────────────────────────────────────────── */

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
    feature: "Connector approval before any send",
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
    feature: "Per-message 1:1 AI personalization",
    warmpath: true,
    apollo: "partial",
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
  {
    feature: "Multi-channel (email, LinkedIn, WhatsApp, phone)",
    warmpath: true,
    apollo: true,
    clay: "partial",
    artisan: true,
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
  return <X className="mx-auto h-3.5 w-3.5" style={{ color: "#e2e8f0" }} />;
}

/* ─── Testimonials ──────────────────────────────────────────────────────── */

const TESTIMONIALS = [
  {
    quote:
      "First sequence I ran had a 41% reply rate. My previous Apollo sequences never broke 8%. Every message sounds like it was written for that specific person — because it was.",
    name: "Marcus Rodriguez",
    title: "Senior Account Executive",
    company: "Rippling",
    initials: "MR",
  },
  {
    quote:
      "We mapped 3,400 connections across our team in under 5 minutes. Found warm paths to 78% of our ICP — accounts we'd been cold-calling for months.",
    name: "Jamie Chen",
    title: "VP of Sales",
    company: "Lattice",
    initials: "JC",
  },
  {
    quote:
      "The approval queue is what sold our leadership. Nothing sends under a connector's name without their explicit OK. That removed every legal and reputational concern overnight.",
    name: "Priya Sharma",
    title: "Head of Revenue",
    company: "Notion",
    initials: "PS",
  },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff", color: "#111827" }}>
      {/* NAV */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
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
              style={{ fontFamily: "var(--font-display)" }}
            >
              WarmPath
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#how" className="text-[13px]" style={{ color: "#6b7280" }}>
              How it works
            </a>
            <a href="#compare" className="text-[13px]" style={{ color: "#6b7280" }}>
              Compare
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] px-3 py-1.5 rounded-md"
              style={{ color: "#6b7280" }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-[13px] font-semibold px-4 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
            >
              Try demo
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-16 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left */}
            <div className="lg:w-[44%]">
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-5"
                style={{ color: "oklch(0.50 0.20 250)" }}
              >
                Relationship intelligence · B2B sales
              </p>
              <h1
                className="text-[54px] sm:text-[64px] font-normal leading-[1.05] mb-6"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-2.5px",
                  color: "#111827",
                }}
              >
                See which deals
                <br />
                your team can
                <br />
                <span style={{ color: "oklch(0.50 0.20 250)" }}>close this week.</span>
              </h1>
              <p
                className="text-[16px] leading-relaxed mb-8"
                style={{ color: "#4b5563", maxWidth: "360px" }}
              >
                WarmPath maps every relationship your team has, finds the warmest path to every
                buyer, and drafts the intro. One person approves it. One deal moves forward.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
              >
                Open demo workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-[12px] mt-3" style={{ color: "#9ca3af" }}>
                No signup required · Live data · Full product
              </p>
            </div>

            {/* Right: product diagram */}
            <div className="lg:w-[56%] w-full">
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                {/* Signal */}
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                    style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold" style={{ color: "#111827" }}>
                      Stripe raised $694M Series H
                    </span>
                    <span className="text-[12px] ml-2" style={{ color: "#6b7280" }}>
                      · budget cycle unlocked
                    </span>
                  </div>
                  <span className="text-[11px] flex-shrink-0" style={{ color: "#9ca3af" }}>
                    2h ago
                  </span>
                </div>

                {/* Relationship path */}
                <div className="mb-2">
                  <p className="text-[11px] font-semibold mb-3" style={{ color: "#6b7280" }}>
                    Warm path found · 1 hop · 94 warmth score
                  </p>
                  <svg viewBox="0 0 480 200" className="w-full" aria-hidden="true">
                    {/* Glow */}
                    <line
                      x1="85"
                      y1="100"
                      x2="240"
                      y2="40"
                      stroke="#2563eb"
                      strokeWidth="14"
                      strokeOpacity="0.06"
                      strokeLinecap="round"
                    />
                    <line
                      x1="240"
                      y1="40"
                      x2="395"
                      y2="100"
                      stroke="#2563eb"
                      strokeWidth="14"
                      strokeOpacity="0.06"
                      strokeLinecap="round"
                    />
                    {/* Warm path */}
                    <line
                      x1="85"
                      y1="100"
                      x2="240"
                      y2="40"
                      stroke="#2563eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="240"
                      y1="40"
                      x2="395"
                      y2="100"
                      stroke="#2563eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Cold dashed */}
                    <line
                      x1="85"
                      y1="100"
                      x2="240"
                      y2="165"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray="4 3"
                    />
                    <line
                      x1="240"
                      y1="165"
                      x2="395"
                      y2="100"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray="4 3"
                    />
                    {/* YOU */}
                    <circle
                      cx="85"
                      cy="100"
                      r="28"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />
                    <text
                      x="85"
                      y="96"
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
                      y="109"
                      fontSize="9"
                      textAnchor="middle"
                      fill="#6b7280"
                      fontFamily="Inter, sans-serif"
                    >
                      AE
                    </text>
                    <text
                      x="85"
                      y="138"
                      fontSize="9"
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontFamily="Inter, sans-serif"
                    >
                      you
                    </text>
                    {/* CONNECTOR */}
                    <circle
                      cx="240"
                      cy="40"
                      r="30"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />
                    <text
                      x="240"
                      y="35"
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
                      y="48"
                      fontSize="10.5"
                      fontWeight="700"
                      textAnchor="middle"
                      fill="#111827"
                      fontFamily="Inter, sans-serif"
                    >
                      Liu
                    </text>
                    <rect x="212" y="5" width="56" height="16" rx="8" fill="oklch(0.50 0.20 250)" />
                    <text
                      x="240"
                      y="16.5"
                      fontSize="9"
                      fontWeight="700"
                      textAnchor="middle"
                      fill="white"
                      fontFamily="Inter, sans-serif"
                    >
                      connector
                    </text>
                    <text
                      x="240"
                      y="76"
                      fontSize="9"
                      textAnchor="middle"
                      fill="#6b7280"
                      fontFamily="Inter, sans-serif"
                    >
                      ex-Rippling · 2 yrs
                    </text>
                    {/* TARGET */}
                    <circle
                      cx="395"
                      cy="100"
                      r="34"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2"
                    />
                    <rect
                      x="368"
                      y="57"
                      width="54"
                      height="17"
                      rx="8.5"
                      fill="oklch(0.50 0.20 250)"
                    />
                    <text
                      x="395"
                      y="68"
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
                      y="97"
                      fontSize="13"
                      fontWeight="800"
                      textAnchor="middle"
                      fill="#111827"
                      fontFamily="Inter, sans-serif"
                    >
                      CTO
                    </text>
                    <text
                      x="395"
                      y="112"
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
                      y="143"
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
                      cy="165"
                      r="18"
                      fill="#f8fafc"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                    />
                    <text
                      x="240"
                      y="162"
                      fontSize="8.5"
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontFamily="Inter, sans-serif"
                    >
                      cold
                    </text>
                    <text
                      x="240"
                      y="173"
                      fontSize="8.5"
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontFamily="Inter, sans-serif"
                    >
                      path
                    </text>
                  </svg>
                </div>

                <div
                  className="flex items-center justify-between pt-4"
                  style={{ borderTop: "1px solid #e2e8f0" }}
                >
                  <span className="text-[11px]" style={{ color: "#9ca3af" }}>
                    4 team connections mapped to Stripe
                  </span>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: "oklch(0.50 0.20 250)" }}
                  >
                    Best path: 1 hop
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section
        className="px-6 py-10"
        style={{
          backgroundColor: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { val: "3×", label: "higher reply rate than cold email" },
              { val: "47%", label: "reply rate on warm intros" },
              { val: "1-hop", label: "average intro path length" },
              { val: "100%", label: "connector-approved before send" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  className="text-[32px] font-semibold leading-none mb-1.5"
                  style={{ fontFamily: "var(--font-display)", color: "oklch(0.50 0.20 250)" }}
                >
                  {s.val}
                </div>
                <div className="text-[12px] leading-snug" style={{ color: "#6b7280" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "oklch(0.50 0.20 250)" }}
          >
            How it works
          </p>
          <h2
            className="text-[38px] font-normal tracking-tight mb-2"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-1px", color: "#111827" }}
          >
            From signal to meeting — in hours, not weeks.
          </h2>
          <p className="text-[14px] mb-12" style={{ color: "#6b7280" }}>
            The entire workflow lives in one place. No spreadsheets, no guessing who knows who.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                title: "Your team's network, mapped",
                body: "LinkedIn connections, shared employers, alumni networks — aggregated across every team member into one searchable relationship graph. What was invisible is now searchable.",
              },
              {
                n: "02",
                title: "WarmPath finds the route",
                body: "The moment a buying signal fires — funding, hiring, leadership change — the AI finds who on your team knows the decision maker and why. Evidence-backed, not guessed.",
              },
              {
                n: "03",
                title: "Draft, approve, send",
                body: "AI writes a 1:1 intro request grounded in the real shared history. Your connector reviews and approves it personally before anything sends under their name. Every time.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <div
                  className="text-[11px] font-bold mb-4 tracking-widest"
                  style={{ color: "oklch(0.50 0.20 250)" }}
                >
                  {step.n}
                </div>
                <h3
                  className="font-semibold text-[15px] mb-3 leading-snug"
                  style={{ color: "#111827" }}
                >
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "#4b5563" }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        className="px-6 py-20"
        style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}
      >
        <div className="mx-auto max-w-6xl">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "oklch(0.50 0.20 250)" }}
          >
            What teams say
          </p>
          <h2
            className="text-[36px] font-normal tracking-tight mb-12"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.8px", color: "#111827" }}
          >
            Real results from enterprise sales teams.
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 flex flex-col"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
              >
                <p className="text-[13px] leading-relaxed flex-1 mb-5" style={{ color: "#374151" }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
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

      {/* COMPARE */}
      <section id="compare" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "oklch(0.50 0.20 250)" }}
          >
            Compare
          </p>
          <h2
            className="text-[36px] font-normal tracking-tight mb-2"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.8px", color: "#111827" }}
          >
            Built differently.
          </h2>
          <p className="text-[13px] mb-8" style={{ color: "#6b7280" }}>
            Apollo finds prospects. Clay enriches them. Artisan auto-sends. WarmPath routes through
            relationships first — then gets human approval on every message.
          </p>
          <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid #e2e8f0" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
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
                      style={{ color: "#9ca3af" }}
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
                      borderBottom: i < COMPARISON.length - 1 ? "1px solid #f1f5f9" : "none",
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

      {/* CTA */}
      <section className="px-6 py-24" style={{ backgroundColor: "#0f172a" }}>
        <div className="mx-auto max-w-6xl text-center">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-5"
            style={{ color: "oklch(0.65 0.18 250)" }}
          >
            Get started
          </p>
          <h2
            className="text-[46px] sm:text-[56px] font-normal leading-tight mb-5"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-1.5px", color: "#f1f5f9" }}
          >
            Your best deal is one
            <br />
            <span style={{ color: "oklch(0.65 0.18 250)" }}>warm intro away.</span>
          </h2>
          <p
            className="text-[15px] mb-10 max-w-md mx-auto leading-relaxed"
            style={{ color: "#64748b" }}
          >
            Explore a live demo workspace — real signals, real relationship paths, real AI drafts
            waiting for approval.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-12 px-9 rounded-xl text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
          >
            Open demo workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[12px] mt-4" style={{ color: "#475569" }}>
            No signup · No credit card · Full product access
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="px-6 py-8 border-t"
        style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ backgroundColor: "oklch(0.50 0.20 250)" }}
            >
              <GitFork className="h-2.5 w-2.5 text-white" />
            </div>
            <span
              className="text-[13px] font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "#f1f5f9" }}
            >
              WarmPath
            </span>
          </div>
          <p className="text-[12px]" style={{ color: "#475569" }}>
            © 2026 WarmPath
          </p>
        </div>
      </footer>
    </div>
  );
}
