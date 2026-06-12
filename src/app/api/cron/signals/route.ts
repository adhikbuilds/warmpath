import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AZURE_API_KEY, AZURE_DEPLOYMENT, AZURE_ENDPOINT } from "@/lib/ai/azure-generate";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

const API_VERSION = "2024-08-01-preview";

// Free RSS feeds that reliably cover funding rounds and leadership changes
const SIGNAL_FEEDS = [
  {
    url: "https://techcrunch.com/category/fundings-exits/feed/",
    source: "TechCrunch",
    defaultType: "funding",
  },
  {
    url: "https://news.crunchbase.com/feed/",
    source: "Crunchbase News",
    defaultType: "funding",
  },
  {
    url: "https://venturebeat.com/category/business/feed/",
    source: "VentureBeat",
    defaultType: "funding",
  },
];

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

interface ExtractedSignal {
  company: string;
  signal_type: "funding" | "leadership_change" | "product_launch" | "job_posting" | "news_mention";
  title: string;
  description: string;
  amount?: string;
  urgency_score: number;
  confidence_score: number;
}

function parseRssItems(xml: string, source: string): RssItem[] {
  const items: RssItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  const cutoff = Date.now() - 48 * 60 * 60 * 1000; // last 48 hours

  for (const match of itemMatches) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
    const link = block.match(/<link>(.*?)<\/link>|<link\s[^>]*href="([^"]+)"/)?.[1] ?? block.match(/<link\s[^>]*href="([^"]+)"/)?.[2] ?? "";
    const desc = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/)?.[1] ?? "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

    if (!title || !link) continue;

    const pub = pubDate ? new Date(pubDate).getTime() : Date.now();
    if (pub < cutoff) continue;

    items.push({
      title: title.replace(/<[^>]+>/g, "").trim(),
      description: desc.replace(/<[^>]+>/g, "").slice(0, 500).trim(),
      link: link.trim(),
      pubDate: pubDate,
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
    const xml = await res.text();
    return parseRssItems(xml, source);
  } catch {
    return [];
  }
}

async function extractSignal(item: RssItem): Promise<ExtractedSignal | null> {
  if (!AZURE_ENDPOINT || !AZURE_API_KEY) return null;

  const url = `${AZURE_ENDPOINT.replace(/\/$/, "")}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

  const prompt = `Extract structured signal data from this news article for a B2B sales tool.

HEADLINE: ${item.title}
SUMMARY: ${item.description}
SOURCE: ${item.source}

Return JSON only (no markdown):
{
  "company": "exact company name that received funding or is the subject",
  "signal_type": one of: "funding" | "leadership_change" | "product_launch" | "job_posting" | "news_mention",
  "title": "concise signal title under 80 chars",
  "description": "1-2 sentence description useful for sales outreach",
  "amount": "funding amount if mentioned, e.g. '$10M Series A', otherwise null",
  "urgency_score": number 1-100 (funding rounds = 80+, product launches = 70, news = 50),
  "confidence_score": number 1-100 (how confident you are this is a real actionable signal)
}

If this is not a clear B2B signal (e.g. it's consumer news, opinion piece, or you can't identify a company), return: {"skip": true}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": AZURE_API_KEY },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    if (parsed.skip || !parsed.company || !parsed.title) return null;
    return parsed as ExtractedSignal;
  } catch {
    return null;
  }
}

function fuzzyMatch(accountName: string, company: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(inc|llc|ltd|corp|co)$/, "");
  const a = normalize(accountName);
  const b = normalize(company);
  return a === b || a.includes(b) || b.includes(a);
}

export async function POST(req: NextRequest) {
  // Allow auth'd users OR a cron secret header
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && req.headers.get("x-cron-secret") === cronSecret;

  if (!isCron) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Load all workspace accounts for matching
  const accounts = await prisma.bizAccount.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
  });

  if (accounts.length === 0) {
    return NextResponse.json({ message: "No accounts to match against", ingested: 0 });
  }

  // Fetch all RSS feeds in parallel
  const allItems = (
    await Promise.all(SIGNAL_FEEDS.map((f) => fetchFeed(f.url, f.source)))
  ).flat();

  // Dedupe by URL
  const seen = new Set<string>();
  const uniqueItems = allItems.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  // Check which URLs already exist as signals (avoid re-ingesting)
  const existingUrls = new Set(
    (
      await prisma.signal.findMany({
        where: { workspaceId, sourceUrl: { in: uniqueItems.map((i) => i.link) } },
        select: { sourceUrl: true },
      })
    ).map((s) => s.sourceUrl),
  );

  const newItems = uniqueItems.filter((i) => !existingUrls.has(i.link));

  let ingested = 0;
  let skipped = 0;
  let unmatched = 0;

  // Process in batches of 5 to avoid hammering Azure OpenAI
  for (let i = 0; i < newItems.length; i += 5) {
    const batch = newItems.slice(i, i + 5);
    const extracted = await Promise.all(batch.map(async (item) => ({ item, signal: await extractSignal(item) })));

    for (const { item, signal } of extracted) {
      if (!signal) { skipped++; continue; }

      // Find matching account
      const matchedAccount = accounts.find((a) => fuzzyMatch(a.name, signal.company));
      if (!matchedAccount) { unmatched++; continue; }

      await prisma.signal.create({
        data: {
          workspaceId,
          accountId: matchedAccount.id,
          type: signal.signal_type,
          title: signal.title,
          description: signal.description + (signal.amount ? ` Amount: ${signal.amount}.` : ""),
          source: item.source,
          sourceUrl: item.link,
          urgencyScore: Math.min(100, Math.max(1, signal.urgency_score)),
          confidenceScore: Math.min(100, Math.max(1, signal.confidence_score)),
          detectedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        },
      });
      ingested++;
    }
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

// GET for easy manual trigger from browser / dashboard
export async function GET(req: NextRequest) {
  return POST(req);
}
