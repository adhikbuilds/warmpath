"use client";

import { useEffect, useState, useCallback } from "react";
import { GitFork, ArrowRight, ChevronLeft, ChevronRight, Users, Zap, Network, CheckCircle, TrendingUp, DollarSign, Target } from "lucide-react";

const C = {
  canvas: "#faf9f5",
  card: "#efe9de",
  soft: "#f5f0e8",
  dark: "#181715",
  darkElevated: "#252320",
  ink: "#141413",
  body: "#3d3d3a",
  muted: "#6c6a64",
  hairline: "#e6dfd8",
  primary: "#cc785c",
  primaryLight: "#e8a98a",
  onDark: "#faf9f5",
  onDarkSoft: "#a09d96",
  amber: "#e8a55a",
  teal: "#5db8a6",
  success: "#5db872",
};

const SERIF = "var(--font-display, 'Lora', Georgia, serif)";
const SANS = "var(--font-sans, 'Inter', system-ui, sans-serif)";

// ─── Slide components ─────────────────────────────────────────────────────────

function SlideTitle() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8" style={{ backgroundColor: C.dark }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.primary}22 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div className="relative flex flex-col items-center gap-6 max-w-3xl">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: C.primary }}>
            <GitFork className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-semibold tracking-tight" style={{ color: C.onDark, fontFamily: SANS }}>WarmPath</span>
        </div>

        <h1 style={{
          fontFamily: SERIF, fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 400,
          lineHeight: 1.08, letterSpacing: "-1.5px", color: C.onDark,
        }}>
          Close deals through the people<br />
          <span style={{ color: C.primary }}>who already trust you</span>
        </h1>

        <p style={{ fontFamily: SANS, fontSize: 18, color: C.onDarkSoft, lineHeight: 1.6, maxWidth: 560 }}>
          AI-first relationship intelligence that finds warm intro paths, drafts personalized outreach,
          and routes every message through your team's trusted network.
        </p>

        <div className="flex items-center gap-3 mt-4">
          <div className="px-4 py-1.5 rounded-full text-xs font-medium tracking-wide" style={{ backgroundColor: `${C.primary}22`, color: C.primaryLight, border: `1px solid ${C.primary}44` }}>
            BITS Pilani · 2026
          </div>
          <div className="px-4 py-1.5 rounded-full text-xs font-medium tracking-wide" style={{ backgroundColor: `${C.teal}22`, color: C.teal, border: `1px solid ${C.teal}44` }}>
            GTM Intelligence
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideProblem() {
  const stats = [
    { number: "2%", label: "Average cold email reply rate", sub: "Industry benchmark, 2025" },
    { number: "67%", label: "Of sales time wasted on bad-fit prospects", sub: "Gartner Sales Report" },
    { number: "18mo", label: "Average enterprise sales cycle", sub: "For deals over $100K ACV" },
  ];

  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.dark }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>The Problem</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 400, letterSpacing: "-1px", color: C.onDark, lineHeight: 1.1, marginBottom: 48 }}>
          Cold outreach is<br /><span style={{ color: C.primaryLight }}>fundamentally broken</span>
        </h2>

        <div className="grid grid-cols-3 gap-6 mb-12">
          {stats.map((s) => (
            <div key={s.number} className="rounded-2xl p-8" style={{ backgroundColor: C.darkElevated, border: `1px solid #ffffff0d` }}>
              <div style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 400, color: C.primary, lineHeight: 1, marginBottom: 12 }}>{s.number}</div>
              <div style={{ fontFamily: SANS, fontSize: 15, color: C.onDark, fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.onDarkSoft }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-7" style={{ backgroundColor: `${C.primary}15`, border: `1px solid ${C.primary}30` }}>
          <p style={{ fontFamily: SANS, fontSize: 17, color: C.onDark, lineHeight: 1.7 }}>
            <span style={{ color: C.primaryLight, fontWeight: 600 }}>The root cause isn't messaging — it's trust.</span>
            {" "}Buyers ignore strangers, no matter how good the copy. The top 1% of sales reps
            already know this: they only reach out through people the buyer already trusts.
            Everyone else guesses.
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideSolution() {
  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.canvas }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>The Solution</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 400, letterSpacing: "-1px", color: C.ink, lineHeight: 1.1, marginBottom: 48 }}>
          Every prospect is 2-3 hops<br />from someone on your team
        </h2>

        <div className="grid grid-cols-2 gap-8">
          {/* SVG graph */}
          <div className="rounded-2xl flex items-center justify-center" style={{ backgroundColor: C.dark, minHeight: 300, padding: 32 }}>
            <svg width="100%" viewBox="0 0 400 260" style={{ maxWidth: 380 }}>
              {/* Cold path - gray */}
              <line x1="60" y1="130" x2="340" y2="130" stroke="#4a4845" strokeWidth="1.5" strokeDasharray="6,4" />
              {/* Warm path - orange */}
              <path d="M 60 130 Q 130 60 200 90 Q 270 120 340 130" fill="none" stroke={C.primary} strokeWidth="2.5" />
              <circle cx="200" cy="90" r="6" fill={C.primary} opacity="0.6" />
              {/* You node */}
              <circle cx="60" cy="130" r="22" fill={C.dark} stroke={C.primary} strokeWidth="2" />
              <text x="60" y="134" textAnchor="middle" fill={C.onDark} fontSize="9" fontFamily="system-ui" fontWeight="600">YOU</text>
              {/* Warm connection */}
              <circle cx="200" cy="90" r="20" fill="#252320" stroke={C.amber} strokeWidth="2" />
              <text x="200" y="87" textAnchor="middle" fill={C.amber} fontSize="7.5" fontFamily="system-ui">Sarah</text>
              <text x="200" y="98" textAnchor="middle" fill="#a09d96" fontSize="6.5" fontFamily="system-ui">VP Mktg</text>
              {/* Target */}
              <circle cx="340" cy="130" r="24" fill="#1a2a1a" stroke={C.teal} strokeWidth="2" />
              <text x="340" y="127" textAnchor="middle" fill={C.teal} fontSize="7.5" fontFamily="system-ui">James</text>
              <text x="340" y="138" textAnchor="middle" fill="#a09d96" fontSize="6.5" fontFamily="system-ui">VP Sales</text>
              {/* Warm badge */}
              <rect x="298" y="100" width="84" height="18" rx="9" fill={C.teal} opacity="0.15" />
              <text x="340" y="113" textAnchor="middle" fill={C.teal} fontSize="8" fontFamily="system-ui" fontWeight="600">94/100 warmth</text>
              {/* Cold label */}
              <text x="200" y="155" textAnchor="middle" fill="#4a4845" fontSize="9" fontFamily="system-ui">cold path — ignored</text>
              {/* Warm label */}
              <text x="200" y="68" textAnchor="middle" fill={C.primary} fontSize="9" fontFamily="system-ui" fontWeight="500">warm intro path</text>
            </svg>
          </div>

          {/* Feature list */}
          <div className="flex flex-col justify-center gap-5">
            {[
              { icon: Network, title: "Relationship graph engine", desc: "Maps connections across your entire team — LinkedIn, email, Salesforce, calendar." },
              { icon: Zap, title: "AI warm path finder", desc: "BFS pathfinding ranks every intro route by warmth score, recency, and relationship strength." },
              { icon: CheckCircle, title: "Human approval queue", desc: "Every message drafted by AI, reviewed and approved by a human before it sends." },
              { icon: Target, title: "Signal-triggered outreach", desc: "13+ buying signals (funding, hiring, champion job change) trigger perfectly-timed outreach." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.primary}18` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: C.primary }} />
                </div>
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideHowItWorks() {
  const steps = [
    { n: "01", title: "Connect your stack", desc: "OAuth into LinkedIn, Gmail, Salesforce, HubSpot. WarmPath ingests relationship signals in minutes." },
    { n: "02", title: "Graph is built", desc: "Every teammate's connections form a unified graph. Edge weights encode warmth: meeting history, email cadence, shared history." },
    { n: "03", title: "Target a prospect", desc: "Paste a LinkedIn URL or upload a list. WarmPath finds the warmest intro path and scores it 0-100." },
    { n: "04", title: "AI drafts, human approves", desc: "Personalized messages for each channel. A human reviews in the approval queue, then sends with one click." },
  ];

  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.soft }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>How It Works</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, letterSpacing: "-1px", color: C.ink, lineHeight: 1.1, marginBottom: 48 }}>
          From cold contact to warm intro<br />in under 5 minutes
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < 3 && (
                <div style={{
                  position: "absolute", top: 20, left: "60%", width: "80%", height: 1,
                  backgroundColor: C.hairline,
                }} />
              )}
              <div className="rounded-2xl p-6 h-full" style={{ backgroundColor: C.canvas, border: `1px solid ${C.hairline}` }}>
                <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, color: C.primary, lineHeight: 1, marginBottom: 16 }}>{s.n}</div>
                <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: C.ink, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideMarket() {
  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.canvas }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>Market Opportunity</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, letterSpacing: "-1px", color: C.ink, lineHeight: 1.1, marginBottom: 48 }}>
          A $12B market that's<br />never had a relationship-first solution
        </h2>

        <div className="grid grid-cols-3 gap-6 mb-10">
          {[
            { label: "TAM", value: "$12.4B", sub: "Sales Engagement + AI SDR platform market (2025)", color: C.primary },
            { label: "SAM", value: "$3.1B", sub: "B2B SaaS companies, 10-1000 sales reps, US + EU", color: C.amber },
            { label: "SOM", value: "$310M", sub: "SMB / mid-market segment, Year 3 target", color: C.teal },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl p-8 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}` }}>
              <div className="text-xs font-bold tracking-[0.15em] mb-3" style={{ color: m.color }}>{m.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 400, color: C.ink, lineHeight: 1, marginBottom: 12 }}>{m.value}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: C.soft, border: `1px solid ${C.hairline}` }}>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { stat: "93%", label: "of B2B buyers prefer referrals" },
              { stat: "4-5×", label: "higher close rate on warm intros vs cold" },
              { stat: "$0", label: "existing tools that automate warm paths" },
            ].map((i) => (
              <div key={i.label}>
                <div style={{ fontFamily: SERIF, fontSize: 32, color: C.primary, lineHeight: 1, marginBottom: 6 }}>{i.stat}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted }}>{i.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideProduct() {
  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.dark }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>Live Product</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, letterSpacing: "-1px", color: C.onDark, lineHeight: 1.1, marginBottom: 36 }}>
          Built and deployed — not a mockup
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {[
            {
              title: "Relationship Graph",
              desc: "Force-directed graph visualizing your team's network across LinkedIn, email, and CRM.",
              color: C.primary,
              preview: (
                <svg viewBox="0 0 200 120" style={{ width: "100%" }}>
                  {[
                    [100, 60, C.primary, "You", 18],
                    [40, 30, C.amber, "S.Chen", 14],
                    [160, 30, C.teal, "J.Park", 14],
                    [30, 90, "#6c6a64", "M.Liu", 12],
                    [170, 90, "#6c6a64", "K.Roy", 12],
                  ].map(([x, y, col, name, r], i) => (
                    <g key={i}>
                      <line x1="100" y1="60" x2={x as number} y2={y as number} stroke={i < 3 ? (col as string) : "#3d3d3a"} strokeWidth={i < 3 ? 1.5 : 1} opacity="0.6" />
                      <circle cx={x as number} cy={y as number} r={r as number} fill={C.darkElevated} stroke={col as string} strokeWidth="1.5" />
                      <text x={x as number} y={(y as number) + 4} textAnchor="middle" fill={col as string} fontSize="7" fontFamily="system-ui">{name}</text>
                    </g>
                  ))}
                </svg>
              ),
            },
            {
              title: "Warm Leads",
              desc: "Every prospect ranked by warmth score with the full intro path and suggested opener.",
              color: C.amber,
              preview: (
                <div style={{ fontFamily: SANS }}>
                  {[
                    { name: "James Park", score: 94, path: "You → Sarah → James" },
                    { name: "Lisa Wong", score: 78, path: "You → Mike → Lisa" },
                    { name: "Tom Shah", score: 61, path: "You → David → Tom" },
                  ].map((l) => (
                    <div key={l.name} className="flex items-center justify-between mb-2 rounded-lg px-3 py-2" style={{ backgroundColor: "#1f1e1b" }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.onDark, fontWeight: 600 }}>{l.name}</div>
                        <div style={{ fontSize: 8, color: C.onDarkSoft }}>{l.path}</div>
                      </div>
                      <div className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${C.amber}22`, color: C.amber, fontSize: 9 }}>{l.score}</div>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              title: "Approval Queue",
              desc: "AI-drafted messages across email, LinkedIn, WhatsApp — reviewed and sent by a human.",
              color: C.teal,
              preview: (
                <div style={{ fontFamily: SANS }}>
                  {[
                    { to: "James Park", channel: "Email", status: "pending" },
                    { to: "Lisa Wong", channel: "LinkedIn", status: "approved" },
                    { to: "Tom Shah", channel: "Email", status: "sent" },
                  ].map((m) => (
                    <div key={m.to} className="flex items-center justify-between mb-2 rounded-lg px-3 py-2" style={{ backgroundColor: "#1f1e1b" }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.onDark, fontWeight: 600 }}>{m.to}</div>
                        <div style={{ fontSize: 8, color: C.onDarkSoft }}>{m.channel}</div>
                      </div>
                      <div className="rounded-full px-2 py-0.5" style={{
                        backgroundColor: m.status === "sent" ? `${C.teal}22` : m.status === "approved" ? `${C.amber}22` : `${C.primary}22`,
                        color: m.status === "sent" ? C.teal : m.status === "approved" ? C.amber : C.primary,
                        fontSize: 8, fontWeight: 600,
                      }}>{m.status}</div>
                    </div>
                  ))}
                </div>
              ),
            },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl p-5" style={{ backgroundColor: C.darkElevated, border: `1px solid #ffffff0d` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: "0.1em", marginBottom: 6 }}>{p.title.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: C.onDarkSoft, lineHeight: 1.5, marginBottom: 14 }}>{p.desc}</div>
              <div className="rounded-lg overflow-hidden p-3" style={{ backgroundColor: C.dark }}>
                {p.preview}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideBusinessModel() {
  const plans = [
    {
      name: "Starter", price: "$199", per: "/seat/mo", color: C.teal,
      features: ["Up to 3 seats", "500 warm path lookups/mo", "Email + LinkedIn outreach", "Basic approval queue"],
    },
    {
      name: "Pro", price: "$399", per: "/seat/mo", color: C.primary, highlight: true,
      features: ["Unlimited seats", "Unlimited lookups", "All channels incl. WhatsApp", "AI signal monitoring", "CRM sync"],
    },
    {
      name: "Enterprise", price: "Custom", per: "", color: C.amber,
      features: ["Custom deployment", "SSO + audit logs", "Dedicated success", "SLA guarantee", "API access"],
    },
  ];

  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.canvas }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>Business Model</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, letterSpacing: "-1px", color: C.ink, lineHeight: 1.1, marginBottom: 48 }}>
          Seat-based SaaS with<br />usage-tiered AI
        </h2>

        <div className="grid grid-cols-3 gap-5 mb-8">
          {plans.map((p) => (
            <div key={p.name} className="rounded-2xl p-7" style={{
              backgroundColor: p.highlight ? C.dark : C.card,
              border: `1.5px solid ${p.highlight ? C.primary : C.hairline}`,
            }}>
              <div className="text-xs font-bold tracking-[0.15em] mb-4" style={{ color: p.color }}>{p.name.toUpperCase()}</div>
              <div className="flex items-end gap-1 mb-6">
                <span style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: p.highlight ? C.onDark : C.ink, lineHeight: 1 }}>{p.price}</span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: p.highlight ? C.onDarkSoft : C.muted, paddingBottom: 6 }}>{p.per}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: p.color }} />
                    <span style={{ fontFamily: SANS, fontSize: 12, color: p.highlight ? C.onDarkSoft : C.muted }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: DollarSign, label: "Unit Economics", stat: "~82% gross margin", sub: "AI costs pass-through above threshold" },
            { icon: TrendingUp, label: "Growth model", stat: "Land & expand", sub: "Start with 1 AE, grow to team-wide" },
            { icon: Users, label: "Target customer", stat: "10–500 seat sales teams", sub: "B2B SaaS, fintech, professional services" },
          ].map(({ icon: Icon, label, stat, sub }) => (
            <div key={label} className="rounded-xl p-5 flex gap-4 items-start" style={{ backgroundColor: C.soft, border: `1px solid ${C.hairline}` }}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.primary}18` }}>
                <Icon className="h-4 w-4" style={{ color: C.primary }} />
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 10, color: C.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: C.ink }}>{stat}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideCompetition() {
  const rows = [
    { feature: "Relationship graph (team-wide)", wp: true, apollo: false, clay: "partial", artisan: false, outreach: false },
    { feature: "Warm intro path routing", wp: true, apollo: false, clay: false, artisan: false, outreach: false },
    { feature: "Human approval queue", wp: true, apollo: false, clay: false, artisan: "partial", outreach: "partial" },
    { feature: "13+ buying signal types", wp: true, apollo: "partial", clay: "partial", artisan: "partial", outreach: false },
    { feature: "Multi-channel AI outreach", wp: true, apollo: true, clay: "partial", artisan: true, outreach: true },
    { feature: "Risk flags before send", wp: true, apollo: false, clay: false, artisan: false, outreach: false },
    { feature: "No-code setup", wp: true, apollo: true, clay: false, artisan: true, outreach: false },
  ];

  function Cell({ v }: { v: boolean | string }) {
    if (v === true) return <div className="flex justify-center"><div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.teal}22` }}><span style={{ color: C.teal, fontSize: 11 }}>✓</span></div></div>;
    if (v === false) return <div className="flex justify-center"><span style={{ color: "#3d3d3a", fontSize: 14 }}>—</span></div>;
    return <div className="flex justify-center"><div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.amber}22` }}><span style={{ color: C.amber, fontSize: 9, fontWeight: 700 }}>~</span></div></div>;
  }

  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.dark }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>Competitive Landscape</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: 400, letterSpacing: "-1px", color: C.onDark, lineHeight: 1.1, marginBottom: 36 }}>
          The only tool built around<br /><span style={{ color: C.primary }}>relationship-first outreach</span>
        </h2>

        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid #ffffff0d` }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: C.darkElevated }}>
                <th className="text-left px-5 py-3" style={{ fontFamily: SANS, fontSize: 11, color: C.onDarkSoft, fontWeight: 500 }}>Feature</th>
                {[
                  { name: "WarmPath", highlight: true },
                  { name: "Apollo" },
                  { name: "Clay" },
                  { name: "Artisan" },
                  { name: "Outreach" },
                ].map((h) => (
                  <th key={h.name} className="px-4 py-3" style={{ fontFamily: SANS, fontSize: 11, fontWeight: h.highlight ? 700 : 500, color: h.highlight ? C.primary : C.onDarkSoft, textAlign: "center" }}>
                    {h.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.feature} style={{ backgroundColor: i % 2 === 0 ? "#1c1b18" : C.dark, borderTop: `1px solid #ffffff06` }}>
                  <td className="px-5 py-3" style={{ fontFamily: SANS, fontSize: 12, color: C.onDarkSoft }}>{r.feature}</td>
                  <td className="px-4 py-3" style={{ backgroundColor: `${C.primary}08` }}><Cell v={r.wp} /></td>
                  <td className="px-4 py-3"><Cell v={r.apollo} /></td>
                  <td className="px-4 py-3"><Cell v={r.clay} /></td>
                  <td className="px-4 py-3"><Cell v={r.artisan} /></td>
                  <td className="px-4 py-3"><Cell v={r.outreach} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SlideTraction() {
  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.soft }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>Traction</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, letterSpacing: "-1px", color: C.ink, lineHeight: 1.1, marginBottom: 48 }}>
          From idea to live product<br />in 8 weeks
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            {[
              { label: "Full-stack product", desc: "Next.js 15 + FastAPI + PostgreSQL on Neon, deployed on Vercel + Railway", done: true },
              { label: "AI intelligence layer", desc: "Signal scoring, BFS path ranking, multi-channel message generation with Anthropic", done: true },
              { label: "Neon Postgres live", desc: "Seeded with demo workspace, accounts, contacts, warm paths, and campaigns", done: true },
              { label: "Public deployments", desc: "Frontend on Vercel, intelligence service on Railway — accessible to anyone", done: true },
              { label: "Beta pilot conversations", desc: "Outreach started to first 5 target customers in B2B SaaS", done: false },
              { label: "Seed round", desc: "Targeting ₹1.5Cr seed to hire 2 engineers and run first paid pilots", done: false },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 items-start">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full mt-0.5" style={{ backgroundColor: item.done ? `${C.teal}22` : `${C.muted}22`, border: `1.5px solid ${item.done ? C.teal : C.muted}` }}>
                  {item.done ? <span style={{ fontSize: 10, color: C.teal }}>✓</span> : <span style={{ fontSize: 10, color: C.muted }}>○</span>}
                </div>
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: item.done ? C.ink : C.muted }}>{item.label}</div>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-7" style={{ backgroundColor: C.canvas, border: `1px solid ${C.hairline}` }}>
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Tech Stack</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { layer: "Frontend", tech: "Next.js 15 · Tailwind v4 · Zustand" },
                  { layer: "Backend", tech: "FastAPI · SQLAlchemy · APScheduler" },
                  { layer: "Database", tech: "PostgreSQL on Neon (serverless)" },
                  { layer: "AI", tech: "Anthropic Claude · mock/local/remote modes" },
                  { layer: "Deploy", tech: "Vercel + Railway" },
                  { layer: "Auth", tech: "NextAuth · bcrypt" },
                ].map((t) => (
                  <div key={t.layer} className="rounded-lg p-3" style={{ backgroundColor: C.soft }}>
                    <div style={{ fontFamily: SANS, fontSize: 10, color: C.muted, marginBottom: 2 }}>{t.layer}</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: C.ink }}>{t.tech}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: C.primary, border: `1px solid ${C.primary}` }}>
              <div style={{ fontFamily: SANS, fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Try the live demo</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 14, color: "#fff" }}>demo@warmpath.ai / demo123</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Full product, real data, no signup needed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideTeam() {
  return (
    <div className="flex flex-col justify-center h-full px-16 py-12" style={{ backgroundColor: C.canvas }}>
      <div className="max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.2em] mb-4 uppercase" style={{ color: C.primary }}>The Team</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, letterSpacing: "-1px", color: C.ink, lineHeight: 1.1, marginBottom: 48 }}>
          Built at BITS Pilani by<br />founders who've felt the pain
        </h2>

        <div className="grid grid-cols-3 gap-6 mb-10">
          {[
            {
              name: "Adhik Agarwal",
              role: "CEO & Product",
              school: "BITS Pilani",
              bio: "Built and shipped WarmPath end-to-end. Background in distributed systems and product design. Previously interned at a Series B SaaS.",
              color: C.primary,
            },
            {
              name: "Co-founder",
              role: "CTO & Infrastructure",
              school: "BITS Pilani",
              bio: "Leads backend architecture, AI pipeline, and deployment infrastructure. Deep experience with Python, FastAPI, and LLM integrations.",
              color: C.amber,
            },
            {
              name: "Co-founder",
              role: "Growth & GTM",
              school: "BITS Pilani",
              bio: "Owns customer discovery, go-to-market strategy, and early sales. Previously ran outreach for a 50-person B2B team.",
              color: C.teal,
            },
          ].map((m) => (
            <div key={m.name} className="rounded-2xl p-7" style={{ backgroundColor: C.card, border: `1px solid ${C.hairline}` }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full mb-5" style={{ backgroundColor: `${m.color}22`, border: `2px solid ${m.color}` }}>
                <span style={{ fontFamily: SERIF, fontSize: 18, color: m.color }}>{m.name[0]}</span>
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: m.color, fontWeight: 600, marginBottom: 4 }}>{m.role}</div>
              <div className="text-xs font-medium mb-4 px-2 py-1 rounded-full inline-block" style={{ backgroundColor: `${m.color}15`, color: m.color }}>{m.school}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{m.bio}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: C.soft, border: `1px solid ${C.hairline}` }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 4 }}>Why we're building this</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              We watched senior sales leaders at BITS alumni companies close deals in weeks while junior reps flailed for months — the difference was always relationships, never effort.
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: C.soft, border: `1px solid ${C.hairline}` }}>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 4 }}>Advisors & network</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              Connected to the BITS Pilani entrepreneur network — 10,000+ alumni in founder and executive roles across India and Silicon Valley.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideAsk() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-16" style={{ backgroundColor: C.dark }}>
      <div style={{
        position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)",
        width: 700, height: 700, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.primary}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div className="relative max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.2em] mb-6 uppercase" style={{ color: C.primary }}>The Ask</p>
        <h2 style={{ fontFamily: SERIF, fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 400, letterSpacing: "-1.5px", color: C.onDark, lineHeight: 1.08, marginBottom: 32 }}>
          Seed round to go<br />from 0 to first <span style={{ color: C.primary }}>$1M ARR</span>
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { amount: "₹1.5Cr", label: "Seed raise target", color: C.primary },
            { amount: "18mo", label: "Runway at target spend", color: C.amber },
            { amount: "10", label: "Paying customers target, Month 6", color: C.teal },
          ].map((a) => (
            <div key={a.label} className="rounded-2xl p-6" style={{ backgroundColor: C.darkElevated, border: `1px solid #ffffff0d` }}>
              <div style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, color: a.color, lineHeight: 1, marginBottom: 8 }}>{a.amount}</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.onDarkSoft, lineHeight: 1.5 }}>{a.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6 mb-8 text-left" style={{ backgroundColor: C.darkElevated, border: `1px solid #ffffff0d` }}>
          <div style={{ fontFamily: SANS, fontSize: 12, color: C.onDarkSoft, marginBottom: 12 }}>USE OF FUNDS</div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { pct: "50%", use: "Engineering — hire 2 full-stack devs" },
              { pct: "25%", use: "GTM — pilot customers + sales ops" },
              { pct: "25%", use: "AI infra — Anthropic API + Neon scale" },
            ].map((u) => (
              <div key={u.use}>
                <div style={{ fontFamily: SERIF, fontSize: 28, color: C.primary, marginBottom: 4 }}>{u.pct}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: C.onDarkSoft, lineHeight: 1.5 }}>{u.use}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="rounded-full px-6 py-3 flex items-center gap-2" style={{ backgroundColor: C.primary }}>
            <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "#fff" }}>Try the live product</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
          <div className="rounded-full px-6 py-3" style={{ border: `1px solid #ffffff22` }}>
            <span style={{ fontFamily: SANS, fontSize: 14, color: C.onDarkSoft }}>demo@warmpath.ai · demo123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slide deck shell ──────────────────────────────────────────────────────────

