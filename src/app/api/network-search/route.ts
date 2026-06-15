import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { query = "" } = body as { query?: string };

  try {
    const workspaceId = await getWorkspaceId();

    const prismaContacts = await prisma.contact.findMany({
      where: { workspaceId },
      include: { account: true },
      orderBy: [{ warmthScore: "desc" }, { createdAt: "desc" }],
      take: 500,
    });

    const allContacts = prismaContacts.map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title ?? "",
      email: c.email ?? "",
      company: c.account?.name ?? "",
      account_id: c.accountId ?? "",
      seniority: c.seniority ?? "",
      department: c.department ?? "",
      warmth_score: c.warmthScore,
      fit_score: c.fitScore,
      linkedin_url: c.linkedinUrl ?? undefined,
      avatar_url: c.avatarUrl ?? undefined,
      warm_path: undefined as undefined,
    }));

    const lower = query.toLowerCase().trim();
    const results =
      lower.length < 2
        ? allContacts
        : allContacts.filter(
            (c) =>
              c.name.toLowerCase().includes(lower) ||
              c.title?.toLowerCase().includes(lower) ||
              c.company?.toLowerCase().includes(lower) ||
              c.department?.toLowerCase().includes(lower),
          );

    return NextResponse.json({ results: results.slice(0, 50) });
  } catch (err) {
    console.error("[network-search] error:", err);
    return NextResponse.json({ results: [] });
  }
}
