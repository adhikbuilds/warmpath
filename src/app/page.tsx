"use client";

import { ArrowRight, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);

  const bg = isDark ? "#09090b" : "#ffffff";
  const surface = isDark ? "#18181b" : "#f5f5f5";
  const border = isDark ? "#27272a" : "#e5e5e5";
  const text = isDark ? "#e5e1e4" : "#1a1a1a";
  const muted = isDark ? "#a1a1aa" : "#666666";
  const primary = "#4f46e5";
  const accent = "#10b981";

  return (
    <div
      className="relative min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: bg,
        color: text,
        backgroundImage: isDark
          ? "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)"
          : "linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* ── NAVIGATION ────────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 border-b transition-colors duration-300"
        style={{
          backgroundColor: isDark ? "rgba(9,9,11,0.8)" : "rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          borderColor: border,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="text-[20px] font-bold tracking-tight">
            WarmPath
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#usecases"
              className="text-[13px] hover:text-current transition-colors"
              style={{ color: muted }}
            >
              Use cases
            </a>
            <a
              href="#compare"
              className="text-[13px] hover:text-current transition-colors"
              style={{ color: muted }}
            >
              Compare
            </a>
            <a
              href="#roi"
              className="text-[13px] hover:text-current transition-colors"
              style={{ color: muted }}
            >
              ROI
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: surface, color: text }}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/login"
              className="hidden md:block text-[13px] transition-colors"
              style={{ color: muted }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: primary, color: "white" }}
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────────── */}
      <main className="pt-32 pb-24">
        {/* ── HERO SECTION ───────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 mb-8 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div className="flex flex-col gap-6">
              <h1
                className="text-[48px] lg:text-[64px] lg:leading-[72px] font-semibold tracking-tight"
                style={{ color: text }}
              >
                Activate your relationship graph for revenue.
              </h1>
              <p className="text-[16px] leading-relaxed max-w-xl" style={{ color: muted }}>
                Map warm paths to every decision maker on your target accounts. Get AI-drafted
                intros approved in minutes. Close more deals through relationships, not cold
                outreach.
              </p>
              <div className="flex gap-4 mt-4">
                <Link
                  href="/login"
                  className="text-[14px] font-medium px-6 py-3 rounded-lg transition-opacity hover:opacity-90 flex items-center gap-2"
                  style={{ backgroundColor: primary, color: "white" }}
                >
                  Start free trial <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#usecases"
                  className="text-[14px] font-medium px-6 py-3 rounded-lg transition-colors"
                  style={{ backgroundColor: surface, color: text, border: `1px solid ${border}` }}
                >
                  See in action
                </Link>
              </div>
              <p className="text-[12px] mt-4" style={{ color: muted }}>
                Used by 500+ revenue teams at Series B+ companies
              </p>
            </div>

            {/* Hero Visual — minimal, data-focused */}
            <div
              className="rounded-xl p-6 transition-colors"
              style={{
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${border}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="space-y-4">
                {/* Deal card */}
                <div
                  className="rounded-lg p-4 transition-colors"
                  style={{ backgroundColor: surface, border: `1px solid ${border}` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[13px] font-semibold" style={{ color: text }}>
                        Stripe CTO evaluation
                      </h3>
                      <p className="text-[11px] mt-1" style={{ color: muted }}>
                        $500k ACV opportunity
                      </p>
                    </div>
                    <span
                      className="text-[11px] px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${accent}20`,
                        color: accent,
                        border: `1px solid ${accent}40`,
                      }}
                    >
                      1-hop path
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2 py-2 px-3 rounded"
                    style={{ backgroundColor: isDark ? "#27272a" : "#eeeeee" }}
                  >
                    <span style={{ color: accent }}>→</span>
                    <span className="text-[12px]" style={{ color: text }}>
                      You → James Liu (ex-Rippling) → CTO
                    </span>
                  </div>
                  <p className="text-[11px] mt-3" style={{ color: muted }}>
                    Warmth: 94 • Shared: 2yr overlap • Connector: Approved
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Prospects mapped", value: "1,240" },
                    { label: "Warm paths found", value: "847" },
                    { label: "Avg path length", value: "1.2 hops" },
                    { label: "Team approval rate", value: "99%" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded p-3 transition-colors"
                      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
                    >
                      <div className="text-[14px] font-semibold" style={{ color: primary }}>
                        {m.value}
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: muted }}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ROI PROOF ──────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div
            className="rounded-xl p-8 grid grid-cols-1 md:grid-cols-4 gap-8 transition-colors"
            style={{ backgroundColor: surface, border: `1px solid ${border}` }}
          >
            {[
              { metric: "3.2x", desc: "higher reply rate vs cold email", source: "industry data" },
              { metric: "47%", desc: "reply rate on warm intros", source: "HubSpot research" },
              {
                metric: "18 days",
                desc: "faster deal cycle via warm paths",
                source: "customer average",
              },
              {
                metric: "60%",
                desc: "reduction in cold outreach spend",
                source: "customer report",
              },
            ].map((stat) => (
              <div
                key={stat.metric}
                className="border-l"
                style={{ borderColor: border, paddingLeft: "24px" }}
              >
                <div className="text-[40px] font-bold mb-2" style={{ color: accent }}>
                  {stat.metric}
                </div>
                <p className="text-[14px] font-medium mb-1" style={{ color: text }}>
                  {stat.desc}
                </p>
                <p className="text-[11px]" style={{ color: muted }}>
                  {stat.source}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── USE CASES ──────────────────────────────────────────────────────────── */}
        <section id="usecases" className="max-w-7xl mx-auto px-6 mb-32">
          <div className="mb-16">
            <h2 className="text-[40px] font-semibold tracking-tight mb-3" style={{ color: text }}>
              Built for your revenue playbook.
            </h2>
            <p className="text-[16px]" style={{ color: muted }}>
              From account executives to sales directors, warm paths unlock new revenue strategies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: "Account Executives",
                scenario: "You have 40 target accounts but no direct relationships.",
                solution:
                  "WarmPath reveals warm connections to 28 of them. In 2 hours, you're drafting intros.",
                impact: "3.2x higher reply rate than your cold email baseline.",
              },
              {
                role: "Sales Directors",
                scenario: "Your team sends cold outreach but gets no replies.",
                solution:
                  "You route outreach through relationship paths instead. Colleagues approve in 30 seconds.",
                impact: "60% less cold spend, 47% warm intro reply rate.",
              },
              {
                role: "Sales Ops / Revenue Leaders",
                scenario: "You have no visibility into which relationships drive deals.",
                solution: "WarmPath maps your entire network, scores paths, and tracks approvals.",
                impact: "18-day faster sales cycle on warm path deals.",
              },
            ].map((uc, i) => (
              <div
                key={i}
                className="rounded-xl p-8 transition-colors hover:border-current"
                style={{
                  backgroundColor: surface,
                  border: `1px solid ${border}`,
                  borderColor: isDark ? "#27272a" : "#e5e5e5",
                }}
              >
                <div
                  className="text-[13px] font-semibold uppercase tracking-wider mb-3"
                  style={{ color: primary }}
                >
                  {uc.role}
                </div>
                <h3 className="text-[18px] font-semibold mb-3" style={{ color: text }}>
                  {uc.scenario}
                </h3>
                <p className="text-[14px] mb-4" style={{ color: muted }}>
                  {uc.solution}
                </p>
                <div
                  className="rounded px-3 py-2 text-[13px] font-medium"
                  style={{
                    backgroundColor: `${accent}15`,
                    color: accent,
                    border: `1px solid ${accent}30`,
                  }}
                >
                  {uc.impact}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMPARE ────────────────────────────────────────────────────────────── */}
        <section id="compare" className="max-w-7xl mx-auto px-6 mb-32">
          <div className="mb-8">
            <h2 className="text-[40px] font-semibold tracking-tight mb-3" style={{ color: text }}>
              The difference: built on relationships, not automation.
            </h2>
            <p className="text-[16px]" style={{ color: muted }}>
              Apollo finds prospects. Clay enriches them. Artisan auto-sends. WarmPath routes
              through your relationships first — then gets human approval on every message.
            </p>
          </div>
          <div
            className="rounded-xl overflow-hidden transition-colors"
            style={{ border: `1px solid ${border}` }}
          >
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: surface, borderBottom: `1px solid ${border}` }}>
                  <th className="text-left px-6 py-4 font-semibold" style={{ color: text }}>
                    Capability
                  </th>
                  <th className="text-center px-6 py-4 font-semibold" style={{ color: text }}>
                    WarmPath
                  </th>
                  <th className="text-center px-6 py-4 font-semibold" style={{ color: text }}>
                    Apollo
                  </th>
                  <th className="text-center px-6 py-4 font-semibold" style={{ color: text }}>
                    Clay
                  </th>
                  <th className="text-center px-6 py-4 font-semibold" style={{ color: text }}>
                    Artisan
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Maps your internal relationships",
                    warmpath: true,
                    apollo: false,
                    clay: false,
                    artisan: false,
                  },
                  {
                    feature: "Finds warm paths to buyers",
                    warmpath: true,
                    apollo: false,
                    clay: false,
                    artisan: false,
                  },
                  {
                    feature: "Requires approver sign-off",
                    warmpath: true,
                    apollo: false,
                    clay: false,
                    artisan: false,
                  },
                  {
                    feature: "Prospect database",
                    warmpath: false,
                    apollo: true,
                    clay: false,
                    artisan: false,
                  },
                  {
                    feature: "Email enrichment",
                    warmpath: false,
                    apollo: true,
                    clay: true,
                    artisan: true,
                  },
                  {
                    feature: "Auto-send campaigns",
                    warmpath: false,
                    apollo: false,
                    clay: false,
                    artisan: true,
                  },
                  {
                    feature: "Buying signal detection",
                    warmpath: false,
                    apollo: true,
                    clay: true,
                    artisan: false,
                  },
                ].map((row) => (
                  <tr key={row.feature} style={{ borderBottom: `1px solid ${border}` }}>
                    <td className="px-6 py-4" style={{ color: text }}>
                      {row.feature}
                    </td>
                    <td
                      className="text-center px-6 py-4"
                      style={{ color: row.warmpath ? accent : muted }}
                    >
                      {row.warmpath ? "✓" : "—"}
                    </td>
                    <td
                      className="text-center px-6 py-4"
                      style={{ color: row.apollo ? accent : muted }}
                    >
                      {row.apollo ? "✓" : "—"}
                    </td>
                    <td
                      className="text-center px-6 py-4"
                      style={{ color: row.clay ? accent : muted }}
                    >
                      {row.clay ? "✓" : "—"}
                    </td>
                    <td
                      className="text-center px-6 py-4"
                      style={{ color: row.artisan ? accent : muted }}
                    >
                      {row.artisan ? "✓" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── ROI CALCULATOR ────────────────────────────────────────────────────────── */}
        <section id="roi" className="max-w-7xl mx-auto px-6 mb-32">
          <div
            className="rounded-xl p-8 text-center transition-colors"
            style={{ backgroundColor: surface, border: `1px solid ${border}` }}
          >
            <h2 className="text-[32px] font-semibold mb-4" style={{ color: text }}>
              Your ROI potential
            </h2>
            <p className="text-[16px] mb-8" style={{ color: muted }}>
              10 AEs, $100k ACV deals, 6-month sales cycle
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-[36px] font-bold mb-2" style={{ color: primary }}>
                  +$960K
                </div>
                <p className="text-[13px]" style={{ color: muted }}>
                  Additional ARR from warm path reply uplift
                </p>
              </div>
              <div>
                <div className="text-[36px] font-bold mb-2" style={{ color: primary }}>
                  12 weeks
                </div>
                <p className="text-[13px]" style={{ color: muted }}>
                  Payback period at typical deal sizes
                </p>
              </div>
              <div>
                <div className="text-[36px] font-bold mb-2" style={{ color: accent }}>
                  5.2x
                </div>
                <p className="text-[13px]" style={{ color: muted }}>
                  ROI in year 1 vs platform cost
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-block text-[14px] font-medium px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary, color: "white" }}
            >
              See full ROI model
            </Link>
          </div>
        </section>

        {/* ── FOOTER CTA ─────────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 text-center mb-24">
          <h2 className="text-[40px] font-semibold mb-4" style={{ color: text }}>
            Ready to activate warm paths?
          </h2>
          <p className="text-[16px] mb-8" style={{ color: muted }}>
            Start free. No credit card. Full access for 14 days.
          </p>
          <Link
            href="/login"
            className="inline-block text-[14px] font-medium px-8 py-4 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary, color: "white" }}
          >
            Start your free trial
          </Link>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────────────── */}
      <footer
        className="border-t transition-colors"
        style={{ borderColor: border, backgroundColor: surface }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12 flex justify-between items-center">
          <div style={{ color: muted }} className="text-[12px]">
            © 2025 WarmPath. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a
              href="#"
              style={{ color: muted }}
              className="text-[12px] hover:text-current transition-colors"
            >
              Docs
            </a>
            <a
              href="#"
              style={{ color: muted }}
              className="text-[12px] hover:text-current transition-colors"
            >
              Security
            </a>
            <a
              href="#"
              style={{ color: muted }}
              className="text-[12px] hover:text-current transition-colors"
            >
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