const SLIDES = [
  { id: "title", label: "WarmPath", component: SlideTitle },
  { id: "problem", label: "Problem", component: SlideProblem },
  { id: "solution", label: "Solution", component: SlideSolution },
  { id: "how", label: "How It Works", component: SlideHowItWorks },
  { id: "market", label: "Market", component: SlideMarket },
  { id: "product", label: "Product", component: SlideProduct },
  { id: "model", label: "Business Model", component: SlideBusinessModel },
  { id: "competition", label: "Competition", component: SlideCompetition },
  { id: "traction", label: "Traction", component: SlideTraction },
  { id: "team", label: "Team", component: SlideTeam },
  { id: "ask", label: "The Ask", component: SlideAsk },
];

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const go = useCallback((next: number) => {
    if (next < 0 || next >= SLIDES.length || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(next);
      setTransitioning(false);
    }, 200);
  }, [transitioning]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") go(current + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(current - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, go]);

  const Slide = SLIDES[current].component;

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ fontFamily: SANS }}>
      {/* Slide content */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        <Slide />
      </div>

      {/* Top nav — slide title + counter */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20 pointer-events-none">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: C.primary }}>
            <GitFork className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-semibold" style={{ color: current === 0 || SLIDES[current].id === "problem" || SLIDES[current].id === "ask" || SLIDES[current].id === "competition" || SLIDES[current].id === "product" ? C.onDark : C.ink }}>
            WarmPath
          </span>
        </div>
        <div className="text-xs font-medium pointer-events-none" style={{
          color: current === 0 || SLIDES[current].id === "problem" || SLIDES[current].id === "ask" || SLIDES[current].id === "competition" || SLIDES[current].id === "product" ? C.onDarkSoft : C.muted
        }}>
          {current + 1} / {SLIDES.length}
        </div>
      </div>

      {/* Bottom nav — dots + arrows */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 px-6 py-5 z-20">
        <button
          onClick={() => go(current - 1)}
          disabled={current === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
          style={{ backgroundColor: "rgba(0,0,0,0.25)", opacity: current === 0 ? 0.3 : 1 }}
        >
          <ChevronLeft className="h-4 w-4 text-white" />
        </button>

        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => go(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                backgroundColor: i === current ? C.primary : "rgba(255,255,255,0.3)",
              }}
              title={s.label}
            />
          ))}
        </div>

        <button
          onClick={() => go(current + 1)}
          disabled={current === SLIDES.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
          style={{ backgroundColor: "rgba(0,0,0,0.25)", opacity: current === SLIDES.length - 1 ? 0.3 : 1 }}
        >
          <ChevronRight className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Keyboard hint (first slide only) */}
      {current === 0 && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="px-4 py-2 rounded-full text-xs" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: C.onDarkSoft }}>
            Use arrow keys or click to navigate
          </div>
        </div>
      )}
    </div>
  );
}
