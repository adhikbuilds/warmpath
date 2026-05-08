import { NextResponse } from "next/server";
import { DEMO_AI_USAGE } from "@/lib/demo-data-extended";

export async function GET() {
  return NextResponse.json(DEMO_AI_USAGE);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
