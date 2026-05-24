"use client";

import { ArrowRight, GitFork, Zap, Check, TrendingUp, Users, Shield } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#131315", color: "#e5e1e4" }}>
      {/* FIXED NAVIGATION */}
      <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: "rgba(19, 19, 21, 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #464554" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md" style={{ backgroundColor: "#8083ff" }}>
              <GitFork className="w-3.5 h-3.5 text-white m-1" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">WarmPath</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#platform" className="text-sm text-[#c7c4d7] hover:text-[#8083ff] transition-colors">Platform</a>
            <a href="#solutions" className="text-sm text-[#c7c4d7] hover:text-[#8083ff] transition-colors">Solutions</a>
            <a href="#network" className="text-sm text-[#c7c4d7] hover:text-[#8083ff] transition-colors">Network</a>
            <a href="#pricing" className="text-sm text-[#c7c4d7] hover:text-[#8083ff] transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#c7c4d7] hover:text-white transition-colors">Login</Link>
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-all hover:shadow-lg hover:shadow-[#8083ff]/40" style={{ backgroundColor: "#8083ff" }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="pt-32 pb-12">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-block mb-4 px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(128, 131, 255, 0.1)", border: "1px solid rgba(128, 131, 255, 0.2)" }}>
              <span className="text-xs font-semibold text-[#8083ff]">⚡ Relationship intelligence · B2B sales</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white mb-6">
              See which deals your team can close this week.
            </h1>
            <p className="text-lg text-[#c7c4d7] mb-8 max-w-2xl mx-auto">
              WarmPath maps every relationship your team has, finding the absolute shortest path to your next big contract. No more cold outreach.
            </p>
            <div className="flex flex-col items-center gap-2">
              <Link href="/login" className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#8083ff]/40 flex items-center gap-2" style={{ backgroundColor: "#8083ff" }}>
                Open demo workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-[#c7c4d7]">No signup required. Plays with demo data.</p>
            </div>
          </div>

          {/* FLOATING DASHBOARD VISUAL - Path Visualizer */}
          <div className="rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
            <div className="h-96 flex items-center justify-center p-12 relative" style={{ backgroundImage: "linear-gradient(90deg, rgba(128,131,255,0.05) 1px, transparent 1px), linear-gradient(rgba(128,131,255,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
              {/* Path visualization - You → Connector → Target */}
              <div className="flex items-center gap-4 bg-[#131315] p-4 rounded-lg border" style={{ borderColor: "#464554" }}>
                {/* You Node */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
                    <Users className="w-6 h-6 text-[#c7c4d7]" />
                  </div>
                  <span className="text-xs font-medium text-white">You</span>
                </div>

                {/* Animated connector line */}
                <div className="relative w-20 h-px" style={{ backgroundColor: "#464554" }}>
                  <div className="absolute inset-0 w-full h-full" style={{ background: "linear-gradient(90deg, #464554 0%, #4edea3 50%, #464554 100%)", animation: "pulse 2s ease-in-out infinite" }} />
                </div>

                {/* Connector Node - James Liu */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: "#8083ff", border: "2px solid #4edea3" }}>
                    JL
                  </div>
                  <span className="text-xs font-medium text-white">James Liu</span>
                  <div className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "rgba(78, 222, 163, 0.1)", color: "#4edea3", border: "1px solid rgba(78, 222, 163, 0.2)" }}>
                    94 warmth
                  </div>
                </div>

                {/* Animated connector line */}
                <div className="relative w-20 h-px" style={{ backgroundColor: "#464554" }}>
                  <div className="absolute inset-0 w-full h-full" style={{ background: "linear-gradient(90deg, #464554 0%, #8083ff 50%, #464554 100%)", animation: "pulse 2s ease-in-out infinite 0.5s" }} />
                </div>

                {/* Target Node - Stripe CTO */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: "#353437", border: "1px solid #464554" }}>
                    Stripe
                  </div>
                  <span className="text-xs font-medium text-white">CTO Target</span>
                </div>
              </div>

              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.5; }
                  50% { opacity: 1; }
                }
              `}</style>
            </div>
          </div>
        </section>

        {/* TRUST METRICS SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-b" style={{ borderColor: "#464554" }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { stat: "47%", label: "Reply Rate", desc: "+39% vs cold outreach", icon: TrendingUp },
              { stat: "1-Hop", label: "Avg Path Length", desc: "Direct connections mapped", icon: GitFork },
              { stat: "100%", label: "Connector-approved", desc: "Opt-in introduction requests", icon: Shield },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-3 py-4" style={{ borderTop: i > 0 ? "1px solid #464554" : "none", paddingTop: i > 0 ? "2rem" : "1rem" }}>
                  <Icon className="w-6 h-6 text-[#8083ff]" />
                  <div className="text-4xl font-bold text-[#8083ff]">{item.stat}</div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-[#c7c4d7]">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="platform" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How WarmPath works</h2>
            <p className="text-[#c7c4d7]">Three steps to every warm intro</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "1",
                title: "Map relationships",
                desc: "Your team's LinkedIn, shared companies, and alumni networks automatically aggregated into one searchable graph.",
              },
              {
                num: "2",
                title: "Find warm paths",
                desc: "When a signal fires, WarmPath finds who on your team knows the buyer and why. Ranked by connection strength.",
              },
              {
                num: "3",
                title: "AI drafts, you approve",
                desc: "Get a personalized 1:1 intro request. One person approves it before it sends under their name. Every time.",
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-8 relative" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
                <div className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg" style={{ backgroundColor: "rgba(128, 131, 255, 0.1)", color: "#8083ff" }}>
                  {item.num}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[#c7c4d7] text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section id="solutions" className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white mb-3">Built differently.</h2>
            <p className="text-[#c7c4d7]">
              Apollo finds prospects. Clay enriches them. Artisan auto-sends. WarmPath routes through relationships first — then gets human approval on every message.
            </p>
          </div>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#464554" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#201f22", borderBottom: "1px solid #464554" }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#c7c4d7]">Capability</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-[#8083ff]">WarmPath</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-[#c7c4d7]">Apollo</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-[#c7c4d7]">Clay</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-[#c7c4d7]">Artisan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Team-wide relationship graph", warmpath: true, apollo: false, clay: "partial", artisan: false },
                  { feature: "Warm intro path routing", warmpath: true, apollo: false, clay: false, artisan: false },
                  { feature: "Connector approval before any send", warmpath: true, apollo: false, clay: false, artisan: false },
                  { feature: "Signal-triggered sequences (13+ types)", warmpath: true, apollo: "partial", clay: "partial", artisan: "partial" },
                  { feature: "Per-message 1:1 AI personalization", warmpath: true, apollo: "partial", clay: "partial", artisan: true },
                  { feature: "Multi-channel (email, LinkedIn, phone)", warmpath: true, apollo: true, clay: "partial", artisan: true },
                ].map((row, i) => (
                  <tr key={i} style={{ backgroundColor: "#131315", borderBottom: i < 5 ? "1px solid #464554" : "none" }}>
                    <td className="px-6 py-4 text-xs text-[#c7c4d7]">{row.feature}</td>
                    {[row.warmpath, row.apollo, row.clay, row.artisan].map((val, j) => (
                      <td key={j} className="px-6 py-4 text-center">
                        {val === true && (
                          <Check className="w-4 h-4 mx-auto text-[#4edea3]" />
                        )}
                        {val === "partial" && (
                          <div className="mx-auto w-3 h-0.5" style={{ backgroundColor: "#908fa0" }} />
                        )}
                        {val === false && (
                          <div className="mx-auto w-4 h-4 opacity-30">✕</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FEATURES CHECKLIST */}
        <section id="network" className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-8">Enterprise-ready features</h2>
              <div className="space-y-4">
                {[
                  "Connector approval before any send",
                  "13+ buying signal types",
                  "Team-wide relationship graph",
                  "Multi-channel orchestration",
                  "AI personalization engine",
                  "Relationship quality evidence",
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#4edea3] flex-shrink-0 mt-0.5" />
                    <p className="text-[#c7c4d7]">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-8" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
              <div className="aspect-video flex items-center justify-center flex-col gap-4">
                <Zap className="w-12 h-12 text-[#8083ff]" />
                <p className="text-center text-[#c7c4d7]">Live dashboard preview showing warm paths and signals</p>
                <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-all hover:shadow-lg" style={{ backgroundColor: "#8083ff" }}>
                  Explore demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER CTA */}
      <footer className="border-t py-20" style={{ backgroundColor: "#131315", borderColor: "#464554" }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Your best deal is one warm intro away.</h2>
          <Link href="/login" className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#8083ff]/40 mb-12" style={{ backgroundColor: "#8083ff" }}>
            Open demo workspace
            <ArrowRight className="w-4 h-4 inline ml-2" />
          </Link>
          <div className="border-t pt-8" style={{ borderColor: "#464554" }}>
            <Link href="/" className="flex items-center gap-2 justify-center mb-6">
              <div className="w-6 h-6 rounded-md" style={{ backgroundColor: "#8083ff" }}>
                <GitFork className="w-3.5 h-3.5 text-white m-1" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">WarmPath</span>
            </Link>
            <div className="flex gap-4 justify-center mb-4">
              <a href="#" className="text-xs text-[#c7c4d7] hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-xs text-[#c7c4d7] hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-xs text-[#c7c4d7] hover:text-white transition-colors">Security</a>
              <a href="#" className="text-xs text-[#c7c4d7] hover:text-white transition-colors">Status</a>
            </div>
            <p className="text-xs text-[#c7c4d7]">© 2026 WarmPath Relationship Intelligence. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
