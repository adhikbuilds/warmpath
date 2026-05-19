"use client";

import { ArrowRight, CheckCircle, GitFork, Minus, X } from "lucide-react";
import Link from "next/link";

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
    feature: "Relationship graph (team-wide)",
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
    feature: "Human approval queue",
    warmpath: true,
    apollo: false,
    clay: false,
    artisan: "partial",
  },
  {
    feature: "Buying signals (13+ types)",
    warmpath: true,
    apollo: "partial",
    clay: "partial",
    artisan: "partial",
  },
  {
    feature: "Multi-channel AI outreach",
    warmpath: true,
    apollo: true,
    clay: "partial",
    artisan: true,
  },
  {
    feature: "Risk flags before send",
    warmpath: true,
    apollo: false,
    clay: false,
    artisan: "partial",
  },
];

function CompareCell({ val, isWarmPath }: { val: boolean | "partial"; isWarmPath?: boolean }) {
  if (val === true) {
    return (
      <CheckCircle
        className="mx-auto h-4 w-4"
        style={{ color: isWarmPath ? "oklch(0.65 0.16 48)" : "#5db872" }}
      />
    );
  }
  if (val === "partial") {
    return <Minus className="mx-auto h-3.5 w-3.5" style={{ color: "#c8bfb2" }} />;
  }
  return <X className="mx-auto h-3.5 w-3.5" style={{ color: "#d9d0c5" }} />;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf9f5", color: "#141413" }}>
      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "rgba(250,249,245,0.96)",
          borderColor: "#e6dfd8",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ backgroundColor: "oklch(0.65 0.16 48)" }}
            >
              <GitFork className="h-3 w-3 text-white" />
            </div>
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "#141413" }}
            >
              WarmPath
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] px-3 py-1.5 rounded-md transition-colors"
              style={{ color: "#6c6a64" }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-[13px] font-medium px-4 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "oklch(0.65 0.16 48)" }}
            >
              Try demo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-6 pt-20 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row gap-14 items-center">
            {/* Left copy */}
            <div className="lg:w-[46%]">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mb-5"
                style={{ color: "oklch(0.65 0.16 48)" }}
              >
                Relationship intelligence for B2B sales
              </p>
              <h1
                className="text-[50px] sm:text-[58px] font-normal leading-[1.08] mb-5"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-1.5px",
                  color: "#141413",
                }}
              >
                Your next deal
                <br />
                is one warm intro
                <br />
                <span style={{ color: "oklch(0.65 0.16 48)" }}>away.</span>
              </h1>
              <p className="text-[15px] leading-relaxed mb-8 max-w-sm" style={{ color: "#6c6a64" }}>
                WarmPath maps your team's real relationships and finds the shortest path to every
                buyer. AI drafts the intro request — your connector approves it personally.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "oklch(0.65 0.16 48)" }}
                >
                  See it live
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-[13px] font-medium transition-colors"
                  style={{
                    border: "1px solid #e6dfd8",
                    color: "#3d3d3a",
                    backgroundColor: "#faf9f5",
                  }}
                >
                  How it works
                </a>
              </div>
            </div>

            {/* Right: path diagram */}
            <div className="lg:w-[54%] w-full">
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: "#efe9de", border: "1px solid #e6dfd8" }}
              >
                {/* Signal pill */}
                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 mb-4"
                  style={{ backgroundColor: "#faf9f5", border: "1px solid #e6dfd8" }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "oklch(0.65 0.16 48)" }}
                  />
                  <span className="text-[13px] font-semibold" style={{ color: "#141413" }}>
                    Stripe raised Series H
                  </span>
                  <span className="text-[13px]" style={{ color: "#8e8b82" }}>
                    · budget cycle unlocked
                  </span>
                  <span className="ml-auto text-[11px] flex-shrink-0" style={{ color: "#a09d96" }}>
                    2h ago
                  </span>
                </div>

                {/* Relationship path SVG */}
                <svg viewBox="0 0 460 240" className="w-full" aria-hidden="true">
                  {/* Glow behind warm path */}
                  <line
                    x1="82"
                    y1="120"
                    x2="230"
                    y2="60"
                    stroke="#d4762a"
                    strokeWidth="10"
                    strokeOpacity="0.10"
                    strokeLinecap="round"
                  />
                  <line
                    x1="230"
                    y1="60"
                    x2="378"
                    y2="120"
                    stroke="#d4762a"
                    strokeWidth="10"
                    strokeOpacity="0.10"
                    strokeLinecap="round"
                  />
                  {/* Warm path lines */}
                  <line
                    x1="82"
                    y1="120"
                    x2="230"
                    y2="60"
                    stroke="#d4762a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="230"
                    y1="60"
                    x2="378"
                    y2="120"
                    stroke="#d4762a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Cold connection (dashed) */}
                  <line
                    x1="82"
                    y1="120"
                    x2="230"
                    y2="185"
                    stroke="#e6dfd8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="4 3"
                  />
                  <line
                    x1="230"
                    y1="185"
                    x2="378"
                    y2="120"
                    stroke="#e6dfd8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeDasharray="4 3"
                  />
                  {/* Path label */}
                  <text
                    x="230"
                    y="33"
                    fontSize="9.5"
                    textAnchor="middle"
                    fill="#a09d96"
                    fontFamily="Inter, sans-serif"
                  >
                    warm intro path · 1 hop
                  </text>
                  {/* Node: You */}
                  <circle
                    cx="82"
                    cy="120"
                    r="26"
                    fill="#faf9f5"
                    stroke="#d4762a"
                    strokeWidth="1.5"
                  />
                  <text
                    x="82"
                    y="124"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    fill="#141413"
                    fontFamily="Inter, sans-serif"
                  >
                    You
                  </text>
                  <text
                    x="82"
                    y="157"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#a09d96"
                    fontFamily="Inter, sans-serif"
                  >
                    Account Exec
                  </text>
                  {/* Node: James Liu (connector) */}
                  <circle
                    cx="230"
                    cy="60"
                    r="28"
                    fill="#faf9f5"
                    stroke="#d4762a"
                    strokeWidth="1.5"
                  />
                  <text
                    x="230"
                    y="56"
                    fontSize="10.5"
                    fontWeight="600"
                    textAnchor="middle"
                    fill="#141413"
                    fontFamily="Inter, sans-serif"
                  >
                    James
                  </text>
                  <text
                    x="230"
                    y="70"
                    fontSize="10.5"
                    fontWeight="600"
                    textAnchor="middle"
                    fill="#141413"
                    fontFamily="Inter, sans-serif"
                  >
                    Liu
                  </text>
                  <text
                    x="230"
                    y="99"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#a09d96"
                    fontFamily="Inter, sans-serif"
                  >
                    ex-Rippling · 2 yrs
                  </text>
                  {/* Node: CTO at Stripe (target) */}
                  <circle
                    cx="378"
                    cy="120"
                    r="32"
                    fill="#faf9f5"
                    stroke="#d4762a"
                    strokeWidth="2"
                  />
                  {/* Warmth badge */}
                  <rect x="354" y="76" width="48" height="17" rx="8.5" fill="#d4762a" />
                  <text
                    x="378"
                    y="88"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    fill="white"
                    fontFamily="Inter, sans-serif"
                  >
                    94 warm
                  </text>
                  <text
                    x="378"
                    y="116"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                    fill="#141413"
                    fontFamily="Inter, sans-serif"
                  >
                    CTO
                  </text>
                  <text
                    x="378"
                    y="130"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    fill="#141413"
                    fontFamily="Inter, sans-serif"
                  >
                    at Stripe
                  </text>
                  <text
                    x="378"
                    y="162"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#a09d96"
                    fontFamily="Inter, sans-serif"
                  >
                    Decision maker
                  </text>
                  {/* Cold path node */}
                  <circle
                    cx="230"
                    cy="185"
                    r="20"
                    fill="#faf9f5"
                    stroke="#e6dfd8"
                    strokeWidth="1.5"
                  />
                  <text
                    x="230"
                    y="181"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#a09d96"
                    fontFamily="Inter, sans-serif"
                  >
                    Cold
                  </text>
                  <text
                    x="230"
                    y="193"
                    fontSize="9"
                    textAnchor="middle"
                    fill="#a09d96"
                    fontFamily="Inter, sans-serif"
                  >
                    path
                  </text>
                </svg>

                <div
                  className="flex items-center justify-between pt-3 mt-1"
                  style={{ borderTop: "1px solid #e6dfd8" }}
                >
                  <span className="text-xs" style={{ color: "#a09d96" }}>
                    4 team relationships mapped to Stripe
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "oklch(0.65 0.16 48)" }}>
                    Best path: 1 hop
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="px-6 py-10" style={{ backgroundColor: "#f5f0e8" }}>
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: "3×", label: "reply rate vs cold email" },
              { val: "1-hop", label: "avg intro path" },
              { val: "18 days", label: "avg deal velocity" },
              { val: "100%", label: "connector-approved" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-5 py-4 text-center"
                style={{ backgroundColor: "#faf9f5", border: "1px solid #e6dfd8" }}
              >
                <div
                  className="text-[28px] font-semibold leading-none mb-1"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "oklch(0.65 0.16 48)",
                  }}
                >
                  {s.val}
                </div>
                <div className="text-[11px] leading-snug" style={{ color: "#8e8b82" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "oklch(0.65 0.16 48)" }}
          >
            How it works
          </p>
          <h2
            className="text-[38px] font-normal tracking-tight mb-12"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.5px",
              color: "#141413",
            }}
          >
            From signal to signed deal.
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: "1",
                title: "Map your team's network",
                body: "LinkedIn connections, shared companies, alumni networks, conference contacts — aggregated across your whole team into one shared relationship graph.",
              },
              {
                n: "2",
                title: "Find the warm path",
                body: "AI identifies who on your team knows the decision maker and how: worked together at Rippling, met at SaaStr, same Stanford cohort. Evidence-backed, not guessed.",
              },
              {
                n: "3",
                title: "Draft the intro. Your connector approves.",
                body: "AI writes a personalized intro request grounded in your shared history. The connector reviews and approves every single one individually — we never send under their name without their explicit OK.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-xl p-6"
                style={{ backgroundColor: "#efe9de", border: "1px solid #e6dfd8" }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-white mb-4"
                  style={{ backgroundColor: "oklch(0.65 0.16 48)" }}
                >
                  {step.n}
                </div>
                <h3
                  className="font-semibold text-[14px] mb-2 leading-snug"
                  style={{ color: "#141413" }}
                >
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "#6c6a64" }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The 1:1 principle ── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <div
            className="rounded-2xl px-8 py-10"
            style={{ backgroundColor: "#efe9de", border: "1px solid #e6dfd8" }}
          >
            <div className="max-w-2xl">
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-4"
                style={{ color: "oklch(0.65 0.16 48)" }}
              >
                Our philosophy
              </p>
              <h2
                className="text-[28px] font-normal tracking-tight mb-4"
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.3px",
                  color: "#141413",
                }}
              >
                Not another outreach automation tool.
              </h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "#3d3d3a" }}>
                Every message WarmPath drafts is written for one specific person, grounded in their
                company's signals and your real relationship context. Your connectors approve each
                intro individually — we never send anything under someone's name without their
                explicit OK. Enterprise sales is 1:1. We built for that.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section id="compare" className="px-6 py-20" style={{ backgroundColor: "#f5f0e8" }}>
        <div className="mx-auto max-w-5xl">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "oklch(0.65 0.16 48)" }}
          >
            Compare
          </p>
          <h2
            className="text-[38px] font-normal tracking-tight mb-2"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.5px",
              color: "#141413",
            }}
          >
            Built differently.
          </h2>
          <p className="text-[13px] mb-8" style={{ color: "#8e8b82" }}>
            Apollo prospects. Clay enriches. Artisan auto-sends. WarmPath finds the right path
            first.
          </p>
          <div
            className="overflow-x-auto rounded-xl"
            style={{ backgroundColor: "#faf9f5", border: "1px solid #e6dfd8" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #e6dfd8" }}>
                  <th
                    className="px-5 py-3.5 text-left text-[11px] font-semibold"
                    style={{ color: "#8e8b82" }}
                  >
                    Feature
                  </th>
                  <th
                    className="px-4 py-3.5 text-center text-[11px] font-bold"
                    style={{ color: "oklch(0.65 0.16 48)" }}
                  >
                    WarmPath
                  </th>
                  {["Apollo", "Clay", "Artisan"].map((c) => (
                    <th
                      key={c}
                      className="px-4 py-3.5 text-center text-[11px] font-semibold"
                      style={{ color: "#8e8b82" }}
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
                      backgroundColor: i % 2 === 0 ? "rgba(239,233,222,0.35)" : "transparent",
                    }}
                  >
                    <td className="px-5 py-3 text-[12px]" style={{ color: "#6c6a64" }}>
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

      {/* ── CTA section ── */}
      <section className="px-6 py-20" style={{ backgroundColor: "#faf9f5" }}>
        <div className="mx-auto max-w-5xl">
          <div
            className="rounded-2xl px-10 py-16 text-center"
            style={{ backgroundColor: "#181715" }}
          >
            <h2
              className="text-[36px] sm:text-[42px] font-normal leading-tight mb-4"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.5px",
                color: "#faf9f5",
              }}
            >
              Start with the demo workspace.
            </h2>
            <p
              className="text-[14px] mb-8 max-w-sm mx-auto leading-relaxed"
              style={{ color: "#8e8b82" }}
            >
              Live relationship graph, real buying signals, warm paths to every account in your ICP.
              No credit card. Demo ready in seconds.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 h-10 px-7 rounded-lg text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "oklch(0.65 0.16 48)" }}
            >
              Open demo workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10" style={{ backgroundColor: "#181715" }}>
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ backgroundColor: "oklch(0.65 0.16 48)" }}
            >
              <GitFork className="h-2.5 w-2.5 text-white" />
            </div>
            <span
              className="text-[13px] font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "#faf9f5" }}
            >
              WarmPath
            </span>
          </div>
          <p className="text-[12px]" style={{ color: "#6c6a64" }}>
            © 2026 WarmPath
          </p>
        </div>
      </footer>
    </div>
  );
}
