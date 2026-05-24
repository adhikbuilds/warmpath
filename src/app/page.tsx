"use client";

import { ArrowRight, GitFork, Zap, Check } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#131315", color: "#e5e1e4" }}>
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: "rgba(19, 19, 21, 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #464554" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md" style={{ backgroundColor: "#8083ff" }}>
              <GitFork className="w-3.5 h-3.5 text-white m-1" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">WarmPath</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#c7c4d7] hover:text-white transition-colors">Sign in</Link>
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors hover:bg-[#8083ff]/90" style={{ backgroundColor: "#8083ff" }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-4 px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(128, 131, 255, 0.1)", border: "1px solid rgba(128, 131, 255, 0.2)" }}>
            <span className="text-xs font-semibold text-[#8083ff]">✨ AI-powered relationship intelligence</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-bold leading-tight text-white mb-6">
            Turn warm relationships into closed deals
          </h1>
          <p className="text-lg text-[#c7c4d7] mb-8 max-w-2xl mx-auto">
            WarmPath maps your team's entire relationship graph, finds the warmest path to every prospect, and drafts the perfect intro. One click to approve. One deal moves forward.
          </p>
          <div className="flex gap-4 justify-center mb-12">
            <Link href="/login" className="px-6 py-3 rounded-lg font-semibold text-[#131315] transition-all hover:shadow-lg hover:shadow-[#8083ff]/40" style={{ backgroundColor: "#8083ff" }}>
              Start free demo
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </Link>
            <Link href="/login" className="px-6 py-3 rounded-lg font-semibold border text-white transition-colors hover:bg-[#201f22]" style={{ borderColor: "#464554" }}>
              View dashboard
            </Link>
          </div>

          {/* Energized team doodle */}
          <svg className="w-full max-w-md mx-auto opacity-80" viewBox="0 0 415 250" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Lightning bolts around */}
            <path d="M 120 80 L 130 100 L 125 110 L 135 130" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            <path d="M 295 90 L 310 110 L 300 120 L 320 140" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            <path d="M 180 50 L 190 75 L 185 85 L 200 110" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            <path d="M 235 60 L 250 85 L 240 95 L 260 120" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            <path d="M 90 120 L 100 140 L 95 150 L 110 170" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            <path d="M 325 130 L 340 155 L 335 165 L 350 185" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>

            {/* Left person */}
            <circle cx="90" cy="120" r="18" fill="none" stroke="white" strokeWidth="2.5"/>
            <path d="M 75 145 L 60 145 L 60 200 M 105 145 L 120 145 M 90 145 L 90 190" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Glasses */}
            <circle cx="82" cy="115" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="98" cy="115" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <line x1="87" y1="115" x2="93" y2="115" stroke="white" strokeWidth="1.5"/>

            {/* Center person */}
            <circle cx="207" cy="105" r="18" fill="none" stroke="white" strokeWidth="2.5"/>
            <path d="M 192 130 L 177 130 L 177 195 M 222 130 L 237 130 M 207 130 L 207 195" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Glasses */}
            <circle cx="199" cy="100" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="215" cy="100" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <line x1="204" y1="100" x2="210" y2="100" stroke="white" strokeWidth="1.5"/>

            {/* Right person */}
            <circle cx="320" cy="115" r="18" fill="none" stroke="white" strokeWidth="2.5"/>
            <path d="M 305 140 L 290 140 L 290 200 M 335 140 L 350 140 M 320 140 L 320 190" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            {/* Glasses */}
            <circle cx="312" cy="110" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <circle cx="328" cy="110" r="5" fill="none" stroke="white" strokeWidth="1.5"/>
            <line x1="317" y1="110" x2="323" y2="110" stroke="white" strokeWidth="1.5"/>

            {/* Crossed arms effect */}
            <g strokeWidth="2.5" stroke="white" fill="none" opacity="0.8">
              <path d="M 70 160 Q 100 175 130 160"/>
              <path d="M 185 155 Q 207 170 235 155"/>
              <path d="M 290 165 Q 320 180 350 165"/>
            </g>
          </svg>
        </div>

        {/* Dashboard Preview */}
        <div className="rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
          <div className="h-96 flex items-center justify-center flex-col gap-4 p-12">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#8083ff" }}>
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Live Dashboard Preview</h3>
              <p className="text-[#c7c4d7] mb-6">See real warm paths, signals, and outreach queue</p>
              <Link href="/login" className="inline-block px-4 py-2 rounded-lg font-medium text-white transition-colors" style={{ backgroundColor: "#8083ff" }}>
                Explore the app
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How it works</h2>
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

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-8">Built for enterprise sales</h2>
            <div className="space-y-4">
              {[
                "Connector approval before any send",
                "13+ buying signal types (funding, hiring, tech changes)",
                "Team-wide relationship graph with evidence",
                "Multi-channel (email, LinkedIn, warm intro, phone)",
                "AI learns from your team's messaging style",
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#4edea3] flex-shrink-0 mt-0.5" />
                  <p className="text-[#c7c4d7]">{feature}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-8" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#8083ff" }}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <p className="text-[#c7c4d7] text-sm">Dashboard preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { stat: "5min", label: "Time to map 3,400 relationships" },
            { stat: "78%", label: "Warm paths to ICP (vs 0% cold outreach)" },
            { stat: "41%", label: "Reply rate (vs 8% traditional sequences)" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-[#8083ff] mb-2">{item.stat}</div>
              <p className="text-[#c7c4d7]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="rounded-xl p-16 text-center" style={{ backgroundColor: "#201f22", border: "1px solid #464554" }}>
          <h2 className="text-4xl font-bold text-white mb-6">Ready to see your warm paths?</h2>
          <p className="text-[#c7c4d7] mb-8">Get instant access to a working demo with your team's real network.</p>
          <Link href="/login" className="inline-block px-8 py-3 rounded-lg font-semibold text-[#131315] transition-all hover:shadow-lg hover:shadow-[#8083ff]/40" style={{ backgroundColor: "#8083ff" }}>
            Start demo now
            <ArrowRight className="w-4 h-4 inline ml-2" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t mt-20" style={{ backgroundColor: "#131315", borderColor: "#464554" }}>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <Link href="/" className="flex items-center gap-2 justify-center mb-6">
            <div className="w-6 h-6 rounded-md" style={{ backgroundColor: "#8083ff" }}>
              <GitFork className="w-3.5 h-3.5 text-white m-1" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">WarmPath</span>
          </Link>
          <p className="text-xs text-[#c7c4d7] mb-4">© 2026 WarmPath. Turn warm relationships into closed deals.</p>
          <div className="flex gap-4 justify-center">
            <a href="#" className="text-xs text-[#c7c4d7] hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs text-[#c7c4d7] hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
