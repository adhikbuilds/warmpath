import { NextResponse } from "next/server";
import { DEMO_SIGNALS } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json(DEMO_SIGNALS);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
