import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { researchPerson } from "@/lib/happenstance/client";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, company, linkedinUrl } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  try {
    const profile = await researchPerson({ name, company, linkedinUrl });
    return NextResponse.json({
      profile,
      source: process.env.HAPPENSTANCE_API_KEY ? "happenstance" : "mock",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
