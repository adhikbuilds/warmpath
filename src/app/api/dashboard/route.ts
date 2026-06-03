import { NextResponse } from "next/server";
import { getAuthContext, unauthorized } from "@/lib/db/auth-helpers";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return unauthorized();
  const wsId = ctx.workspaceId;
  const now = new Date();

  const [
    accounts_count,
    contacts_count,
    signals_count,
    urgent_signals_count,
    pending_approvals_count,
    campaigns_count,
    warm_paths_count,
    tasks_overdue_count,
  ] = await Promise.all([
    prisma.bizAccount.count({ where: { workspaceId: wsId } }),
    prisma.contact.count({ where: { workspaceId: wsId } }),
    prisma.signal.count({ where: { workspaceId: wsId } }),
    prisma.signal.count({ where: { workspaceId: wsId, urgencyScore: { gte: 80 } } }),
    prisma.approval.count({ where: { workspaceId: wsId, status: "pending" } }),
    prisma.campaign.count({ where: { workspaceId: wsId } }),
    prisma.warmPath.count({ where: { workspaceId: wsId } }),
    prisma.task.count({
      where: { workspaceId: wsId, dueAt: { lt: now }, status: { not: "completed" } },
    }),
  ]);

  return NextResponse.json({
    accounts_count,
    contacts_count,
    signals_count,
    urgent_signals_count,
    pending_approvals_count,
    campaigns_count,
    warm_paths_count,
    tasks_overdue_count,
  });
}
