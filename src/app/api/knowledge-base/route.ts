import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_KB_ITEMS } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const items = await prisma.knowledgeBaseItem.findMany({
      where: { workspaceId },
      include: { chunks: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (items.length === 0) {
      return NextResponse.json(DEMO_KB_ITEMS);
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
        // Surfaces whether this item needs retroactive chunking
        needs_chunking: item.chunks.length === 0,
        chunk_count: item.chunks.length,
        chunks: undefined,
      })),
    );
  } catch {
    return NextResponse.json(DEMO_KB_ITEMS);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
