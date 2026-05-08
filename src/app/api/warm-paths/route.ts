import { NextResponse } from "next/server";
import { DEMO_WARM_PATHS } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json(DEMO_WARM_PATHS);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
