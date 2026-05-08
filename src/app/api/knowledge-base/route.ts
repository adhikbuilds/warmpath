import { NextResponse } from "next/server";
import { DEMO_KB_ITEMS } from "@/lib/demo-data-extended";

export async function GET() {
  return NextResponse.json(DEMO_KB_ITEMS);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
