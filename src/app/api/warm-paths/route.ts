import type { NextRequest } from "next/server";
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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const {
    account_id,
    contact_id,
    path_nodes = [],
    path_explanation = "",
    warmth_score = 0,
    confidence_score = 0,
    recommended_intro_person = "",
    recommended_channel = "linkedin",
  } = body as Record<string, unknown>;

  if (!account_id) {
    return NextResponse.json({ error: "account_id is required" }, { status: 400 });
  }

  // Validate account belongs to this workspace
  const account = await prisma.bizAccount.findFirst({
    where: { id: account_id as string, workspaceId },
  });
  if (!account) {
    return NextResponse.json({ error: "account_id not found in workspace" }, { status: 404 });
  }

  const warmPath = await prisma.warmPath.create({
    data: {
      workspaceId,
      accountId: account_id as string,
      contactId: (contact_id as string) ?? null,
      pathJson: JSON.stringify(Array.isArray(path_nodes) ? path_nodes : []),
      explanation: (path_explanation as string) || null,
      warmthScore: (warmth_score as number) ?? 0,
      confidenceScore: (confidence_score as number) ?? 0,
      recommendedIntroPerson: (recommended_intro_person as string) || null,
      recommendedChannel: (recommended_channel as string) || "linkedin",
      status: "active",
    },
  });

  return NextResponse.json(
    {
      id: warmPath.id,
      account_id: warmPath.accountId,
      contact_id: warmPath.contactId,
      path_nodes: (() => {
        try {
          return JSON.parse(warmPath.pathJson);
        } catch {
          return [];
        }
      })(),
      path_explanation: warmPath.explanation ?? "",
      warmth_score: warmPath.warmthScore,
      confidence_score: warmPath.confidenceScore,
      recommended_intro_person: warmPath.recommendedIntroPerson ?? "",
      recommended_channel: warmPath.recommendedChannel ?? "linkedin",
      status: warmPath.status,
    },
    { status: 201 },
  );
}
