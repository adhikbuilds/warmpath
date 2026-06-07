import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = process.env.TWENTY_API_URL;
  const apiKey = process.env.TWENTY_API_KEY;
  const isDefault = !apiUrl || apiUrl === "http://localhost:3001/api";
  const configured = !isDefault && !!apiKey;

  return NextResponse.json({
    configured,
    apiUrl: configured ? apiUrl : null,
  });
}
