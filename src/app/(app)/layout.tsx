"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandBar } from "@/components/command-bar";
import { StoreInitializer } from "@/components/store-initializer";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuthStore();
  const { messages, signals, campaignAssets, followUpTasks } = useSalesStore();
  const { status } = useSession();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand to rehydrate from localStorage before checking auth
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect unauthenticated users, clearing any stale Zustand auth
  useEffect(() => {
    if (hydrated && status === "unauthenticated") {
      logout();
      router.replace("/login");
    }
  }, [hydrated, logout, router, status]);

  // Global Cmd+K listener
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

  if (!hydrated || status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <SidebarProvider>
      <StoreInitializer />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Link href="/approval-queue">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand/15 text-brand hover:bg-brand/25 transition-colors">
                  {pendingCount} approvals
                </span>
              </Link>
            )}
            {urgentSignalCount > 0 && (
              <Link href="/signals">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-600 hover:bg-red-500/25 transition-colors">
                  {urgentSignalCount} urgent
                </span>
              </Link>
            )}
            {overdueTasks > 0 && (
              <Link href="/tasks">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/15 text-red-600 hover:bg-red-500/25 transition-colors">
                  {overdueTasks} overdue
                </span>
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground border border-border/50 rounded-md px-2 py-0.5 hover:border-border hover:text-foreground transition-colors"
          >
            ⌘K
          </button>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
      <CommandBar open={commandOpen} onClose={() => setCommandOpen(false)} />
    </SidebarProvider>
  );
}
