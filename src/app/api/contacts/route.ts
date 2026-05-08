import { NextResponse } from "next/server";
import { DEMO_CONTACTS } from "@/lib/demo-data";
import { DEMO_CONTACTS_EXTRA } from "@/lib/demo-data-extended";

export async function GET() {
  return NextResponse.json([...DEMO_CONTACTS, ...DEMO_CONTACTS_EXTRA]);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
