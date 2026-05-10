import { NextResponse } from "next/server";
import { DEMO_CAMPAIGNS } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json(DEMO_CAMPAIGNS);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
