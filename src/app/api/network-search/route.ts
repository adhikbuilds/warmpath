import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_CONTACTS } from "@/lib/demo-data";
import { DEMO_CONTACTS_EXTRA } from "@/lib/demo-data-extended";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { query = "" } = body as { query?: string };

  try {
    const workspaceId = await getWorkspaceId();

    // Fetch contacts from DB (fall back to demo data)
    const prismaContacts = await prisma.contact.findMany({
      where: { workspaceId },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });

    const allContacts =
      prismaContacts.length > 0
        ? prismaContacts.map((c) => ({
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
            // warm_path is computed separately via /api/warm-paths/generate-for-contact
            warm_path: undefined as undefined,
          }))
        : [...DEMO_CONTACTS, ...DEMO_CONTACTS_EXTRA].map((c) => ({
            id: c.id,
            name: c.name,
            title: c.title,
            email: c.email,
            company: "",
            account_id: c.account_id,
            seniority: c.seniority,
            department: c.department,
            warmth_score: c.warmth_score,
            fit_score: c.fit_score,
            linkedin_url: c.linkedin_url,
            avatar_url: c.avatar_url,
            warm_path: undefined as undefined,
          }));

    // Filter by query if provided
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
  } catch {
    // Fallback to demo data
    const lower = query.toLowerCase().trim();
    const contacts = [...DEMO_CONTACTS, ...DEMO_CONTACTS_EXTRA];
    const results =
      lower.length < 2
        ? contacts
        : contacts.filter(
            (c) =>
              c.name.toLowerCase().includes(lower) ||
              c.title?.toLowerCase().includes(lower) ||
              c.department?.toLowerCase().includes(lower),
          );
    return NextResponse.json({
      results: results.slice(0, 50).map((c) => ({
        id: c.id,
        name: c.name,
        title: c.title,
        email: c.email,
        company: "",
        account_id: c.account_id,
        seniority: c.seniority,
        department: c.department,
        warmth_score: c.warmth_score,
        fit_score: c.fit_score,
        linkedin_url: c.linkedin_url,
        avatar_url: c.avatar_url,
        warm_path: undefined,
      })),
    });
  }
}
