"use client";

import { Crown, Eye, GitFork, Link2, Mail, Plus, Shield, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { useSalesStore } from "@/stores/salesStore";
import type { WorkspaceMember } from "@/types";

const ROLE_CONFIG: Record<
  WorkspaceMember["role"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  owner: {
    label: "Owner",
    icon: <Crown className="w-3 h-3" />,
    color: "bg-brand/10 text-brand border-brand/20",
  },
  admin: {
    label: "Admin",
    icon: <Shield className="w-3 h-3" />,
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  sales_rep: {
    label: "Sales Rep",
    icon: <UserCheck className="w-3 h-3" />,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  viewer: {
    label: "Viewer",
    icon: <Eye className="w-3 h-3" />,
    color: "bg-muted text-muted-foreground",
  },
};

const SOURCE_LABELS: Record<string, string> = {
  gmail: "Gmail",
  linkedin: "LinkedIn",
  salesforce: "Salesforce",
  hubspot: "HubSpot",
  google_calendar: "Calendar",
  slack: "Slack",
};

const ROLE_SCORE: Record<WorkspaceMember["role"], number> = {
  owner: 95,
  admin: 80,
  sales_rep: 60,
  viewer: 40,
};

export default function TeamPage() {
  const { workspaceMembers, workspace, relationshipEdges } = useSalesStore();
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    toast.success(`Invite sent to ${inviteEmail}`, {
      description: "They'll receive an email with a link to join your workspace.",
    });
    setInviteEmail("");
  };

  const totalRelationships = workspaceMembers.reduce(
    (sum, m) => sum + m.connected_sources.length,
    0,
  );

  // Compute relationship node counts from real edges per member
  const edgeCountByMember = workspaceMembers.reduce<Record<string, number>>((acc, member) => {
    const count = relationshipEdges.filter(
      (e) => e.from_id === member.user_id || e.to_id === member.user_id,
    ).length;
    acc[member.id] = count;
    return acc;
  }, {});

  const totalEdges = relationshipEdges.length;

  return (
    <div className="p-6 space-y-5 max-w-[900px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            Team
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your workspace members, roles, and connected data sources.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {workspace.plan} plan
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Members", value: workspaceMembers.length },
          { label: "Data sources", value: totalRelationships },
          { label: "Relationship edges", value: totalEdges },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members list */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Workspace members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workspaceMembers.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role];
            return (
              <div
                key={member.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-muted/10"
              >
                <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-brand">
                    {getInitials(member.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{member.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] flex items-center gap-1 ${roleConfig.color}`}
                    >
                      {roleConfig.icon}
                      {roleConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{member.email}</span>
                    {member.title && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{member.title}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {member.connected_sources.map((src) => (
                      <Badge
                        key={src}
                        variant="outline"
                        className="text-[9px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-0.5"
                      >
                        <Link2 className="w-2.5 h-2.5" />
                        {SOURCE_LABELS[src] ?? src}
                      </Badge>
                    ))}
                    {member.connected_sources.length === 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        No sources connected
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1.5 mb-1 justify-end">
                    <GitFork className="w-3 h-3 text-brand" />
                    <span className="text-xs font-semibold">
                      {member.relationship_score ?? ROLE_SCORE[member.role]}
                    </span>
                  </div>
                  <Progress
                    value={member.relationship_score ?? ROLE_SCORE[member.role]}
                    className="w-16 h-1"
                  />
                  {edgeCountByMember[member.id] > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {edgeCountByMember[member.id]} edge{edgeCountByMember[member.id] !== 1 ? "s" : ""}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    joined {formatRelativeTime(member.joined_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Invite */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Invite teammate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button type="submit" size="sm" className="h-8">
              Send invite
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2">
            Teammates get sales_rep access by default. Admins can change roles after joining.
          </p>
        </CardContent>
      </Card>

      {/* Role permissions */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Role permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Permission
                  </th>
                  {(["owner", "admin", "sales_rep", "viewer"] as const).map((role) => (
                    <th
                      key={role}
                      className="text-center py-2 px-3 text-muted-foreground font-medium"
                    >
                      {ROLE_CONFIG[role].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "View warm leads & signals",
                    owner: true,
                    admin: true,
                    sales_rep: true,
                    viewer: true,
                  },
                  {
                    label: "Approve / reject messages",
                    owner: true,
                    admin: true,
                    sales_rep: true,
                    viewer: false,
                  },
                  {
                    label: "Manage campaigns",
                    owner: true,
                    admin: true,
                    sales_rep: false,
                    viewer: false,
                  },
                  {
                    label: "Edit knowledge base",
                    owner: true,
                    admin: true,
                    sales_rep: false,
                    viewer: false,
                  },
                  {
                    label: "Manage integrations",
                    owner: true,
                    admin: true,
                    sales_rep: false,
                    viewer: false,
                  },
                  {
                    label: "Manage team & billing",
                    owner: true,
                    admin: false,
                    sales_rep: false,
                    viewer: false,
                  },
                  {
                    label: "Change AI settings",
                    owner: true,
                    admin: true,
                    sales_rep: false,
                    viewer: false,
                  },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-border/30 last:border-0">
                    <td className="py-2 pr-4 text-foreground">{row.label}</td>
                    {(["owner", "admin", "sales_rep", "viewer"] as const).map((role) => (
                      <td key={role} className="text-center py-2 px-3">
                        {row[role] ? (
                          <span className="text-emerald-500">✓</span>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
