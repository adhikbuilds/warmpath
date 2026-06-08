"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  Megaphone,
  Network,
  Settings,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  collapsed?: boolean;
}

function NavItem({ href, icon: Icon, label, badge, collapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
        collapsed ? "justify-center px-2" : "",
        isActive
          ? "text-white"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
      )}
      style={isActive ? { backgroundColor: "#2563eb" } : undefined}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge && badge > 0 ? (
        <span
          className="text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] text-center tabular-nums"
          style={
            isActive
              ? { backgroundColor: "rgba(255,255,255,0.2)", color: "white" }
              : { backgroundColor: "rgba(79,70,229,0.15)", color: "#818cf8" }
          }
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      {collapsed && badge && badge > 0 ? (
        <span
          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#2563eb" }}
        />
      ) : null}
    </Link>
  );
}

function NavSection({
  label,
  children,
  collapsed,
}: {
  label?: string;
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  return (
    <div className="mb-4">
      {label && !collapsed && (
        <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/60">
          {label}
        </p>
      )}
      {label && collapsed && <div className="my-1 mx-2 border-t border-sidebar-border" />}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function AppSidebar({ onSearchOpen }: { onSearchOpen?: () => void }) {
  const { user, logout } = useAuthStore();
  const {
    messages,
    signals,
    campaignAssets,
    followUpTasks,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useSalesStore();
  const router = useRouter();

  const pendingCount =
    messages.filter((m) => m.approval_status === "pending").length +
    campaignAssets.filter((a) => a.status === "pending_approval").length;

  const overdueTaskCount = followUpTasks.filter((t) => {
    if (t.status !== "pending") return false;
    const due = new Date(t.due_date);
    const now = new Date();
    return due < now && due.toDateString() !== now.toDateString();
  }).length;

  const urgentSignalCount = signals.filter((s) => s.urgency_score >= 80).length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const collapsed = sidebarCollapsed;
  const width = collapsed ? 56 : 240;

  return (
    <nav
      data-sidebar="sidebar"
      className="fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-200 bg-sidebar border-r border-sidebar-border"
      style={{ width }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center px-3 py-4 shrink-0 border-b border-sidebar-border">
        {!collapsed ? (
          <Link
            href="/dashboard"
            className="flex-1 flex items-center gap-2 pl-1 text-sidebar-foreground"
            aria-label="WarmBlue"
          >
            <Logo size={22} />
            <span className="text-[16px] font-bold tracking-tight">WarmBlue</span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center text-sidebar-foreground"
            aria-label="WarmBlue"
          >
            <Logo size={22} />
          </Link>
        )}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-sidebar-foreground"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Search hint */}
      {!collapsed && (
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={onSearchOpen}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-[13px] transition-all bg-background border border-sidebar-border text-muted-foreground hover:text-sidebar-foreground"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="flex-1 text-left">Quick search</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-sidebar-accent text-muted-foreground">
              ⌘K
            </span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className={cn("flex-1 overflow-y-auto py-2", collapsed ? "px-1.5" : "px-3")}>
        <NavSection collapsed={collapsed}>
          <NavItem
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            collapsed={collapsed}
          />
          <NavItem
            href="/warm-leads"
            icon={Zap}
            label="Warm Leads"
            badge={urgentSignalCount}
            collapsed={collapsed}
          />
          <NavItem
            href="/network-search"
            icon={Sparkles}
            label="Network Search"
            collapsed={collapsed}
          />
          <NavItem
            href="/approval-queue"
            icon={Bell}
            label="Approval Queue"
            badge={pendingCount}
            collapsed={collapsed}
          />
          <NavItem
            href="/tasks"
            icon={ListChecks}
            label="Tasks"
            badge={overdueTaskCount}
            collapsed={collapsed}
          />
        </NavSection>

        <NavSection label="Workspace" collapsed={collapsed}>
          <NavItem href="/campaigns" icon={Megaphone} label="Campaigns" collapsed={collapsed} />
          <NavItem
            href="/signals"
            icon={BarChart3}
            label="Signals"
            badge={urgentSignalCount}
            collapsed={collapsed}
          />
          <NavItem href="/discover" icon={Compass} label="Discover" collapsed={collapsed} />
          <NavItem
            href="/relationship-graph"
            icon={Network}
            label="Your Network"
            collapsed={collapsed}
          />
          <NavItem href="/accounts" icon={Building2} label="Accounts" collapsed={collapsed} />
          <NavItem href="/contacts" icon={Users} label="Contacts" collapsed={collapsed} />
        </NavSection>

        <NavSection label="Tools" collapsed={collapsed}>
          <NavItem
            href="/knowledge-base"
            icon={BookOpen}
            label="Knowledge Base"
            collapsed={collapsed}
          />
          <NavItem href="/integrations" icon={Link2} label="Integrations" collapsed={collapsed} />
          <NavItem href="/team" icon={Users} label="Team" collapsed={collapsed} />
          <NavItem href="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
        </NavSection>
      </div>

      {/* Footer – User */}
      <div
        className={cn(
          "py-3 shrink-0 border-t border-sidebar-border",
          collapsed ? "px-1.5" : "px-4",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 rounded-md transition-all text-muted-foreground hover:text-sidebar-foreground"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-primary/20">
                <span className="text-[11px] font-semibold text-primary">
                  {user?.name ? getInitials(user.name) : "U"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-sidebar-foreground truncate leading-tight">
                  {user?.name ?? "Demo User"}
                </p>
                <p className="text-[11px] truncate capitalize text-muted-foreground">
                  {user?.plan ?? "growth"} plan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-md transition-all text-muted-foreground hover:text-sidebar-foreground"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
