"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandBar } from "@/components/command-bar";
import { ProductTour } from "@/components/product-tour";
import { StoreInitializer } from "@/components/store-initializer";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/warm-leads": "Warm Leads",
  "/approval-queue": "Approval Queue",
  "/tasks": "Tasks",
  "/campaigns": "Campaigns",
  "/signals": "Signals",
  "/relationship-graph": "Network Graph",
  "/accounts": "Accounts",
  "/contacts": "Contacts",
  "/discover": "Discover",
  "/analytics": "Analytics",
  "/knowledge-base": "Knowledge Base",
  "/integrations": "Integrations",
  "/team": "Team",
  "/settings": "Settings",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthStore();
  const { messages, signals, campaignAssets, followUpTasks, tourOpen, setTourOpen } =
    useSalesStore();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && status === "unauthenticated") {
      logout();
      router.replace("/login");
    }
  }, [hydrated, logout, router, status]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const pendingCount =
    messages.filter((m) => m.approval_status === "pending").length +
    campaignAssets.filter((a) => a.status === "pending_approval").length;

  const urgentSignalCount = signals.filter((s) => s.urgency_score >= 80).length;

  const overdueTasks = followUpTasks.filter(
    (t) => t.status === "pending" && new Date(t.due_date) < new Date(),
  ).length;

  // Page title from pathname (strip dynamic segments)
  const baseSegment = "/" + (pathname.split("/")[1] ?? "");
  const pageTitle = PAGE_TITLES[baseSegment] ?? "";

  if (!hydrated || status === "loading") {
    return (
      <div className="min-h-screen bg-[#131315] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#8083ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-screen bg-[#131315] overflow-hidden">
      <StoreInitializer />
      <AppSidebar />

      {/* Main area */}
      <div className="flex-1 ml-[240px] flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <header className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-[#464554] bg-[#1c1b1d]">
          <div className="flex items-center gap-2">
            {pageTitle && (
              <h2 className="text-[14px] font-semibold text-[#e5e1e4] tracking-tight">
                {pageTitle}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Link href="/approval-queue">
                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[#8083ff]/15 text-[#c0c1ff] hover:bg-[#8083ff]/25 transition-colors border border-[#8083ff]/20">
                  {pendingCount} pending
                </span>
              </Link>
            )}
            {urgentSignalCount > 0 && (
              <Link href="/signals">
                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[#ffb4ab]/15 text-[#ffb4ab] hover:bg-[#ffb4ab]/25 transition-colors border border-[#ffb4ab]/20">
                  {urgentSignalCount} urgent
                </span>
              </Link>
            )}
            {overdueTasks > 0 && (
              <Link href="/tasks">
                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[#ffb783]/15 text-[#ffb783] hover:bg-[#ffb783]/25 transition-colors border border-[#ffb783]/20">
                  {overdueTasks} overdue
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#908fa0] border border-[#464554] rounded-md px-2.5 py-1 hover:border-[#908fa0] hover:text-[#c7c4d7] transition-all font-mono"
            >
              ⌘K
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <CommandBar open={commandOpen} onClose={() => setCommandOpen(false)} />
      <ProductTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
