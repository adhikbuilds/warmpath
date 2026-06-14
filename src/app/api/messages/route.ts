import type { NextRequest } from "next/server";
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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const {
    contact_id,
    account_id,
    campaign_id,
    warm_path_id,
    signal_id,
    channel,
    subject,
    body: messageBody,
    intro_request,
    status = "draft",
    approval_status = "pending",
    confidence_score = 0,
    personalization_reason = "",
    factual_claims = [],
    supporting_sources = [],
    risk_flags = [],
  } = body as Record<string, unknown>;

  if (!contact_id || !account_id || !messageBody || !channel) {
    return NextResponse.json(
      { error: "contact_id, account_id, body, and channel are required" },
      { status: 400 },
    );
  }

  // Validate required FKs are scoped to this workspace
  const [contact, account] = await Promise.all([
    prisma.contact.findFirst({ where: { id: contact_id as string, workspaceId } }),
    prisma.bizAccount.findFirst({ where: { id: account_id as string, workspaceId } }),
  ]);
  if (!contact || !account) {
    return NextResponse.json(
      { error: "contact_id or account_id not found in workspace" },
      { status: 404 },
    );
  }

  // Validate optional FKs — null them if missing (BFS warm paths are client-side only and
  // may not be persisted yet; silently dropping the link is better than a FK violation).
  const [warmPath, signal] = await Promise.all([
    warm_path_id
      ? prisma.warmPath.findFirst({ where: { id: warm_path_id as string, workspaceId } })
      : null,
    signal_id ? prisma.signal.findFirst({ where: { id: signal_id as string, workspaceId } }) : null,
  ]);

  const message = await prisma.message.create({
    data: {
      workspaceId,
      campaignId: (campaign_id as string) ?? null,
      contactId: contact_id as string,
      accountId: account_id as string,
      warmPathId: warmPath?.id ?? null,
      signalId: signal?.id ?? null,
      channel: channel as string,
      subject: (subject as string) ?? null,
      body: messageBody as string,
      introRequest: (intro_request as string) ?? null,
      status: (status as string) ?? "draft",
      approvalStatus: (approval_status as string) ?? "pending",
      generatedByAi: true,
      confidenceScore: (confidence_score as number) ?? 0,
      personalizationReason: (personalization_reason as string) ?? null,
      factualClaimsJson: JSON.stringify(Array.isArray(factual_claims) ? factual_claims : []),
      supportingSourcesJson: JSON.stringify(
        Array.isArray(supporting_sources) ? supporting_sources : [],
      ),
      riskFlagsJson: JSON.stringify(Array.isArray(risk_flags) ? risk_flags : []),
    },
    include: { contact: true, account: true },
  });

  return NextResponse.json(
    {
      id: message.id,
      campaign_id: message.campaignId,
      account_id: message.accountId,
      contact_id: message.contactId,
      warm_path_id: message.warmPathId,
      signal_id: message.signalId,
      channel: message.channel,
      subject: message.subject,
      body: message.body,
      intro_request: message.introRequest,
      status: message.status,
      approval_status: message.approvalStatus,
      confidence_score: message.confidenceScore,
      personalization_reason: message.personalizationReason ?? "",
      factual_claims: (() => {
        try {
          return JSON.parse(message.factualClaimsJson ?? "[]");
        } catch {
          return [];
        }
      })(),
      supporting_sources: (() => {
        try {
          return JSON.parse(message.supportingSourcesJson ?? "[]");
        } catch {
          return [];
        }
      })(),
      risk_flags: (() => {
        try {
          return JSON.parse(message.riskFlagsJson ?? "[]");
        } catch {
          return [];
        }
      })(),
      created_at: message.createdAt.toISOString(),
      contact: message.contact
        ? {
            id: message.contact.id,
            name: message.contact.name,
            title: message.contact.title,
            email: message.contact.email,
            account_id: message.contact.accountId,
          }
        : undefined,
      account: message.account ? { id: message.account.id, name: message.account.name } : undefined,
    },
    { status: 201 },
  );
}
