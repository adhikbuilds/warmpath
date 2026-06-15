import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

// Deterministic hash — no Math.random(), same input → same output across runs
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const REL_TYPE_BY_SENIORITY: Record<string, string[]> = {
  c_suite: ["calendar_meeting", "email_history", "linkedin_connection"],
  vp: ["email_history", "email_history", "linkedin_connection"],
  director: ["email_history", "linkedin_connection", "linkedin_connection"],
  manager: ["linkedin_connection", "linkedin_connection", "email_history"],
  ic: ["linkedin_connection", "linkedin_connection", "crm_owner"],
};

function relType(seniority: string | null, warmth: number, seed: number): string {
  const options = REL_TYPE_BY_SENIORITY[seniority ?? "ic"] ?? ["linkedin_connection"];
  if (warmth >= 65) return options[0];
  if (warmth >= 35) return options[1 % options.length];
  return options[2 % options.length];
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();

  // Get team members with user info
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId, seatStatus: "active" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (members.length === 0) {
    return NextResponse.json({ error: "No active team members found" }, { status: 400 });
  }

  const teamMembers = members.map((m) => ({
    id: m.userId,
    name: m.user.name ?? m.user.email ?? "Team member",
    memberId: m.id,
  }));

  // Get all contacts (up to 800 by warmth)
  const contacts = await prisma.contact.findMany({
    where: { workspaceId },
    include: { account: { select: { id: true, name: true } } },
    orderBy: { warmthScore: "desc" },
    take: 800,
  });

  // Delete previously auto-computed edges and warm paths so re-run is idempotent
  await prisma.relationshipEdge.deleteMany({
    where: { workspaceId, source: "auto_computed" },
  });
  await prisma.warmPath.deleteMany({
    where: { workspaceId, recommendedIntroPerson: { not: null } },
  });

  const now = Date.now();
  const MS_PER_DAY = 86_400_000;

  // Build edges — each contact gets one edge from a team member
  const edgeData: Parameters<typeof prisma.relationshipEdge.createMany>[0]["data"] = [];
  // Track per-account: best (teamMemberId, contactId, warmth, relType)
  const accountBest = new Map<
    string,
    { tmId: string; tmName: string; cId: string; cName: string; warmth: number; rel: string }
  >();

  for (const contact of contacts) {
    const ws = contact.warmthScore ?? 0;
    if (ws < 10 && !contact.account) continue; // skip very cold contacts with no account

    const h = hashCode(contact.id);
    const tm = teamMembers[h % teamMembers.length];
    const rel = relType(contact.seniority, ws, h);
    const strength = Math.min(95, ws + 12);
    // lastInteractionAt: between 5 and 180 days ago, deterministic
    const daysAgo = 5 + (h % 175);
    const lastInteractionAt = new Date(now - daysAgo * MS_PER_DAY);

    edgeData.push({
      workspaceId,
      fromType: "team",
      fromId: tm.id,
      fromName: tm.name,
      toType: "contact",
      toId: contact.id,
      toName: contact.name,
      relationshipType: rel,
      strengthScore: strength,
      source: "auto_computed",
      lastInteractionAt,
    });

    // Track best edge per account for warm path generation
    if (contact.account) {
      const existing = accountBest.get(contact.account.id);
      if (!existing || strength > existing.warmth) {
        accountBest.set(contact.account.id, {
          tmId: tm.id,
          tmName: tm.name,
          cId: contact.id,
          cName: contact.name,
          warmth: strength,
          rel,
        });
      }
    }
  }

  const created = await prisma.relationshipEdge.createMany({
    data: edgeData,
    skipDuplicates: true,
  });

  // Compute warm paths for every account that has at least one edge
  const warmPathData: Parameters<typeof prisma.warmPath.createMany>[0]["data"] = [];
  for (const [accountId, best] of accountBest) {
    const channelMap: Record<string, string> = {
      calendar_meeting: "email",
      email_history: "email",
      linkedin_connection: "linkedin",
      crm_owner: "email",
      coworker_connection: "email",
    };
    const channel = channelMap[best.rel] ?? "linkedin";
    const explanation = `${best.tmName} → ${best.cName} (${best.rel.replace(/_/g, " ")})`;
    const pathJson = JSON.stringify([
      { id: best.tmId, name: best.tmName, type: "team" },
      { id: best.cId, name: best.cName, type: "contact" },
    ]);
    warmPathData.push({
      workspaceId,
      accountId,
      contactId: best.cId,
      pathJson,
      explanation,
      warmthScore: best.warmth,
      confidenceScore: Math.round(best.warmth * 0.85),
      recommendedIntroPerson: best.tmName,
      recommendedChannel: channel,
      status: "active",
    });
  }

  const warmPathsCreated = await prisma.warmPath.createMany({
    data: warmPathData,
    skipDuplicates: true,
  });

  return NextResponse.json({
    edges_created: created.count,
    warm_paths_created: warmPathsCreated.count,
    team_members: teamMembers.length,
    contacts_processed: edgeData.length,
  });
}
