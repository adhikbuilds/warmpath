"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Compass,
  GitFork,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  Megaphone,
  Network,
  Settings,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

function NavItem({ href, icon: Icon, label, badge }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
        isActive
          ? "bg-[#00a572] text-[#00311f]"
          : "text-[#c7c4d7] hover:bg-[#2a2a2c] hover:text-[#e5e1e4]",
      )}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span
          className={cn(
            "text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] text-center tabular-nums",
            isActive
              ? "bg-[#00311f]/30 text-[#00311f]"
              : "bg-[#c0c1ff]/15 text-[#c0c1ff]",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function NavSection({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {label && (
        <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#908fa0]">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const { messages, signals, campaignAssets, followUpTasks } = useSalesStore();
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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    logout();
    router.push("/login");
  };

  return (
    <nav data-sidebar="sidebar" className="fixed left-0 top-0 h-full w-[240px] bg-[#1c1b1d] border-r border-[#464554] flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#464554]">
        <div className="w-8 h-8 rounded-md bg-[#8083ff] flex items-center justify-center shrink-0">
          <GitFork className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-[14px] font-semibold text-[#e5e1e4] leading-tight tracking-tight">
            WarmPath
          </h1>
          <p className="text-[11px] text-[#908fa0]">Relationship Intelligence</p>
        </div>
      </div>

      {/* Search hint */}
      <div className="px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md border border-[#464554] bg-[#201f22] text-[#908fa0] text-[13px] hover:border-[#908fa0] hover:text-[#c7c4d7] transition-all"
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
          <span className="text-[11px] bg-[#2a2a2c] px-1.5 py-0.5 rounded text-[#908fa0]">⌘K</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavSection>
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/warm-leads" icon={Zap} label="Warm Leads" badge={urgentSignalCount} />
          <NavItem
            href="/approval-queue"
            icon={Bell}
            label="Approval Queue"
            badge={pendingCount}
          />
          <NavItem href="/tasks" icon={ListChecks} label="Tasks" badge={overdueTaskCount} />
        </NavSection>

        <NavSection label="Workspace">
          <NavItem href="/campaigns" icon={Megaphone} label="Campaigns" />
          <NavItem href="/signals" icon={BarChart3} label="Signals" badge={urgentSignalCount} />
          <NavItem href="/relationship-graph" icon={Network} label="Network Graph" />
          <NavItem href="/accounts" icon={Building2} label="Accounts" />
          <NavItem href="/contacts" icon={Users} label="Contacts" />
          <NavItem href="/discover" icon={Compass} label="Discover" />
          <NavItem href="/analytics" icon={TrendingUp} label="Analytics" />
        </NavSection>

        <NavSection label="Tools">
          <NavItem href="/knowledge-base" icon={BookOpen} label="Knowledge Base" />
          <NavItem href="/integrations" icon={Link2} label="Integrations" />
          <NavItem href="/team" icon={Users} label="Team" />
          <NavItem href="/settings" icon={Settings} label="Settings" />
        </NavSection>
      </div>

      {/* Footer – User */}
      <div className="border-t border-[#464554] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#8083ff]/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-semibold text-[#c0c1ff]">
                {user?.name ? getInitials(user.name) : "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#e5e1e4] truncate leading-tight">
                {user?.name ?? "Demo User"}
              </p>
              <p className="text-[11px] text-[#908fa0] truncate capitalize">
                {user?.plan ?? "growth"} plan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-md text-[#908fa0] hover:text-[#e5e1e4] hover:bg-[#2a2a2c] transition-all"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
