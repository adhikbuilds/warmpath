import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_MESSAGES } from "@/lib/demo-data";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
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
    if (messages.length === 0) {
      return NextResponse.json(isDemo ? DEMO_MESSAGES : []);
    }
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

export async function POST(req: Request) {
  try {
    const { workspaceId } = await getWorkspaceContext();
    if (!workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      account_id,
      contact_id,
      warm_path_id,
      signal_id,
      campaign_id,
      channel,
      subject,
      body: messageBody,
      intro_request,
      status = "draft",
      approval_status = "pending",
      generated_by_ai = true,
      confidence_score,
      personalization_reason,
      factual_claims,
      supporting_sources,
      risk_flags,
    } = body;

    if (!channel?.trim()) {
      return NextResponse.json({ error: "channel is required" }, { status: 400 });
    }
    if (!messageBody?.trim()) {
      return NextResponse.json({ error: "body is required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        workspaceId,
        accountId: account_id ?? null,
        contactId: contact_id ?? null,
        warmPathId: warm_path_id ?? null,
        signalId: signal_id ?? null,
        campaignId: campaign_id ?? null,
        channel: channel.trim(),
        subject: subject?.trim() ?? null,
        body: messageBody.trim(),
        introRequest: intro_request?.trim() ?? null,
        status,
        approvalStatus: approval_status,
        generatedByAi: generated_by_ai,
        confidenceScore:
          typeof confidence_score === "number"
            ? Math.round(confidence_score > 1 ? confidence_score : confidence_score * 100)
            : 0,
        personalizationReason: personalization_reason?.trim() ?? null,
        factualClaimsJson: JSON.stringify(factual_claims ?? []),
        supportingSourcesJson: JSON.stringify(supporting_sources ?? []),
        riskFlagsJson: JSON.stringify(risk_flags ?? []),
      },
    });

    return NextResponse.json(
      {
        id: message.id,
        account_id: message.accountId,
        contact_id: message.contactId,
        warm_path_id: message.warmPathId,
        signal_id: message.signalId,
        campaign_id: message.campaignId,
        channel: message.channel,
        subject: message.subject,
        body: message.body,
        intro_request: message.introRequest,
        status: message.status,
        approval_status: message.approvalStatus,
        generated_by_ai: message.generatedByAi,
        confidence_score: message.confidenceScore / 100,
        personalization_reason: message.personalizationReason ?? "",
        created_at: message.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
