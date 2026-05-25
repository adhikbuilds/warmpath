import { NextResponse } from "next/server";
import { syncFromTwenty } from "@/lib/twenty/sync";

export async function GET() {
  try {
    const data = await syncFromTwenty();
    return NextResponse.json({
      ok: true,
      accounts: data.accounts.length,
      contacts: data.contacts.length,
      data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
