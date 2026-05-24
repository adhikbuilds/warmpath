"use client";

import { ArrowRight, GitFork } from "lucide-react";
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
  { feature: "Team-wide relationship graph", warmpath: true, apollo: false, clay: "partial", artisan: false },
  { feature: "Warm intro path routing", warmpath: true, apollo: false, clay: false, artisan: false },
  { feature: "Connector approval before any send", warmpath: true, apollo: false, clay: false, artisan: false },
  { feature: "Signal-triggered sequences (13+ types)", warmpath: true, apollo: "partial", clay: "partial", artisan: "partial" },
  { feature: "Per-message 1:1 AI personalization", warmpath: true, apollo: "partial", clay: "partial", artisan: true },
  { feature: "Relationship quality evidence", warmpath: true, apollo: false, clay: false, artisan: false },
  { feature: "Multi-channel (email, LinkedIn, WhatsApp, phone)", warmpath: true, apollo: true, clay: "partial", artisan: true },
];

const TESTIMONIALS = [
  {
    quote: "First sequence I ran had a 41% reply rate. My previous Apollo sequences never broke 8%. Every message sounds like it was written for that specific person — because it was.",
    name: "Marcus Rodriguez",
    title: "Senior Account Executive",
    company: "Rippling",
    initials: "MR",
  },
  {
    quote: "We mapped 3,400 connections across our team in under 5 minutes. Found warm paths to 78% of our ICP — accounts we'd been cold-calling for months.",
    name: "Jamie Chen",
    title: "VP of Sales",
    company: "Lattice",
    initials: "JC",
  },
  {
    quote: "The approval queue is what sold our leadership. Nothing sends under a connector's name without their explicit OK. That removed every legal and reputational concern overnight.",
    name: "Priya Sharma",
    title: "Head of Revenue",
    company: "Notion",
    initials: "PS",
  },
];

