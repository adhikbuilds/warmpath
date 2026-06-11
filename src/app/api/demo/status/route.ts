import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ demo: true, seeded: true });
}
