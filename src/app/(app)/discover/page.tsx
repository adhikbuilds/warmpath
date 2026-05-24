"use client";

import { Filter } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const SIGNAL_CARDS = [
  {
    id: 1,
    title: "Stripe raised $694M Series H",
    category: "Fintech • Tier 1 ICP",
    time: "2h ago",
    connectorName: "James L.",
    connectorRole: "ex-Rippling",
    connectorImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMCTfiC7wpb-X8Asd-LoK_ecVyylVrtRopcn_FYRrMCMEb5Q-Zx07kN-mbjqIr5gmIMg63Cno1Ak33JL6IRPuMbBxzX5pPVKiCMSul83uo7K9ShH-oUFF7x5Rl-rbTdKdjtELUSWfV7VxFJTOaiz78B-iNFo1wIyHhcP6dGYHvfxlt2hOHfUagaG4_Nj9FY381f8Eey1yTh100CdwDcyRua5MhDdPyd-7SmekPQejQYJzGbg6xLdU_G_ncwWQzAQQIckCeKIsC3pIH",
    warmth: 94,
    target: "CTO, Stripe",
  },
];

export default function DiscoverPage() {
  return (
    <AppShell activeNav="radar">
      <main className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: "#131315" }}>
        {/* Sticky Toolbar */}
        <div
          className="sticky top-0 z-30 border-b px-6 py-4 shrink-0 flex flex-col gap-4"
          style={{
            backgroundColor: "rgba(19, 19, 21, 0.95)",
            backdropFilter: "blur(4px)",
            borderColor: "#464554",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-[#e5e1e4] flex items-center gap-2">
                <span>📡</span> Live Buying Signals
              </h1>
              <p className="text-sm text-[#c7c4d7] mt-1">Monitoring 1,240 target accounts across your network.</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-[#c7c4d7] uppercase tracking-widest">Sorted by Relevance</span>
              <button
                className="h-8 w-8 rounded flex items-center justify-center border transition-colors hover:text-[#8083ff] hover:border-[#8083ff]"
                style={{ borderColor: "#464554", color: "#c7c4d7" }}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["Signal Type", "ICP Tier", "Warmth Score"].map((label) => (
              <div
                key={label}
                className="flex items-center h-8 rounded-full border px-3 gap-1 shrink-0 cursor-pointer hover:border-[#8083ff] transition-colors"
                style={{
                  borderColor: "#464554",
                  backgroundColor: "#201f22",
                }}
              >
                <span className="text-xs text-[#e5e1e4] uppercase">{label}</span>
                <span>▼</span>
              </div>
            ))}

            <div className="w-px h-4" style={{ backgroundColor: "#464554" }} />

            {/* Active Filter */}
            <div
              className="flex items-center h-8 rounded-full px-3 gap-2 shrink-0 cursor-pointer border"
              style={{
                backgroundColor: "rgba(128, 131, 255, 0.1)",
                borderColor: "rgba(128, 131, 255, 0.3)",
              }}
            >
              <span className="text-xs text-[#8083ff] uppercase">Funding Events</span>
              <span className="text-[#8083ff] hover:text-[#e5e1e4] transition-colors">✕</span>
            </div>
          </div>
        </div>

        {/* Feed Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
            {SIGNAL_CARDS.map((card) => (
              <article
                key={card.id}
                className="rounded-lg border flex flex-col hover:border-[#8083ff]/50 transition-colors duration-300 group"
                style={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                }}
              >
                {/* Header */}
                <div
                  className="p-4 border-b flex justify-between items-start"
                  style={{ borderColor: "#464554" }}
                >
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center shrink-0 text-black font-bold"
                      style={{ backgroundColor: "white" }}
                    >
                      S
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-[#e5e1e4]">{card.title}</h3>
                      <p className="text-xs text-[#c7c4d7] mt-0.5">{card.category}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#c7c4d7] shrink-0">{card.time}</span>
                </div>

                {/* Content Canvas (Node Map) */}
                <div
                  className="p-4 flex-1 flex flex-col justify-center relative overflow-hidden min-h-[160px]"
                  style={{
                    backgroundColor: "rgba(19, 19, 21, 0.5)",
                    backgroundImage: "radial-gradient(circle at 2px 2px, rgba(199, 196, 215, 0.1) 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                >
                  <div className="relative flex items-center justify-between w-full z-10 px-2">
                    {/* You */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full border flex items-center justify-center"
                        style={{ borderColor: "#464554", backgroundColor: "#353437" }}
                      >
                        <span className="text-sm">👤</span>
                      </div>
                      <span className="text-xs text-[#e5e1e4] text-center">You (AE)</span>
                    </div>

                    {/* Connection Line */}
                    <div className="flex-1 flex items-center relative h-px mx-3" style={{ backgroundColor: "#464554" }}>
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 border rounded-full flex items-center gap-1 shrink-0"
                        style={{
                          backgroundColor: "#201f22",
                          borderColor: "#464554",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#4edea3" }}
                        />
                        <span className="text-xs text-[#e5e1e4] uppercase">{card.warmth} Warmth</span>
                      </div>
                    </div>

                    {/* Connector */}
                    <div className="flex flex-col items-center gap-2 relative">
                      <img
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 object-cover z-10"
                        src={card.connectorImage}
                        style={{ borderColor: "#201f22" }}
                      />
                      <div className="text-center">
                        <span className="text-xs text-[#e5e1e4] block">{card.connectorName}</span>
                        <span className="text-[9px] text-[#c7c4d7] block">{card.connectorRole}</span>
                      </div>
                    </div>

                    {/* Connection Line 2 */}
                    <div className="flex-1 flex items-center relative h-px mx-3" style={{ backgroundColor: "#464554" }} />

                    {/* Target */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center"
                        style={{
                          backgroundColor: "#353437",
                          borderColor: "#8083ff",
                        }}
                      >
                        <span className="text-lg">🎯</span>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-[#8083ff] block">Target</span>
                        <span className="text-[9px] text-[#c7c4d7] block">{card.target}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  className="p-4 border-t bg-surface-container-low flex justify-end gap-3 rounded-b-lg"
                  style={{ borderColor: "#464554", backgroundColor: "#1c1b1d" }}
                >
                  <button
                    className="h-8 px-4 rounded font-medium text-sm border hover:bg-[#2a2a2c] transition-colors"
                    style={{
                      borderColor: "#464554",
                      color: "#c7c4d7",
                    }}
                  >
                    Dismiss
                  </button>
                  <button
                    className="h-8 px-4 rounded font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 text-white"
                    style={{ backgroundColor: "#8083ff" }}
                  >
                    <span>📝</span>
                    Draft Intro Request
                  </button>
                </div>
              </article>
            ))}
          </div>
          {/* Bottom spacing */}
          <div className="h-12 w-full" />
        </div>
      </main>
    </AppShell>
  );
}