function CompareCell({ val, isWarmPath }: { val: CompareVal; isWarmPath?: boolean }) {
  if (val === true)
    return (
      <svg className="mx-auto w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={isWarmPath ? "#8083ff" : "#4edea3"} strokeWidth="3">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    );
  if (val === "partial")
    return <div className="mx-auto w-3 h-0.5" style={{ backgroundColor: "#908fa0" }} />;
  return <svg className="mx-auto w-4 h-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="#908fa0" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#131315", color: "#e5e1e4" }}>
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: "rgba(19, 19, 21, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #464554" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md" style={{ backgroundColor: "#8083ff" }}>
              <GitFork className="w-3.5 h-3.5 text-white m-1" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">WarmPath</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-sm text-[#c7c4d7] hover:text-white transition-colors">How it works</a>
            <a href="#compare" className="text-sm text-[#c7c4d7] hover:text-white transition-colors">Compare</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block text-sm text-[#c7c4d7] hover:text-white transition-colors">Sign in</Link>
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-full text-[#131315] transition-colors hover:bg-gray-100" style={{ backgroundColor: "white" }}>
              Try demo
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl lg:text-6xl font-semibold leading-tight text-white tracking-tight">
              See which deals your team can close this week.
            </h1>
            <p className="text-base text-[#c7c4d7] max-w-md">
              WarmPath maps every relationship your team has, finds the warmest path to every buyer, and drafts the intro. One person approves it. One deal moves forward.
            </p>
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="text-sm font-medium px-6 py-3 rounded-full text-[#131315] transition-colors hover:bg-gray-100" style={{ backgroundColor: "white" }}>
                Open demo workspace
              </Link>
            </div>
          </div>

          {/* Right: Glass Panel Widget */}
          <div className="rounded-xl p-6 shadow-2xl" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: "1px solid #464554" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(128, 131, 255, 0.1)", border: "1px solid rgba(128, 131, 255, 0.3)" }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#8083ff" }} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">Stripe raised $694M Series H</h3>
                  <p className="text-xs text-[#c7c4d7]">budget cycle unlocked</p>
                </div>
              </div>
              <span className="text-xs text-[#c7c4d7]">2h ago</span>
            </div>

            {/* Warm Path Info */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4" style={{ color: "#4edea3" }}>→</div>
                <span className="text-sm font-medium text-white">Warm path found</span>
              </div>
              <p className="text-xs text-[#c7c4d7]">1 hop · 94 warmth score</p>
            </div>

            {/* Path Nodes */}
            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-6 top-6 bottom-6 w-px" style={{ backgroundColor: "#464554" }} />

              {/* Node 1: You */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center z-10" style={{ backgroundColor: "#131315", border: "1px solid #464554" }}>
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "#908fa0" }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">You</p>
                  <p className="text-xs text-[#c7c4d7]">AE</p>
                </div>
              </div>

              {/* Node 2: Connector */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center z-10" style={{ backgroundColor: "#131315", border: "1px solid rgba(128, 131, 255, 0.5)" }}>
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "#908fa0" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">James Liu</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#4edea3", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                      94 warm
                    </span>
                  </div>
                  <p className="text-xs text-[#c7c4d7]">connector / ex-Rippling · 2 yrs</p>
                </div>
              </div>

              {/* Node 3: Target */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center z-10" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "#908fa0" }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">CTO at Stripe</p>
                  <p className="text-xs text-[#c7c4d7]">Decision maker</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 flex justify-between items-center" style={{ borderTop: "1px solid #464554" }}>
              <p className="text-xs text-[#c7c4d7]">4 team connections mapped to Stripe</p>
              <p className="text-xs font-medium text-white">Best path: 1 hop</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="rounded-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
          {[
            { val: "3x", label: "higher reply rate\nthan cold email" },
            { val: "47%", label: "reply rate on\nwarm intros" },
            { val: "1-hop", label: "average intro\npath length" },
            { val: "100%", label: "connector-approved\nbefore send" },
          ].map((stat) => (
            <div key={stat.val} className="flex flex-col items-center text-center px-4" style={{ borderRight: stat.val !== "100%" ? "1px solid #464554" : "none" }}>
              <span className="text-4xl font-semibold mb-2" style={{ color: "#4edea3" }}>{stat.val}</span>
              <span className="text-xs uppercase tracking-wider text-[#c7c4d7]">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold text-white mb-4">From signal to meeting — in hours, not weeks.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Your team's network, mapped",
              body: "LinkedIn connections, shared employers, alumni networks — aggregated across every team member into one searchable relationship graph. What was invisible is now searchable.",
            },
            {
              title: "WarmPath finds the route",
              body: "The moment a buying signal fires — funding, hiring, leadership change — the AI finds who on your team knows the decision maker and why. Evidence-backed, not guessed.",
            },
            {
              title: "Draft, approve, send",
              body: "AI writes a 1:1 intro request grounded in the real shared history. Your connector reviews and approves it personally before anything sends under their name. Every time.",
            },
          ].map((step, i) => (
            <div key={i} className="rounded-xl p-8" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
              <div className="w-10 h-10 rounded flex items-center justify-center mb-6" style={{ backgroundColor: "#464554" }}>
                <div className="w-5 h-5" style={{ color: "white" }}>○</div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-[#c7c4d7] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-white mb-2">Real results from enterprise sales teams.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-xl p-6 flex flex-col" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
              <p className="text-sm leading-relaxed flex-1 mb-4 text-[#c7c4d7]">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: "#8083ff" }}>
                  {t.initials}
                </span>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-[#c7c4d7]">{t.title} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARE */}
      <section id="compare" className="max-w-7xl mx-auto px-6 mb-32">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-white mb-3">Built differently.</h2>
          <p className="text-sm text-[#c7c4d7]">
            Apollo finds prospects. Clay enriches them. Artisan auto-sends. WarmPath routes through relationships first — then gets human approval on every message.
          </p>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #464554" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#201f22", borderBottom: "1px solid #464554" }}>
                <th className="px-5 py-4 text-left text-xs font-medium text-[#c7c4d7]">Capability</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-[#8083ff]">WarmPath</th>
                {["Apollo", "Clay", "Artisan"].map((c) => (
                  <th key={c} className="px-4 py-4 text-center text-xs font-medium text-[#c7c4d7]">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.feature} style={{ backgroundColor: "#131315", borderBottom: i < COMPARISON.length - 1 ? "1px solid #464554" : "none" }}>
                  <td className="px-5 py-3 text-xs text-[#c7c4d7]">{row.feature}</td>
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
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", backdropFilter: "blur(12px)" }}>
          <h2 className="text-4xl font-semibold text-white mb-6">Your best deal is one warm intro away.</h2>
          <Link href="/login" className="inline-block text-sm font-medium px-6 py-3 rounded-full text-[#131315] transition-colors hover:bg-gray-100" style={{ backgroundColor: "white" }}>
            Open demo workspace
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t" style={{ backgroundColor: "#131315", borderColor: "#464554" }}>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h3 className="text-lg font-bold text-white mb-6">WarmPath</h3>
          <p className="text-xs text-[#c7c4d7] mb-4">© 2026 WarmPath Relationship Intelligence. All rights reserved.</p>
          <div className="flex gap-4 justify-center">
            <a href="#" className="text-xs text-[#c7c4d7] hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-[#c7c4d7] hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
