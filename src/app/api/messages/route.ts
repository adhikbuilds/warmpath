import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const messages = await prisma.message.findMany({
      where: { workspaceId },
      include: {
        contact: true,
        account: true,
        warmPath: true,
        signal: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(
      messages.map((m) => ({
        id: m.id,
        campaign_id: m.campaignId,
        account_id: m.accountId,
        contact_id: m.contactId,
        warm_path_id: m.warmPathId,
        signal_id: m.signalId,
        channel: m.channel,
        subject: m.subject,
        body: m.body,
        intro_request: m.introRequest,
        status: m.status as any,
        approval_status: m.approvalStatus as any,
        confidence_score: m.confidenceScore,
        personalization_reason: m.personalizationReason ?? "",
        factual_claims: (() => {
          try {
            return JSON.parse(m.factualClaimsJson ?? "[]");
          } catch {
            return [];
          }
        })(),
        supporting_sources: (() => {
          try {
            return JSON.parse(m.supportingSourcesJson ?? "[]");
          } catch {
            return [];
          }
        })(),
        risk_flags: (() => {
          try {
            return JSON.parse(m.riskFlagsJson ?? "[]");
          } catch {
            return [];
          }
        })(),
        created_at: m.createdAt.toISOString(),
        contact: m.contact
          ? {
              id: m.contact.id,
              name: m.contact.name,
              title: m.contact.title,
              email: m.contact.email,
              account_id: m.contact.accountId,
            }
          : undefined,
        account: m.account ? { id: m.account.id, name: m.account.name } : undefined,
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
