import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_SIGNALS } from "@/lib/demo-data";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const signals = await prisma.signal.findMany({
      where: { workspaceId },
      include: {
        account: { select: { name: true } },
        contact: { select: { name: true } },
      },
      orderBy: { detectedAt: "desc" },
    });
    if (signals.length === 0) {
      return NextResponse.json(isDemo ? DEMO_SIGNALS : []);
    }
    return NextResponse.json(
      signals.map((s) => ({
        ...s,
        account_name: s.account?.name,
        contact_name: s.contact?.name,
        urgency_score: s.urgencyScore,
        confidence_score: s.confidenceScore,
        detected_at: s.detectedAt,
        source_url: s.sourceUrl,
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
