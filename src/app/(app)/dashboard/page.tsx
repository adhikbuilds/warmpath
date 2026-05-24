"use client";

import { Calendar } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export default function DashboardPage() {
  return (
    <AppShell activeNav="dashboard">
      <main className="p-6 min-h-screen" style={{ backgroundColor: "#131315" }}>
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold text-[#e5e1e4]" style={{ letterSpacing: "-0.02em" }}>
              Executive Insights
            </h2>
            <p className="text-sm text-[#c7c4d7] mt-1">
              Network performance and relationship velocity over the last 30 days.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="border border-[#464554] bg-[#201f22] hover:bg-[#2a2a2c] text-[#e5e1e4] font-medium text-sm px-4 py-1.5 rounded transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Last 30 Days
            </button>
            <button className="bg-[#8083ff] hover:bg-[#c0c1ff] hover:text-[#1000a9] text-white font-medium text-sm px-4 py-1.5 rounded transition-colors">
              Export Report
            </button>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-3">
          {/* Card A: Reply Rate */}
          <div
            className="col-span-12 md:col-span-4 rounded-lg p-5 flex flex-col justify-between hover:opacity-80 transition-opacity border"
            style={{
              backgroundColor: "#201f22",
              borderColor: "#2a2a2c",
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm text-[#c7c4d7]">Warm Intro Reply Rate</span>
              <span className="text-lg text-[#c7c4d7]">💬</span>
            </div>
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-[#e5e1e4]" style={{ letterSpacing: "-0.02em" }}>
                  47%
                </span>
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-1 mb-1"
                  style={{ backgroundColor: "#4edea3", color: "#131315" }}
                >
                  <span>📈</span> +39% vs cold
                </span>
              </div>
              {/* Sparkline bars */}
              <div className="h-8 w-full flex items-end gap-0.5 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex-1 bg-[#353437] rounded-t h-[30%]" />
                <div className="flex-1 bg-[#353437] rounded-t h-[45%]" />
                <div className="flex-1 bg-[#353437] rounded-t h-[35%]" />
                <div className="flex-1 bg-[#353437] rounded-t h-[60%]" />
                <div className="flex-1 bg-[#353437] rounded-t h-[50%]" />
                <div className="flex-1 bg-[#353437] rounded-t h-[75%]" />
                <div
                  className="flex-1 rounded-t h-[90%] relative"
                  style={{
                    backgroundColor: "#4edea3",
                    boxShadow: "0 0 8px rgba(78, 222, 163, 0.4)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card B: Path Length */}
          <div
            className="col-span-12 md:col-span-4 rounded-lg p-5 flex flex-col justify-between hover:opacity-80 transition-opacity border"
            style={{
              backgroundColor: "#201f22",
              borderColor: "#2a2a2c",
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm text-[#c7c4d7]">Avg Path Length</span>
              <span className="text-lg text-[#c7c4d7]">🛣️</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#e5e1e4] mb-2">1.2 Hops</div>
              <p className="text-xs text-[#908fa0] uppercase tracking-widest mb-3">Direct relationships highly utilized</p>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-1 bg-[#353437] rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-[#c0c1ff]" />
                </div>
                <span className="text-xs text-[#c7c4d7]">85% Tier 1</span>
              </div>
            </div>
          </div>

          {/* Card C: Control */}
          <div
            className="col-span-12 md:col-span-4 rounded-lg p-5 flex flex-col justify-between hover:opacity-80 transition-opacity border relative overflow-hidden"
            style={{
              backgroundColor: "#201f22",
              borderColor: "#2a2a2c",
            }}
          >
            <div className="absolute -right-4 -bottom-4 text-[#2a2a2c] opacity-20 pointer-events-none" style={{ fontSize: "120px" }}>
              🔒
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm text-[#c7c4d7]">Security & Control</span>
              </div>
              <div className="text-3xl font-bold text-[#e5e1e4] mb-3">100%</div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{ backgroundColor: "rgba(78, 222, 163, 0.1)", borderColor: "rgba(78, 222, 163, 0.3)" }}
              >
                <span className="text-sm text-[#4edea3]">✓</span>
                <span className="text-sm text-[#4edea3]">Connector-Approved Before Send</span>
              </div>
            </div>
          </div>

          {/* Main Chart Card */}
          <div
            className="col-span-12 md:col-span-8 rounded-lg p-4 h-[420px] border flex flex-col"
            style={{
              backgroundColor: "#201f22",
              borderColor: "#2a2a2c",
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#e5e1e4]">Meetings Booked via Warm Intro Paths</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#c0c1ff" }} />
                  <span className="text-xs text-[#c7c4d7] uppercase">Platform</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#353437" }} />
                  <span className="text-xs text-[#c7c4d7] uppercase">External</span>
                </div>
              </div>
            </div>

            {/* Chart placeholder with SVG */}
            <div className="flex-grow relative border-b border-l" style={{ borderColor: "rgba(144, 143, 160, 0.3)" }}>
              <svg
                className="absolute bottom-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
                style={{
                  overflow: "visible",
                }}
              >
                <path
                  d="M0,100 L0,80 Q10,75 20,60 T40,40 T60,50 T80,20 T100,10 L100,100 Z"
                  fill="rgba(192, 193, 255, 0.1)"
                  stroke="#c0c1ff"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {/* Data points */}
              <div className="absolute left-[20%] bottom-[40%] w-2 h-2 bg-[#131315] border-2 border-[#c0c1ff] rounded-full" />
              <div className="absolute left-[40%] bottom-[60%] w-2 h-2 bg-[#131315] border-2 border-[#c0c1ff] rounded-full" />
              <div className="absolute left-[60%] bottom-[50%] w-2 h-2 bg-[#131315] border-2 border-[#c0c1ff] rounded-full" />
              <div className="absolute left-[80%] bottom-[80%] w-2 h-2 bg-[#131315] border-2 border-[#c0c1ff] rounded-full" style={{ boxShadow: "0 0 12px rgba(192, 193, 255, 0.8)" }}>
                {/* Tooltip */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-center text-sm whitespace-nowrap z-10 border"
                  style={{
                    backgroundColor: "#2a2a2c",
                    borderColor: "#464554",
                  }}
                >
                  <div className="text-[#e5e1e4] font-medium">24 Meetings</div>
                  <div className="text-xs text-[#c7c4d7]">Nov 18</div>
                </div>
              </div>
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between mt-3 text-xs text-[#c7c4d7] px-2">
              <span>Nov 01</span>
              <span>Nov 08</span>
              <span>Nov 15</span>
              <span>Nov 22</span>
              <span>Nov 30</span>
            </div>
          </div>

          {/* Activity Log Sidebar */}
          <div
            className="col-span-12 md:col-span-4 rounded-lg p-4 h-[420px] border flex flex-col overflow-hidden"
            style={{
              backgroundColor: "#201f22",
              borderColor: "#2a2a2c",
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#e5e1e4]">Sequence Activity</h3>
              <button className="text-[#c7c4d7] hover:text-[#e5e1e4] transition-colors">⋮</button>
            </div>

            {/* Timeline */}
            <div className="flex-grow overflow-y-auto pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#353437 transparent" }}>
              <div className="relative border-l pl-6 space-y-6 pb-4" style={{ borderColor: "#353437" }}>
                {/* Event 1 */}
                <div className="relative">
                  <div className="absolute -left-[11px] top-1 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: "#4edea3", borderColor: "#201f22" }} />
                  <div className="text-sm text-[#e5e1e4] mb-0.5">
                    Intro Sequence Closed <span style={{ color: "#4edea3" }}>Won</span>
                  </div>
                  <p className="text-sm text-[#c7c4d7] leading-snug">Sarah Jenkins accepted intro to Michael Chen (Acme Corp).</p>
                  <span className="text-xs text-[#908fa0] mt-1.5 block">2 hours ago</span>
                </div>

                {/* Event 2 */}
                <div className="relative">
                  <div className="absolute -left-[11px] top-1 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: "#c0c1ff", borderColor: "#201f22" }} />
                  <div className="text-sm text-[#e5e1e4] mb-0.5">Double Opt-in Triggered</div>
                  <p className="text-sm text-[#c7c4d7] leading-snug">Automated request sent to David Miller regarding Project Phoenix.</p>
                  <span className="text-xs text-[#908fa0] mt-1.5 block">5 hours ago</span>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <div className="absolute -left-[11px] top-1 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: "#353437", borderColor: "#201f22" }} />
                  <div className="text-sm text-[#e5e1e4] mb-0.5">Path Discovered</div>
                  <div
                    className="rounded p-2 mt-2 border"
                    style={{
                      backgroundColor: "#2a2a2c",
                      borderColor: "#2a2a2c",
                    }}
                  >
                    <p className="text-xs text-[#e5e1e4] flex items-center gap-1.5">
                      <span>👤</span> You
                      <span style={{ color: "#908fa0" }}>→</span>
                      <span>👤</span> E. Reed
                      <span style={{ color: "#908fa0" }}>→</span>
                      <span>🏢</span> Vertex Inc.
                    </p>
                  </div>
                  <span className="text-xs text-[#908fa0] mt-1.5 block">Yesterday, 14:20</span>
                </div>

                {/* Event 4 */}
                <div className="relative">
                  <div className="absolute -left-[11px] top-1 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: "#353437", borderColor: "#201f22" }} />
                  <div className="text-sm text-[#e5e1e4] mb-0.5">Relationship Synced</div>
                  <p className="text-sm text-[#c7c4d7] leading-snug">142 new edge connections added from Workspace Email.</p>
                  <span className="text-xs text-[#908fa0] mt-1.5 block">Yesterday, 09:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
