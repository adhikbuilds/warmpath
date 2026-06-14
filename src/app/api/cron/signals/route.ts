import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AZURE_API_KEY, AZURE_DEPLOYMENT, AZURE_ENDPOINT } from "@/lib/ai/azure-generate";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

const API_VERSION = "2024-08-01-preview";

const SIGNAL_FEEDS = [
  { url: "https://techcrunch.com/category/fundings-exits/feed/", source: "TechCrunch" },
  { url: "https://news.crunchbase.com/feed/", source: "Crunchbase News" },
  { url: "https://venturebeat.com/category/business/feed/", source: "VentureBeat" },
  { url: "https://www.businesswire.com/rss/home/?rss=G22", source: "Business Wire" },
];

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

interface ExtractedSignal {
  idx: number;
  company: string;
  signal_type: "funding" | "leadership_change" | "product_launch" | "job_posting" | "news_mention";
  title: string;
  description: string;
  amount?: string;
  urgency_score: number;
  // ICP relevance — 0 means skip, >60 means surface
  icp_relevance_score: number;
  icp_relevance_reason: string;
}

function parseRssItems(xml: string, source: string): RssItem[] {
  const items: RssItem[] = [];
  const cutoff = Date.now() - 72 * 60 * 60 * 1000; // last 72 hours

  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = match[1];
    const title =
      block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)?.[1] ??
      block.match(/<title>(.*?)<\/title>/s)?.[1] ??
      "";
    const link =
      block.match(/<link>(.*?)<\/link>/s)?.[1] ??
      block.match(/<link\s[^>]*href="([^"]+)"/)?.[1] ??
      "";
    const desc =
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/s)?.[1] ??
      block.match(/<description>([\s\S]*?)<\/description>/s)?.[1] ??
      "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

    if (!title || !link) continue;
    const pub = pubDate ? new Date(pubDate).getTime() : Date.now();
    if (pub < cutoff) continue;

    items.push({
      title: title.replace(/<[^>]+>/g, "").trim(),
      description: desc.replace(/<[^>]+>/g, "").slice(0, 600).trim(),
      link: link.trim(),
      pubDate,
      source,
    });
  }
  return items;
}

async function fetchFeed(feedUrl: string, source: string): Promise<RssItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "WarmPath/1.0 Signal Ingestion" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return parseRssItems(await res.text(), source);
  } catch {
    return [];
  }
}

interface WorkspaceContext {
  name: string;
  industry: string;
  description: string;
  sellingMotion: string;
  primaryGoal: string;
  topAccountIndustries: string[];
  kbSummary: string;
}

async function extractSignalsForICP(
  items: RssItem[],
  ctx: WorkspaceContext,
): Promise<Array<{ item: RssItem; signal: ExtractedSignal | null }>> {
  if (!AZURE_ENDPOINT || !AZURE_API_KEY) return items.map((item) => ({ item, signal: null }));

  const url = `${AZURE_ENDPOINT.replace(/\/$/, "")}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

  const icpContext = `
WORKSPACE: ${ctx.name}
INDUSTRY: ${ctx.industry || "B2B SaaS"}
WHAT WE SELL: ${ctx.description || ctx.primaryGoal || "B2B software"}
SELLING MOTION: ${ctx.sellingMotion || "outbound"}
TARGET ACCOUNT INDUSTRIES: ${ctx.topAccountIndustries.join(", ") || "technology, SaaS, fintech"}
PRODUCT KNOWLEDGE: ${ctx.kbSummary || "B2B sales intelligence and warm intro platform"}
`.trim();

  // Batch articles into groups of 8 to keep token cost low
  const results: Array<{ item: RssItem; signal: ExtractedSignal | null }> = [];
  const batches: RssItem[][] = [];
  for (let i = 0; i < items.length; i += 8) batches.push(items.slice(i, i + 8));

  for (const batch of batches) {
    const articlesJson = batch.map((item, i) => ({
      idx: i,
      title: item.title,
      summary: item.description.slice(0, 300),
      source: item.source,
    }));

    const prompt = `You are a B2B sales signal analyst. Evaluate these news articles for a specific sales team.

SALES TEAM ICP:
${icpContext}

ARTICLES:
${JSON.stringify(articlesJson, null, 2)}

For each article, return a JSON array (same order, same length as input):
[
  {
    "idx": 0,
    "skip": false,
    "company": "exact company name",
    "signal_type": "funding" | "leadership_change" | "product_launch" | "job_posting" | "news_mention",
    "title": "signal title under 80 chars that frames it as a sales opportunity",
    "description": "1-2 sentences describing the signal",
    "amount": "funding amount if applicable, else null",
    "urgency_score": 1-100,
    "icp_relevance_score": 0-100 (how relevant is this to the sales team's ICP and use case — 0 = irrelevant, 80+ = strong buying trigger),
    "icp_relevance_reason": "one sentence explaining why this matters for this specific team's sales motion, or empty string if not relevant"
  }
]

Rules:
- Set skip=true if the article is opinion, listicle, consumer news, or you cannot identify a B2B company
- icp_relevance_score above 60 = worth surfacing; below 60 = set skip=true
- For funding signals: high score if target company raised money (budget signal) in a relevant sector
- For leadership change: high score if new CXO/VP joined who would be a buyer
- Frame titles from the sales rep's perspective ("Acme raised $20M — budget unlocked for new tooling")`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": AZURE_API_KEY },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        batch.forEach((item) => results.push({ item, signal: null }));
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "{}";
      // The model may return { "signals": [...] } or just [...]
      const parsed = JSON.parse(content);
      const arr: ExtractedSignal[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.signals)
          ? parsed.signals
          : Array.isArray(parsed.results)
            ? parsed.results
            : [];

      for (const item of batch) {
        const entry = arr.find((a) => a.idx === batch.indexOf(item)) ?? arr[batch.indexOf(item)];
        if (!entry || (entry as unknown as { skip?: boolean }).skip || !entry.company || entry.icp_relevance_score < 60) {
          results.push({ item, signal: null });
        } else {
          results.push({ item, signal: entry });
        }
      }
    } catch {
      batch.forEach((item) => results.push({ item, signal: null }));
    }
  }

  return results;
}

