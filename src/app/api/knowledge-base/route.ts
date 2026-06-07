import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_KB_ITEMS } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const items = await prisma.knowledgeBaseItem.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    if (items.length === 0) {
      return NextResponse.json(isDemo ? DEMO_KB_ITEMS : []);
    }
    return NextResponse.json(
      items.map((item) => ({
        ...item,
        confidence_score: item.confidenceScore,
        approved_for_ai: item.approvedForAi,
        tags: (() => {
          try {
            return JSON.parse(item.tagsJson ?? "[]");
          } catch {
            return [];
          }
        })(),
        used_in_messages: item.usedInMessages,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const { workspaceId } = await getWorkspaceContext();
    const body = await req.json().catch(() => ({}));
    const { type, title, content, tags, confidenceScore, approvedForAi } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const VALID_TYPES = [
      "product_overview",
      "case_study",
      "objection_handler",
      "icp_definition",
      "competitor_comparison",
      "value_proposition",
      "custom",
    ];
    const itemType = VALID_TYPES.includes(type) ? type : "custom";

    const item = await prisma.knowledgeBaseItem.create({
      data: {
        workspaceId,
        type: itemType,
        title: title.trim(),
        content: content.trim(),
        tagsJson: JSON.stringify(Array.isArray(tags) ? tags : []),
        confidenceScore: typeof confidenceScore === "number" ? confidenceScore : 0.7,
        approvedForAi: approvedForAi === true,
        usedInMessages: 0,
      },
    });

    return NextResponse.json(
      {
        ...item,
        confidence_score: item.confidenceScore,
        approved_for_ai: item.approvedForAi,
        tags: JSON.parse(item.tagsJson ?? "[]"),
        used_in_messages: item.usedInMessages,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
