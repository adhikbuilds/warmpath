import { NextResponse } from "next/server";
import { DEMO_WORKSPACE } from "@/lib/demo-data-extended";

export async function GET() {
  return NextResponse.json(DEMO_WORKSPACE);
}

export async function PATCH() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
