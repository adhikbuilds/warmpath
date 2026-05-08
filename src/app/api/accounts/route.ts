import { NextResponse } from "next/server";
import { DEMO_ACCOUNTS } from "@/lib/demo-data";
import { DEMO_ACCOUNTS_EXTRA } from "@/lib/demo-data-extended";

export async function GET() {
  return NextResponse.json([...DEMO_ACCOUNTS, ...DEMO_ACCOUNTS_EXTRA]);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
