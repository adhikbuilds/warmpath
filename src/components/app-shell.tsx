"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Settings, HelpCircle, BarChart3, Radar, Network, ListTodo } from "lucide-react";

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", href: "/dashboard", id: "dashboard" },
  { icon: Radar, label: "Radar", href: "/discover", id: "radar" },
  { icon: Network, label: "Network", href: "/relationship-graph", id: "network" },
  { icon: ListTodo, label: "Queue", href: "/approval-queue", id: "queue" },
];

export function AppShell({ children, activeNav }: { children: ReactNode; activeNav?: string }) {
  return (
    <div className="flex h-screen bg-[#131315]">
      {/* Sidebar */}
      <nav
        className="fixed left-0 top-0 h-full w-[240px] flex flex-col border-r p-4 gap-1 z-50"
        style={{ backgroundColor: "#201f22", borderColor: "#464554" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: "#8083ff" }}
          >
            W
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#e5e1e4]">WarmPath</h1>
            <p className="text-xs text-[#c7c4d7]">High Performance</p>
          </div>
        </div>

        {/* Quick Search */}
        <button
          className="w-full h-8 mb-4 rounded text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#8083ff" }}
        >
          🔍 Quick Search
        </button>

        {/* Main Nav */}
        <div className="flex flex-col gap-1 flex-grow">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all ${
                  isActive
                    ? "text-white"
                    : "text-[#c7c4d7] hover:bg-[#2a2a2c]"
                }`}
                style={isActive ? { backgroundColor: "#00a572", color: "white" } : {}}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Footer Nav */}
        <div className="flex flex-col gap-1 pt-4 border-t" style={{ borderColor: "#464554" }}>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-[#c7c4d7] hover:bg-[#2a2a2c] transition-all"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <Link
            href="/support"
            className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-[#c7c4d7] hover:bg-[#2a2a2c] transition-all"
          >
            <HelpCircle className="w-5 h-5" />
            Support
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-[240px] flex-1 flex flex-col h-full overflow-auto">
        {children}
      </main>
    </div>
  );
}
