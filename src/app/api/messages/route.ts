import { NextResponse } from "next/server";
import { DEMO_MESSAGES } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json(DEMO_MESSAGES);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
