import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const items = await prisma.knowledgeBaseItem.findMany({
      where: { workspaceId },
      include: { chunks: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    });
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
        needs_chunking: item.chunks.length === 0,
        chunk_count: item.chunks.length,
        chunks: undefined,
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