function fuzzyMatch(accountName: string, company: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\b(inc|llc|ltd|corp|co|technologies|technology|systems|solutions|platform|platforms)\b/g, "")
      .trim();
  const a = normalize(accountName);
  const b = normalize(company);
  if (!a || !b) return false;
  // Exact or contains match
  return a === b || a.includes(b) || b.includes(a);
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && req.headers.get("x-cron-secret") === cronSecret;

  if (!isCron) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  // Load workspace context for ICP matching
  const [workspace, accounts, kbItems] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, industry: true, description: true, sellingMotion: true, primaryGoal: true },
    }),
    prisma.bizAccount.findMany({
      where: { workspaceId },
      select: { id: true, name: true, industry: true },
    }),
    prisma.knowledgeBaseItem.findMany({
      where: { workspaceId, approvedForAi: true },
      select: { title: true, content: true },
      take: 5,
    }),
  ]);

  if (!workspace || accounts.length === 0) {
    return NextResponse.json({ message: "No accounts to match against", ingested: 0 });
  }

  // Build ICP context from real workspace data
  const industryFreq: Record<string, number> = {};
  for (const a of accounts) if (a.industry) industryFreq[a.industry] = (industryFreq[a.industry] ?? 0) + 1;
  const topIndustries = Object.entries(industryFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ind]) => ind);

  const kbSummary = kbItems
    .map((k) => `${k.title}: ${k.content.slice(0, 150)}`)
    .join(" | ")
    .slice(0, 600);

  const workspaceCtx: WorkspaceContext = {
    name: workspace.name,
    industry: workspace.industry ?? "",
    description: workspace.description ?? workspace.primaryGoal ?? "",
    sellingMotion: workspace.sellingMotion ?? "outbound",
    primaryGoal: workspace.primaryGoal ?? "",
    topAccountIndustries: topIndustries,
    kbSummary,
  };

  // Fetch all RSS feeds in parallel
  const allItems = (await Promise.all(SIGNAL_FEEDS.map((f) => fetchFeed(f.url, f.source)))).flat();

  // Dedupe by URL
  const seen = new Set<string>();
  const uniqueItems = allItems.filter((i) => {
    if (seen.has(i.link)) return false;
    seen.add(i.link);
    return true;
  });

  // Skip already-ingested URLs
  const existingUrls = new Set(
    (
      await prisma.signal.findMany({
        where: { workspaceId, sourceUrl: { in: uniqueItems.map((i) => i.link) } },
        select: { sourceUrl: true },
      })
    ).map((s) => s.sourceUrl),
  );
  const newItems = uniqueItems.filter((i) => !existingUrls.has(i.link));

  if (newItems.length === 0) {
    return NextResponse.json({ ok: true, fetched: uniqueItems.length, new: 0, ingested: 0, skipped: 0 });
  }

  // Extract + ICP-score all articles in one batched LLM call
  const extracted = await extractSignalsForICP(newItems, workspaceCtx);

  let ingested = 0;
  let skipped = 0;
  let unmatched = 0;

  for (const { item, signal } of extracted) {
    if (!signal) { skipped++; continue; }

    const matchedAccount = accounts.find((a) => fuzzyMatch(a.name, signal.company));
    if (!matchedAccount) { unmatched++; continue; }

    // Embed ICP relevance reason into description so signal cards surface it
    const description = [
      signal.description,
      signal.amount ? `Funding: ${signal.amount}.` : null,
      signal.icp_relevance_reason ? `💡 ${signal.icp_relevance_reason}` : null,
    ]
      .filter(Boolean)
      .join(" ");

    await prisma.signal.create({
      data: {
        workspaceId,
        accountId: matchedAccount.id,
        type: signal.signal_type,
        title: signal.title,
        description,
        source: item.source,
        sourceUrl: item.link,
        urgencyScore: Math.min(100, Math.max(1, signal.urgency_score)),
        confidenceScore: Math.min(100, Math.max(1, signal.icp_relevance_score)),
        detectedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      },
    });
    ingested++;
  }

  return NextResponse.json({
    ok: true,
    fetched: uniqueItems.length,
    new: newItems.length,
    ingested,
    skipped,
    unmatched,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
