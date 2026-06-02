import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function GET(request: NextRequest) {
  const workspaceId = await getWorkspaceId();
  const campaignId = request.nextUrl.searchParams.get("campaignId");

  if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

  const tests = await prisma.aBTest.findMany({
    where: { workspaceId, campaignId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tests);
}

export async function POST(request: NextRequest) {
  const workspaceId = await getWorkspaceId();
  const body = await request.json();

  const {
    campaignId,
    name,
    variantASubject,
    variantBSubject,
    variantABody,
    variantBBody,
    splitPercent,
  } = body;

  if (!campaignId || !variantASubject || !variantBSubject) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const test = await prisma.aBTest.create({
    data: {
      workspaceId,
      campaignId,
      name: name ?? "Subject line test",
      variantASubject,
      variantBSubject,
      variantABody: variantABody ?? "",
      variantBBody: variantBBody ?? "",
      splitPercent: splitPercent ?? 50,
    },
  });

  return NextResponse.json(test);
}
