"use client";

import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  GitFork,
  Minus,
  X,
  Zap,
  Network,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// DESIGN.MD tokens (WarmPath adaptation of the Claude design system)
// Canvas: #faf9f5 | Surface-card: #efe9de | Dark: #181715
// Ink: #141413 | Body: #3d3d3a | Muted: #6c6a64
// Primary/Coral equivalent: WarmPath brand oklch(0.65 0.16 48) ≈ warm orange
// Hairline: #e6dfd8

const COMPARISON = [
  { feature: "Relationship graph (team-wide)", warmpath: true, apollo: false, clay: "partial", artisan: false },
  { feature: "Warm intro path routing", warmpath: true, apollo: false, clay: false, artisan: false },
  { feature: "Human approval queue", warmpath: true, apollo: false, clay: false, artisan: "partial" },
  { feature: "Buying signals (13+ types)", warmpath: true, apollo: "partial", clay: "partial", artisan: "partial" },
  { feature: "Multi-channel AI outreach", warmpath: true, apollo: true, clay: "partial", artisan: true },
  { feature: "Risk flags before send", warmpath: true, apollo: false, clay: false, artisan: "partial" },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b py-5 cursor-pointer select-none"
      style={{ borderColor: "#e6dfd8" }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium" style={{ color: "#141413" }}>{q}</p>
        <ChevronRight
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          style={{ color: "#8e8b82" }}
        />
      </div>
      {open && <p className="mt-3 text-sm leading-relaxed" style={{ color: "#6c6a64" }}>{a}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf9f5", color: "#141413" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "rgba(250,249,245,0.95)", borderColor: "#e6dfd8", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
              <GitFork className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: "#141413" }}>WarmPath</span>
          </Link>

          <div className="hidden items-center gap-7 text-[13px] font-medium md:flex" style={{ color: "#6c6a64" }}>
            <a href="#how" className="hover:text-[#141413] transition-colors">How it works</a>
            <a href="#compare" className="hover:text-[#141413] transition-colors">Compare</a>
            <a href="#faq" className="hover:text-[#141413] transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] font-medium px-3 py-1.5 rounded-md transition-colors"
              style={{ color: "#6c6a64" }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-[13px] font-medium px-4 py-2 rounded-lg text-white transition-colors bg-brand hover:opacity-90"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left */}
            <div className="lg:w-[48%]">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium mb-7"
                style={{ border: "1px solid #e6dfd8", backgroundColor: "#efe9de", color: "#6c6a64" }}
              >
                <Zap className="h-3 w-3" style={{ color: "#cc785c" }} />
                Relationship intelligence for B2B sales
              </div>

              <h1
                className="text-[52px] sm:text-[60px] font-normal tracking-tight leading-[1.06] mb-6"
                style={{ fontFamily: "var(--font-display), Georgia, serif", letterSpacing: "-1.5px", color: "#141413" }}
              >
                Your next deal<br />
                is a warm intro<br />
                <span className="text-brand">away.</span>
              </h1>

              <p className="text-base leading-relaxed max-w-md mb-8" style={{ color: "#6c6a64", lineHeight: "1.65" }}>
                WarmPath maps your team's real relationships, detects buying signals, and finds the
                shortest credible path to every buyer before you send a single cold email.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg text-[14px] font-medium text-white bg-brand hover:opacity-90 transition-opacity"
                >
                  Open demo workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-lg text-[14px] font-medium transition-colors"
                  style={{ border: "1px solid #e6dfd8", color: "#3d3d3a", backgroundColor: "#faf9f5" }}
                >
                  See how it works
                </a>
              </div>

              <div className="flex flex-wrap gap-7">
                {[
                  { val: "3×", label: "higher reply rate" },
                  { val: "1-hop", label: "avg intro path" },
                  { val: "18 days", label: "faster to close" },
                ].map((s) => (
                  <div key={s.label} className="flex items-baseline gap-1.5">
                    <span
                      className="text-2xl font-semibold text-brand"
                      style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                    >
                      {s.val}
                    </span>
                    <span className="text-xs" style={{ color: "#8e8b82" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Relationship graph */}
            <div className="lg:w-[52%] w-full">
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: "#efe9de", border: "1px solid #e6dfd8" }}
              >
                {/* Signal banner */}
                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 mb-5"
                  style={{ backgroundColor: "#faf9f5", border: "1px solid #e6dfd8" }}
                >
                  <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold" style={{ color: "#141413" }}>Stripe raised $65B</span>
                    <span className="text-[13px]" style={{ color: "#8e8b82" }}> · budget cycle just unlocked</span>
                  </div>
                  <span
                    className="text-[11px] font-medium flex-shrink-0"
                    style={{ color: "#8e8b82" }}
                  >2h ago</span>
                </div>

                {/* Relationship graph SVG */}
                <svg viewBox="0 0 460 310" className="w-full" aria-hidden="true">
                  {/* Warm path glow */}
                  <line x1="82" y1="155" x2="210" y2="80" stroke="#d4762a" strokeWidth="10" strokeOpacity="0.12" strokeLinecap="round" />
                  <line x1="210" y1="80" x2="368" y2="155" stroke="#d4762a" strokeWidth="10" strokeOpacity="0.12" strokeLinecap="round" />

                  {/* Warm path lines */}
                  <line x1="82" y1="155" x2="210" y2="80" stroke="#d4762a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="210" y1="80" x2="368" y2="155" stroke="#d4762a" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Cold connections */}
                  <line x1="82" y1="155" x2="200" y2="240" stroke="#e6dfd8" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="340" y1="52" x2="368" y2="155" stroke="#e6dfd8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 3" />
                  <line x1="200" y1="240" x2="368" y2="155" stroke="#e6dfd8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 3" />

                  {/* Warm path label */}
                  <text x="232" y="99" fontSize="9.5" textAnchor="middle" fill="#8e8b82" fontFamily="Inter, sans-serif">warm path · 1 hop</text>

                  {/* ── Node: You ── */}
                  <circle cx="82" cy="155" r="28" fill="#faf9f5" stroke="#d4762a" strokeWidth="1.5" />
                  <text x="82" y="159" fontSize="11" fontWeight="600" textAnchor="middle" fill="#141413" fontFamily="Inter, sans-serif">You</text>
                  <text x="82" y="196" fontSize="9.5" textAnchor="middle" fill="#8e8b82" fontFamily="Inter, sans-serif">Account Exec</text>

                  {/* ── Node: Sarah Chen ── */}
                  <circle cx="210" cy="80" r="30" fill="#faf9f5" stroke="#d4762a" strokeWidth="1.5" />
                  <text x="210" y="76" fontSize="10.5" fontWeight="600" textAnchor="middle" fill="#141413" fontFamily="Inter, sans-serif">Sarah</text>
                  <text x="210" y="90" fontSize="10.5" fontWeight="600" textAnchor="middle" fill="#141413" fontFamily="Inter, sans-serif">Chen</text>
                  <text x="210" y="121" fontSize="9" textAnchor="middle" fill="#8e8b82" fontFamily="Inter, sans-serif">Rippling · 2 yrs</text>

                  {/* ── Node: James Park (target, larger) ── */}
                  <circle cx="368" cy="155" r="34" fill="#faf9f5" stroke="#d4762a" strokeWidth="2" />
                  <text x="368" y="150" fontSize="11" fontWeight="700" textAnchor="middle" fill="#141413" fontFamily="Inter, sans-serif">James</text>
                  <text x="368" y="164" fontSize="11" fontWeight="700" textAnchor="middle" fill="#141413" fontFamily="Inter, sans-serif">Park</text>
                  {/* Warmth badge */}
                  <rect x="344" y="108" width="48" height="18" rx="9" fill="#d4762a" />
                  <text x="368" y="120" fontSize="9.5" fontWeight="700" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif">94 warm</text>
                  <text x="368" y="200" fontSize="9" textAnchor="middle" fill="#8e8b82" fontFamily="Inter, sans-serif">VP Sales · Stripe</text>

                  {/* ── Node: Marcus Lee (cold) ── */}
                  <circle cx="200" cy="240" r="22" fill="#faf9f5" stroke="#e6dfd8" strokeWidth="1.5" />
                  <text x="200" y="236" fontSize="9.5" fontWeight="500" textAnchor="middle" fill="#6c6a64" fontFamily="Inter, sans-serif">Marcus</text>
                  <text x="200" y="248" fontSize="9.5" fontWeight="500" textAnchor="middle" fill="#6c6a64" fontFamily="Inter, sans-serif">Lee</text>
                  <text x="200" y="273" fontSize="9" textAnchor="middle" fill="#a09d96" fontFamily="Inter, sans-serif">ex-LinkedIn</text>

                  {/* ── Node: Amy Liu (cold) ── */}
                  <circle cx="340" cy="52" r="20" fill="#faf9f5" stroke="#e6dfd8" strokeWidth="1.5" />
                  <text x="340" y="48" fontSize="9.5" fontWeight="500" textAnchor="middle" fill="#6c6a64" fontFamily="Inter, sans-serif">Amy</text>
                  <text x="340" y="60" fontSize="9.5" fontWeight="500" textAnchor="middle" fill="#6c6a64" fontFamily="Inter, sans-serif">Liu</text>
                  <text x="340" y="82" fontSize="9" textAnchor="middle" fill="#a09d96" fontFamily="Inter, sans-serif">Notion</text>
                </svg>

                {/* Bottom bar */}
                <div
                  className="flex items-center justify-between pt-4 mt-1"
                  style={{ borderTop: "1px solid #e6dfd8" }}
                >
                  <span className="text-xs" style={{ color: "#8e8b82" }}>5 team relationships mapped</span>
                  <span className="text-xs font-semibold text-brand">Warm path found · 1 hop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The problem surface-soft band */}
      <section className="px-6 py-16" style={{ backgroundColor: "#f5f0e8" }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-5">
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "#faf9f5", border: "1px solid #e6dfd8" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#c64545" }}>Without WarmPath</p>
              <div className="space-y-3">
                {[
                  "200 cold emails. 6 replies. 1 meeting.",
                  "Your best lead got to a competitor who knew someone inside.",
                  "AE spent 4 hours researching an account your colleague knows personally.",
                  "Funding round closes. You find out 3 weeks later.",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2.5 text-sm" style={{ color: "#6c6a64" }}>
                    <X className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#c64545" }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "#faf9f5", border: "1px solid #e6dfd8" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#5db872" }}>With WarmPath</p>
              <div className="space-y-3">
                {[
                  "Funding signal fires. Warm path surfaces in 30 seconds.",
                  "Sarah Chen worked with the VP 2 years ago sends the intro.",
                  "Reply in 4 hours. Meeting booked same week.",
                  "Every ICP account has a warmth score. No more guessing who to call.",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2.5 text-sm" style={{ color: "#3d3d3a" }}>
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#5db872" }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-24" style={{ backgroundColor: "#faf9f5" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-brand">How it works</p>
            <h2
              className="text-[40px] font-normal tracking-tight"
              style={{ fontFamily: "var(--font-display), Georgia, serif", letterSpacing: "-0.5px", color: "#141413" }}
            >
              From signal to signed deal.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "01", title: "Map your team's network", body: "Every past colleague, conference contact, LinkedIn connection aggregated across your whole team. One graph, shared visibility." },
              { n: "02", title: "Get alerted on signals", body: "Funding, leadership changes, hiring surges, champion promotions. Ranked by urgency. Paired with the best warm path to act on each." },
              { n: "03", title: "Route through warmth", body: "BFS pathfinding finds the shortest credible intro. One hop from a trusted colleague beats 50 cold emails. Every time." },
              { n: "04", title: "Review, then send", body: "AI drafts the intro request and outreach message. You approve before anything leaves. Full audit trail. No surprise sends." },
            ].map((step) => (
              <div
                key={step.n}
                className="rounded-xl p-6"
                style={{ backgroundColor: "#efe9de", border: "1px solid #e6dfd8" }}
              >
                <div className="text-[10px] font-bold tracking-widest mb-4" style={{ color: "#8e8b82" }}>{step.n}</div>
                <h3 className="font-semibold text-[15px] mb-2" style={{ color: "#141413" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6c6a64" }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features surface-soft */}
      <section className="px-6 py-24" style={{ backgroundColor: "#f5f0e8" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-brand">Product</p>
            <h2
              className="text-[40px] font-normal tracking-tight max-w-xl"
              style={{ fontFamily: "var(--font-display), Georgia, serif", letterSpacing: "-0.5px", color: "#141413" }}
            >
              Three surfaces. One warm-outbound system.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                Icon: Network,
                title: "Relationship Graph",
                sub: "See your whole team's network not just yours.",
                body: "WarmPath aggregates every relationship across your team into a shared graph. LinkedIn connections, past colleagues, conference contacts, email history. BFS pathfinding computes the warmest route to any buyer in your ICP including 2nd and 3rd-degree paths your reps don't know exist.",
                tags: ["Multi-hop BFS routing", "Warmth scoring 0–100", "Coverage gap detection", "Team-wide visibility"],
              },
              {
                Icon: Zap,
                title: "Buying Signals",
                sub: "Know the moment an account enters buying mode.",
                body: "13+ signal types tracked in real time: funding rounds, leadership changes, hiring surges, champion job moves, competitor hiring, G2 intent spikes, product launches. Every signal is urgency-scored, paired with the warmest intro path, and surfaced before your competitors see it.",
                tags: ["13+ signal types", "Urgency ranking", "Auto-matched warm paths", "Champion tracking"],
              },
              {
                Icon: ShieldCheck,
                title: "Approval Queue",
                sub: "AI drafts. Humans decide. Nothing sends without a review.",
                body: "Every intro request, follow-up email, and LinkedIn DM goes through a structured review step. WarmPath drafts with full relationship context the shared history, the reason for the intro, the ask. Your team approves or edits before it sends. Full audit trail on every decision.",
                tags: ["Human-in-the-loop", "Multi-channel", "Full audit trail", "Risk flagging"],
              },
            ].map(({ Icon, title, sub, body, tags }) => (
              <div
                key={title}
                className="rounded-xl p-7 grid md:grid-cols-[1fr_1.6fr] gap-8 items-start"
                style={{ backgroundColor: "#faf9f5", border: "1px solid #e6dfd8" }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "rgba(204,120,92,0.1)", border: "1px solid rgba(204,120,92,0.15)" }}
                    >
                      <Icon className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px]" style={{ color: "#141413" }}>{title}</h3>
                      <p className="text-xs" style={{ color: "#8e8b82" }}>{sub}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] rounded-full px-2.5 py-1"
                        style={{ border: "1px solid #e6dfd8", backgroundColor: "#efe9de", color: "#6c6a64" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#6c6a64", lineHeight: "1.65" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials canvas */}
      <section className="px-6 py-20" style={{ backgroundColor: "#faf9f5" }}>
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-brand">What teams say</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                quote: "We booked 11 meetings in the first month just from signals we would have missed entirely. The warm path engine is genuinely different from anything else we've tried.",
                name: "Marcus T.",
                role: "Head of Sales · Series B SaaS",
              },
              {
                quote: "I stopped sending cold emails. Not because I had to because WarmPath kept surfacing 1-hop paths I didn't know existed. My reply rate tripled.",
                name: "Priya K.",
                role: "Account Executive · Enterprise GTM",
              },
              {
                quote: "The approval queue alone is worth it. We used to have reps fire off LinkedIn messages with no context. Now every message has been reviewed and is on-brand.",
                name: "James W.",
                role: "VP Revenue · Post-Series A",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl p-6 flex flex-col justify-between gap-6"
                style={{ backgroundColor: "#efe9de", border: "1px solid #e6dfd8" }}
              >
                <p className="text-sm leading-relaxed" style={{ color: "#3d3d3a", lineHeight: "1.65" }}>"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#141413" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "#8e8b82" }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare surface-soft */}
      <section id="compare" className="px-6 py-20" style={{ backgroundColor: "#f5f0e8" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-brand">Compare</p>
            <h2
              className="text-[40px] font-normal tracking-tight"
              style={{ fontFamily: "var(--font-display), Georgia, serif", letterSpacing: "-0.5px", color: "#141413" }}
            >
              Built differently.
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#8e8b82" }}>
              Apollo prospects. Clay enriches. Artisan auto-sends. WarmPath finds the right path first.
            </p>
          </div>

          <div
            className="overflow-x-auto rounded-xl"
            style={{ backgroundColor: "#faf9f5", border: "1px solid #e6dfd8" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #e6dfd8" }}>
                  <th className="px-5 py-4 text-left text-xs font-semibold" style={{ color: "#8e8b82" }}>Feature</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-brand">WarmPath</th>
                  {["Apollo", "Clay", "Artisan"].map((c) => (
                    <th key={c} className="px-4 py-4 text-center text-xs font-semibold" style={{ color: "#8e8b82" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      borderBottom: i < COMPARISON.length - 1 ? "1px solid #ebe6df" : "none",
                      backgroundColor: i % 2 === 0 ? "rgba(239,233,222,0.3)" : "transparent",
                    }}
                  >
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6c6a64" }}>{row.feature}</td>
                    {(["warmpath", "apollo", "clay", "artisan"] as const).map((col) => {
                      const val = row[col];
                      return (
                        <td key={col} className="px-4 py-3.5 text-center">
                          {val === true ? (
                            <CheckCircle className={`mx-auto h-4 w-4 ${col === "warmpath" ? "text-brand" : ""}`} style={col !== "warmpath" ? { color: "#5db872" } : {}} />
                          ) : val === "partial" ? (
                            <Minus className="mx-auto h-4 w-4" style={{ color: "#e6dfd8" }} />
                          ) : (
                            <X className="mx-auto h-3.5 w-3.5" style={{ color: "#e6dfd8" }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ canvas */}
      <section id="faq" className="px-6 py-20" style={{ backgroundColor: "#faf9f5" }}>
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-brand">FAQ</p>
          <h2
            className="text-[40px] font-normal tracking-tight mb-10"
            style={{ fontFamily: "var(--font-display), Georgia, serif", letterSpacing: "-0.5px", color: "#141413" }}
          >
            Common questions
          </h2>
          {[
            { q: "What does WarmPath replace?", a: "Not your CRM. WarmPath replaces the fragmented process of manually hunting for intros, piecing together account context, and sending cold emails to people you almost know." },
            { q: "Is this a cold outbound tool?", a: "No. The core is warm routing. When there's no credible path to an account, WarmPath tells you that instead of sending automated cold messages dressed up as warm outreach." },
            { q: "Why require human approval before sending?", a: "Warm outreach is reputation-sensitive. One bad intro request can damage a relationship. AI handles research and drafting. You control what leaves your team." },
            { q: "Does this work for small sales teams?", a: "Yes actually better. A 5-person team has a combined network of thousands. WarmPath surfaces relationships that no one person would think to check." },
          ].map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* CTA band brand orange (callout-card-coral equivalent) */}
      <section className="px-6 py-6" style={{ backgroundColor: "#faf9f5" }}>
        <div className="mx-auto max-w-6xl">
          <div
            className="rounded-2xl px-12 py-16 text-center"
            style={{ backgroundColor: "#181715" }}
          >
            <h2
              className="text-[36px] sm:text-[44px] font-normal leading-tight mb-5"
              style={{ fontFamily: "var(--font-display), Georgia, serif", letterSpacing: "-0.5px", color: "#faf9f5" }}
            >
              Stop sending cold emails<br />
              <span className="text-brand">to people you almost know.</span>
            </h2>
            <p className="text-base mb-10 leading-relaxed max-w-md mx-auto" style={{ color: "#8e8b82" }}>
              Open the demo workspace. See your team's relationship graph, live buying signals, and warm paths to every account in your ICP.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-lg text-[14px] font-medium text-white bg-brand hover:opacity-90 transition-opacity"
              >
                Open demo workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-11 px-6 rounded-lg text-[14px] font-medium transition-colors"
                style={{ border: "1px solid #252320", color: "#a09d96", backgroundColor: "#252320" }}
              >
                Create free account
              </Link>
            </div>
            <p className="text-xs mt-5" style={{ color: "#6c6a64" }}>No credit card required · Demo ready in seconds</p>
          </div>
        </div>
      </section>

      {/* Footer dark */}
      <footer className="px-6 py-12" style={{ backgroundColor: "#181715" }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4 pb-8 mb-8" style={{ borderBottom: "1px solid #252320" }}>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand">
                <GitFork className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-tight" style={{ color: "#faf9f5" }}>WarmPath</span>
            </div>
            <div className="flex items-center gap-6 text-xs" style={{ color: "#6c6a64" }}>
              <a href="#how" className="hover:text-[#a09d96] transition-colors">How it works</a>
              <a href="#compare" className="hover:text-[#a09d96] transition-colors">Compare</a>
              <a href="#faq" className="hover:text-[#a09d96] transition-colors">FAQ</a>
              <Link href="/login" className="hover:text-[#a09d96] transition-colors">Sign in</Link>
            </div>
          </div>
          <p className="text-xs" style={{ color: "#6c6a64" }}>© {new Date().getFullYear()} WarmPath · warmpath.ai</p>
        </div>
      </footer>
    </div>
  );
}
