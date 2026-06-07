import { NextResponse } from "next/server";
import { getWorkspaceId } from "@/lib/db/workspace";
import prisma from "@/lib/db/client";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const assets = await prisma.campaignAsset.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(assets);
  } catch {
    return NextResponse.json([]);
  }
}
