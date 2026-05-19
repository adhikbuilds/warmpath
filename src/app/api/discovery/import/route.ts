import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const leads: unknown[] = Array.isArray(body.leads) ? body.leads : [];
  return NextResponse.json({ imported: leads.length, status: "ok" });
}
