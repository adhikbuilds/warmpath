import { NextResponse } from "next/server";
import { DEMO_RELATIONSHIP_EDGES } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json(DEMO_RELATIONSHIP_EDGES);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
