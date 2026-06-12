import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const signals = await prisma.signal.findMany({
      where: { workspaceId },
      include: {
        account: { select: { name: true } },
        contact: { select: { name: true } },
      },
      orderBy: { detectedAt: "desc" },
    });
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
