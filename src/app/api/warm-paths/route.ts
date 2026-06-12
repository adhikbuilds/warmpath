import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const warmPaths = await prisma.warmPath.findMany({
      where: { workspaceId },
      include: { account: true, contact: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      warmPaths.map((wp) => ({
        id: wp.id,
        account_id: wp.accountId,
        contact_id: wp.contactId,
        path_nodes: (() => {
          try {
            return JSON.parse(wp.pathJson);
          } catch {
            return [];
          }
        })(),
        path_explanation: wp.explanation ?? "",
        warmth_score: wp.warmthScore,
        confidence_score: wp.confidenceScore,
        recommended_intro_person: wp.recommendedIntroPerson ?? "",
        recommended_channel: (wp.recommendedChannel as "email" | "linkedin" | "call") ?? "linkedin",
        status: wp.status as
          | "active"
          | "intro_sent"
          | "intro_accepted"
          | "message_sent"
          | "replied",
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
