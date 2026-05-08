import { NextResponse } from "next/server";
import { DEMO_INTEGRATIONS } from "@/lib/demo-data-omnichannel";

export async function GET() {
  return NextResponse.json(DEMO_INTEGRATIONS);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
