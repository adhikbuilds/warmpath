import { NextResponse } from "next/server";
import { DEMO_AUDIT_LOGS } from "@/lib/demo-data-extended";

export async function GET() {
  return NextResponse.json(DEMO_AUDIT_LOGS);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
