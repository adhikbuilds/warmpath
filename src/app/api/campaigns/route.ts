import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_CAMPAIGNS } from "@/lib/demo-data";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      include: { steps: { orderBy: { stepNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    if (campaigns.length === 0) {
      return NextResponse.json(DEMO_CAMPAIGNS);
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
    return NextResponse.json(DEMO_CAMPAIGNS);
  }
}

interface StepInput {
  channel: string;
  delayDays?: number;
  delay_days?: number;
  actionType?: string;
  assetType?: string;
  approvalRequired?: boolean;
  // sequence builder fields
  subject?: string;
  body?: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = await getWorkspaceId();
    if (!workspaceId || workspaceId === "ws-1") {
      return NextResponse.json({ error: "Workspace not found" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, type, goal, status, targetSegment, channelsJson, steps } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // Derive channel list from steps if not provided explicitly
    const channelList: string[] =
      channelsJson ??
      (Array.isArray(steps)
        ? [...new Set((steps as StepInput[]).map((s) => s.channel).filter(Boolean))]
        : []);

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId,
        ownerId: session.user.id,
        name: name.trim(),
        type: type ?? null,
        goal: goal ?? null,
        status: status ?? "active",
        targetSegment: targetSegment ?? null,
        channelsJson: JSON.stringify(channelList),
      },
    });

    // Create CampaignStep rows if steps were provided
    if (Array.isArray(steps) && steps.length > 0) {
      await prisma.campaignStep.createMany({
        data: (steps as StepInput[]).map((s, i) => ({
          campaignId: campaign.id,
          stepNumber: i + 1,
          channel: s.channel ?? "email",
          delayDays: s.delayDays ?? s.delay_days ?? 0,
          actionType: s.actionType ?? null,
          assetType: s.assetType ?? s.subject?.slice(0, 80) ?? null,
          approvalRequired: s.approvalRequired ?? true,
        })),
      });
    }

    // Return with steps included
    const created = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: { steps: { orderBy: { stepNumber: "asc" } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
