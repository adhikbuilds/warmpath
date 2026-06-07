import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncFromTwenty } from "@/lib/twenty/sync";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
