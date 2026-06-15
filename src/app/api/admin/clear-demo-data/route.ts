import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

// POST /api/admin/clear-demo-data
// Wipes signals, tasks, and demo-named accounts from the workspace DB.
// Safe to run repeatedly — contacts and relationship edges are preserved.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const [deletedSignals, deletedTasks] = await Promise.all([
    prisma.signal.deleteMany({ where: { workspaceId } }),
    prisma.task.deleteMany({ where: { workspaceId } }),
  ]);

  // Delete accounts that have NO contacts in them (likely demo/test accounts)
  const accountsWithContacts = await prisma.contact.findMany({
    where: { workspaceId, accountId: { not: null } },
    select: { accountId: true },
    distinct: ["accountId"],
  });
  const activeAccountIds = accountsWithContacts
    .map((c) => c.accountId)
    .filter((id): id is string => id !== null);

  const deletedAccounts = await prisma.bizAccount.deleteMany({
    where: {
      workspaceId,
      id: { notIn: activeAccountIds },
    },
  });

  return NextResponse.json({
    ok: true,
    deleted: {
      signals: deletedSignals.count,
      tasks: deletedTasks.count,
      orphaned_accounts: deletedAccounts.count,
    },
    message: "Demo data cleared. Run Map My Network + Fetch Signals to populate with real data.",
  });
}
