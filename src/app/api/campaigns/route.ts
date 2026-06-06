import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_CAMPAIGNS } from "@/lib/demo-data";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      include: { steps: { orderBy: { stepNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    if (campaigns.length === 0) {
      return NextResponse.json(isDemo ? DEMO_CAMPAIGNS : []);
    }
    return NextResponse.json(
      campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status as "draft" | "active" | "paused" | "completed",
        goal: c.goal ?? "",
        target_segment: c.targetSegment ?? "",
        channels: (() => {
          try {
            return JSON.parse(c.channelsJson ?? "[]");
          } catch {
            return [];
          }
        })(),
        steps: c.steps.map((s) => ({
          id: s.id,
          channel: s.channel as "email" | "linkedin" | "warm_intro",
          delay_days: s.delayDays,
          template_hint: s.assetType ?? "",
          is_ai_generated: true,
        })),
        stats: {
          total_prospects: 0,
          messages_sent: 0,
          replies: 0,
          meetings_booked: 0,
          reply_rate: 0,
          open_rate: 0,
        },
        created_at: c.createdAt.toISOString(),
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
