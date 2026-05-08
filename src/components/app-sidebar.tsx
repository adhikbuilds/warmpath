"use client";

import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  Compass,
  CreditCard,
  GitFork,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  Megaphone,
  Moon,
  Network,
  Settings,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={(props) => <Link {...props} href={href} />}
        isActive={isActive}
        tooltip={label}
        className={cn(
          "h-9 w-full transition-all",
          isActive ? "bg-brand/10 text-brand border-l-2 border-brand" : "hover:bg-card/50",
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="flex-1">{label}</span>
        {!isCollapsed && badge && badge > 0 ? (
          <span className="ml-auto text-[10px] font-semibold bg-brand text-brand-foreground rounded-full px-1.5 min-w-[18px] text-center">
            {badge}
          </span>
        ) : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuthStore();
  const { messages, signals, campaignAssets, followUpTasks } = useSalesStore();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className={isCollapsed ? "p-2" : "px-3 pt-3 pb-2"}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <GitFork className="w-4 h-4 text-brand-foreground" />
          </div>
          {!isCollapsed && <span className="font-semibold text-sm tracking-tight">WarmPath</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Group 1 primary daily actions (no label) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem href="/warm-leads" icon={Zap} label="Warm Leads" badge={urgentSignalCount} />
              <NavItem
                href="/approval-queue"
                icon={Bell}
                label="Approval Queue"
                badge={pendingCount}
              />
              <NavItem href="/tasks" icon={ListChecks} label="Tasks" badge={overdueTaskCount} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 2 Workspace */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : "sidebar-section-label"}>
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem href="/campaigns" icon={Megaphone} label="Campaigns" />
              <NavItem href="/signals" icon={BarChart3} label="Signals" badge={urgentSignalCount} />
              <NavItem href="/relationship-graph" icon={Network} label="Relationship Graph" />
              <NavItem href="/accounts" icon={Building2} label="Accounts" />
              <NavItem href="/contacts" icon={Users} label="Contacts" />
              <NavItem href="/discover" icon={Compass} label="Discover" />
              <NavItem href="/analytics" icon={TrendingUp} label="Analytics" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 3 Tools (collapsible) */}
        <SidebarGroup>
          {isCollapsed ? (
            <SidebarGroupLabel className="sr-only">Tools</SidebarGroupLabel>
          ) : (
            <button
              type="button"
              onClick={() => setToolsOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full sidebar-section-label"
            >
              {toolsOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {toolsOpen ? "Tools" : "Tools ..."}
            </button>
          )}
          <SidebarGroupContent>
            {(isCollapsed || toolsOpen) && (
              <SidebarMenu>
                <NavItem href="/knowledge-base" icon={BookOpen} label="Knowledge Base" />
                <NavItem href="/integrations" icon={Link2} label="Integrations" />
                <NavItem href="/team" icon={Users} label="Team" />
                <NavItem href="/settings" icon={Settings} label="Settings" />
                <NavItem href="/billing" icon={CreditCard} label="Billing" />
                <NavItem href="/ai-usage" icon={Zap} label="AI Usage" />
                <NavItem href="/audit-log" icon={Activity} label="Audit Log" />
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-border/50 ${isCollapsed ? "p-2" : "p-3"}`}>
        <div
          className={`flex ${isCollapsed ? "flex-col items-center gap-1" : "items-center justify-between"}`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-brand">
                  {user?.name ? getInitials(user.name) : "U"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.plan} plan</p>
              </div>
            </div>
          )}
          <div className={`flex items-center ${isCollapsed ? "flex-col gap-1" : "gap-1"}`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              {mounted &&
                (theme === "dark" ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                ))}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
