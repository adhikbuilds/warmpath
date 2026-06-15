import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

// Known seed IDs inserted by prisma/seed.ts — safe to delete unconditionally.
// Real contacts from Google/LinkedIn imports always get UUID-style IDs, never "con-N".
const SEED_CONTACT_IDS = [
  "con-1",
  "con-2",
  "con-3",
  "con-4",
  "con-5",
  "con-6",
  "con-7",
  "con-8",
  "con-9",
  "con-10",
  "con-11",
  "con-12",
];
const SEED_ACCOUNT_IDS = [
  "acc-1",
  "acc-2",
  "acc-3",
  "acc-4",
  "acc-5",
  "acc-6",
  "acc-7",
  "acc-8",
  "acc-9",
  "acc-10",
];
const SEED_EDGE_ID_PREFIX = "re-";

// POST /api/admin/clear-demo-data
// Wipes seed-inserted demo data from the workspace. Safe to run repeatedly.
// Real contacts (UUID IDs from Google/LinkedIn imports) are never deleted.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // 1. Delete all signals and tasks (always demo/stale until real signals are fetched)
  const [deletedSignals, deletedTasks] = await Promise.all([
    prisma.signal.deleteMany({ where: { workspaceId } }),
    prisma.task.deleteMany({ where: { workspaceId } }),
  ]);

  // 2. Delete warm paths and messages referencing seed accounts/contacts
  //    (cascade would handle this, but Prisma schema may not have cascades set)
  const [deletedWarmPaths, deletedMessages] = await Promise.all([
    prisma.warmPath.deleteMany({
      where: {
        workspaceId,
        OR: [{ accountId: { in: SEED_ACCOUNT_IDS } }, { contactId: { in: SEED_CONTACT_IDS } }],
      },
    }),
    prisma.message.deleteMany({
      where: {
        workspaceId,
        OR: [{ accountId: { in: SEED_ACCOUNT_IDS } }, { contactId: { in: SEED_CONTACT_IDS } }],
      },
    }),
  ]);

  // 3. Delete seed contacts (con-1 through con-12)
  const deletedContacts = await prisma.contact.deleteMany({
    where: { workspaceId, id: { in: SEED_CONTACT_IDS } },
  });

  // 4. Delete seed accounts (acc-1 through acc-10)
  const deletedSeedAccounts = await prisma.bizAccount.deleteMany({
    where: { workspaceId, id: { in: SEED_ACCOUNT_IDS } },
  });

  // 5. Delete seed relationship edges (re-N prefix)
  const deletedEdges = await prisma.relationshipEdge.deleteMany({
    where: { workspaceId, id: { startsWith: SEED_EDGE_ID_PREFIX } },
  });

  // 6. Fix li-acc- prefixed account names (LinkedIn/Clay IDs stored as names)
  const liAccAccounts = await prisma.bizAccount.findMany({
    where: { workspaceId, name: { startsWith: "li-acc-" } },
    select: { id: true, name: true },
  });
  const slugToTitle = (s: string) =>
    s
      .replace(/^li-acc-/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  let fixedAccountNames = 0;
  for (const acc of liAccAccounts) {
    const newName = slugToTitle(acc.name);
    await prisma.bizAccount
      .update({ where: { id: acc.id }, data: { name: newName } })
      .catch(() => null);
    fixedAccountNames++;
  }

  // 7. Delete accounts that have NO contacts (orphaned demo/test accounts)
  const accountsWithContacts = await prisma.contact.findMany({
    where: { workspaceId, accountId: { not: null } },
    select: { accountId: true },
    distinct: ["accountId"],
  });
  const activeAccountIds = accountsWithContacts
    .map((c) => c.accountId)
    .filter((id): id is string => id !== null);

  const deletedOrphans = await prisma.bizAccount.deleteMany({
    where: { workspaceId, id: { notIn: activeAccountIds } },
  });

  return NextResponse.json({
    ok: true,
    deleted: {
      signals: deletedSignals.count,
      tasks: deletedTasks.count,
      seed_contacts: deletedContacts.count,
      seed_accounts: deletedSeedAccounts.count,
      seed_edges: deletedEdges.count,
      warm_paths: deletedWarmPaths.count,
      messages: deletedMessages.count,
      orphaned_accounts: deletedOrphans.count,
    },
    fixed: { account_names: fixedAccountNames },
    message: "Demo data cleared. Real contacts and edges are untouched.",
  });
}
