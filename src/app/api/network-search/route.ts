import { type NextRequest, NextResponse } from "next/server";
import { callAzureChat, isAzureConfigured } from "@/lib/ai/azure-generate";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { logger } from "@/lib/logger";

// Network Search over the workspace's OWN connected contacts (no external
// network provider). The plain-language query is matched against imported
// contacts; Azure OpenAI ranks them, with a deterministic keyword fallback.

interface NetworkResult {
  id: string;
  name: string;
  title?: string;
  company?: string;
  summary?: string;
  linkedin_url?: string;
  warm_path?: string;
}

const MAX_CONTACTS = 150;

export async function POST(req: NextRequest) {
  const { workspaceId } = await getWorkspaceContext();
  if (!workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const query: string = (body.query ?? "").toString().trim();
  const limit: number = Math.min(Number(body.limit) || 25, 50);

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const contacts = await prisma.contact.findMany({
    where: { workspaceId },
    include: { account: { select: { name: true } } },
    orderBy: { warmthScore: "desc" },
    take: MAX_CONTACTS,
  });

  if (contacts.length === 0) {
    return NextResponse.json({ results: [], source: "own-network", reason: "no_contacts" });
  }

  const toResult = (c: (typeof contacts)[number], summary?: string): NetworkResult => ({
    id: c.id,
    name: c.name,
    title: c.title ?? undefined,
    company: c.account?.name ?? undefined,
    summary: summary ?? ([c.title, c.account?.name].filter(Boolean).join(" · ") || undefined),
    linkedin_url: c.linkedinUrl ?? undefined,
    warm_path: undefined,
  });

  // Try the LLM ranking first.
  if (isAzureConfigured()) {
    try {
      const roster = contacts.map((c) => ({
        id: c.id,
        name: c.name,
        title: c.title ?? "",
        company: c.account?.name ?? "",
        seniority: c.seniority ?? "",
        persona: c.persona ?? "",
      }));

      const system =
        "You are a network search assistant. The user describes who they are looking for. " +
        "From the provided list of their contacts, return ONLY genuine matches, ranked best-first. " +
        'Respond as strict JSON: {"results":[{"id":"<contact id>","reason":"<one sentence why this person matches>"}]}. ' +
        "Return an empty results array if nothing matches. Never invent contacts or ids.";
      const user = `Looking for: ${query}\n\nContacts:\n${JSON.stringify(roster)}`;

      const raw = await callAzureChat(system, user, { jsonObject: true, maxTokens: 900 });
      const parsed = JSON.parse(raw) as { results?: Array<{ id: string; reason?: string }> };
      const byId = new Map(contacts.map((c) => [c.id, c]));
      const ranked: NetworkResult[] = [];
      for (const r of parsed.results ?? []) {
        const c = byId.get(r.id);
        if (c) ranked.push(toResult(c, r.reason));
        if (ranked.length >= limit) break;
      }
      return NextResponse.json({ results: ranked, source: "own-network" });
    } catch (err) {
      logger.warn("Network search LLM ranking failed, using keyword fallback", { error: err });
    }
  }

  // Deterministic fallback: keyword overlap, then warmth.
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  const scored = contacts
    .map((c) => {
      const hay = [c.name, c.title, c.account?.name, c.persona, c.seniority]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const score = terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.c.warmthScore ?? 0) - (a.c.warmthScore ?? 0))
    .slice(0, limit)
    .map((x) => toResult(x.c));

  return NextResponse.json({ results: scored, source: "own-network" });
}
