import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { searchNetwork } from "@/lib/happenstance/client";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { query = "VP Sales FinTech AI SaaS", limit = 10 } = body;
  try {
    const results = await searchNetwork(query, { limit });
    return NextResponse.json({
      results,
      source: process.env.HAPPENSTANCE_API_KEY ? "happenstance" : "mock",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
