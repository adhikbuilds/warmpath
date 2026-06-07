import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      imported: 0,
      status: "not_implemented",
      message: "Discovery import requires a real prospecting integration (Apollo, etc.)",
    },
    { status: 501 },
  );
}
