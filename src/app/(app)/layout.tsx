"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  "/relationship-graph": "Relationships",
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
  const { isAuthenticated } = useAuthStore();
  const {
    messages,
    signals,
    campaignAssets,
    followUpTasks,
    tourOpen,
    setTourOpen,
    sidebarCollapsed,
  } = useSalesStore();
  const router = useRouter();
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

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

  if (!hydrated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#fafafa" }}
      >
        <div
          className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: "#e0e0e4", borderTopColor: "#5456d4" }}
        />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#09090b" }}>
      <StoreInitializer />
      <AppSidebar />

      {/* Main area */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? 56 : 240 }}
      >
        {/* Top bar */}
        <header
          className="h-12 shrink-0 flex items-center justify-between px-6"
          style={{ backgroundColor: "#18181b", borderBottom: "1px solid #27272a" }}
        >
          <div className="flex items-center gap-2">
            {pageTitle && (
              <h2 className="text-[14px] font-semibold text-white tracking-tight">{pageTitle}</h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Link href="/approval-queue">
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-md transition-colors"
                  style={{
                    backgroundColor: "rgba(37,99,235,0.15)",
                    color: "#60a5fa",
                    border: "1px solid rgba(37,99,235,0.2)",
                  }}
                >
                  {pendingCount} pending
                </span>
              </Link>
            )}
            {urgentSignalCount > 0 && (
              <Link href="/signals">
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-md transition-colors"
                  style={{
                    backgroundColor: "rgba(16,185,129,0.12)",
                    color: "#10b981",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  {urgentSignalCount} urgent
                </span>
              </Link>
            )}
            {overdueTasks > 0 && (
              <Link href="/tasks">
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-md transition-colors"
                  style={{
                    backgroundColor: "rgba(245,158,11,0.12)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  {overdueTasks} overdue
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-[11px] rounded-md px-2.5 py-1 transition-all font-mono"
              style={{ color: "#71717a", border: "1px solid #27272a" }}
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
