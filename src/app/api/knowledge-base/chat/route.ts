import { type NextRequest, NextResponse } from "next/server";
import { callAzureChat, isAzureConfigured } from "@/lib/ai/azure-generate";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";

export async function POST(req: NextRequest) {
  const { workspaceId } = await getWorkspaceContext();
  if (!workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const question: string = (body.question ?? "").toString().trim();
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const items = await prisma.knowledgeBaseItem.findMany({
    where: { workspaceId, approvedForAi: true },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  if (items.length === 0) {
    return NextResponse.json({
      answer:
        "Your knowledge base is empty. Add and approve some items so I can answer questions grounded in your content.",
      sources: [],
      used_azure: false,
    });
  }

  const kbText = items
    .map((k) => `[${k.type.toUpperCase()}] ${k.title}:\n${k.content.slice(0, 600)}`)
    .join("\n\n---\n\n");

  if (isAzureConfigured()) {
    try {
      const system = `You are a knowledge base assistant for a B2B sales team. Answer the user's question using ONLY the approved KB items below. Be concise (2-4 sentences). After answering, add "Sources: [comma-separated item titles you cited]". If nothing in the KB addresses the question, say so clearly — do not invent.

APPROVED KB ITEMS:
${kbText}`;

      const raw = await callAzureChat(system, question, { maxTokens: 500, temperature: 0.3 });

      // Extract sources line from response
      const sourcesMatch = raw.match(/Sources?:\s*(.+)$/im);
      const sources = sourcesMatch
        ? sourcesMatch[1]
            .split(/,\s*/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const answer = raw.replace(/Sources?:\s*.+$/im, "").trim();

      return NextResponse.json({ answer, sources, used_azure: true });
    } catch {
      // Fall through to keyword fallback
    }
  }

  // Keyword fallback — deterministic, no LLM cost
  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  const scored = items
    .map((k) => {
      const hay = `${k.title} ${k.content}`.toLowerCase();
      const score = terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
      return { k, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (scored.length === 0) {
    return NextResponse.json({
      answer:
        "I couldn't find a KB item that directly answers this. Consider adding more approved content or rephrasing the question.",
      sources: [],
      used_azure: false,
    });
  }

  const answer = scored
    .map((x) => `From "${x.k.title}": ${x.k.content.slice(0, 300)}`)
    .join("\n\n");
  const sources = scored.map((x) => x.k.title);

  return NextResponse.json({ answer, sources, used_azure: false });
}
