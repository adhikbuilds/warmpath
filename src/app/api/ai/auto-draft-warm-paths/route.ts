import { NextResponse } from "next/server";
import type { GenerateMessageInput } from "@/lib/ai/index";
import { getAIProvider } from "@/lib/ai/index";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import type { Account, Contact, KnowledgeBaseItem } from "@/types";

// Limit to avoid AI cost blowout in a single request
const BATCH_LIMIT = 10;

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceId();

    // Find active warm paths that have no messages yet
    const warmPathsWithoutDrafts = await prisma.warmPath.findMany({
      where: {
        workspaceId,
        status: "active",
        messages: { none: {} },
      },
      include: {
        contact: true,
        account: true,
      },
      take: BATCH_LIMIT,
      orderBy: { warmthScore: "desc" },
    });

    if (warmPathsWithoutDrafts.length === 0) {
      return NextResponse.json({ drafted: 0, message: "All warm paths already have drafts." });
    }

    // Load workspace KB items (top 5 approved) for prompt context
    const kbItems = await prisma.knowledgeBaseItem.findMany({
      where: { workspaceId, approvedForAi: true },
      orderBy: { confidenceScore: "desc" },
      take: 5,
    });

    const mappedKbItems: KnowledgeBaseItem[] = kbItems.map((k) => ({
      id: k.id,
      workspace_id: k.workspaceId,
      title: k.title,
      type: k.type as KnowledgeBaseItem["type"],
      content: k.content,
      source: k.source ?? undefined,
      tags: (() => {
        try {
          return JSON.parse(k.tagsJson ?? "[]") as string[];
        } catch {
          return [];
        }
      })(),
      approved_for_ai: k.approvedForAi,
      confidence_score: k.confidenceScore,
      used_in_messages: k.usedInMessages,
      created_at: k.createdAt.toISOString(),
      updated_at: k.updatedAt.toISOString(),
    }));

    const ai = getAIProvider();
    let drafted = 0;

    for (const wp of warmPathsWithoutDrafts) {
      const contact = wp.contact;
      const account = wp.account;

      if (!contact || !account) continue;

      // Build typed objects for the AI provider
      const mappedAccount: Account = {
        id: account.id,
        name: account.name,
        domain: account.domain ?? "",
        industry: account.industry ?? "Software",
        employee_count: account.employeeCount ?? 0,
        location: account.location ?? "",
        description: account.description ?? "",
        stage: account.stage as Account["stage"],
        fit_score: account.fitScore,
        intent_score: account.intentScore,
        warmth_score: account.warmthScore,
        opportunity_score: account.opportunityScore,
        logo_url: account.logoUrl ?? undefined,
        created_at: account.createdAt.toISOString(),
      };

      const mappedContact: Contact = {
        id: contact.id,
        account_id: contact.accountId ?? "",
        name: contact.name,
        email: contact.email ?? "",
        title: contact.title ?? "",
        linkedin_url: contact.linkedinUrl ?? undefined,
        seniority: (contact.seniority ?? "director") as Contact["seniority"],
        department: contact.department ?? "",
        persona: contact.persona ?? "",
        fit_score: contact.fitScore,
        warmth_score: contact.warmthScore,
        engagement_score: contact.engagementScore,
        avatar_url: contact.avatarUrl ?? undefined,
      };

      const channel = (wp.recommendedChannel ?? "email") as GenerateMessageInput["channel"];

      const input: GenerateMessageInput = {
        account: mappedAccount,
        contact: mappedContact,
        channel,
        kbItems: mappedKbItems,
      };

      let body: string;
      let subject: string;
      let personalizationReason: string;
      let factualClaims: string[];
      let supportingSources: string[];
      let confidenceScore: number;
      let introRequest: string | undefined;

      try {
        const result = await ai.generateMessage(input);
        body = result.body;
        subject = result.subject || `Intro: ${contact.name} at ${account.name}`;
        personalizationReason = result.personalization_reason;
        factualClaims = result.factual_claims;
        supportingSources = result.supporting_sources;
        confidenceScore = Math.round(result.confidence_score * 100);
        introRequest = result.intro_request ?? undefined;
      } catch {
        // Fallback template if AI errors out
        body = `Hi ${contact.name.split(" ")[0]},\n\nI came across ${account.name} and thought there might be a great fit. We help B2B teams route outbound through their warmest relationship paths — typically 3–5× higher reply rates than cold email.\n\nWould you be open to a 15-minute call to explore if there's a fit?\n\nBest,\nAdhik`;
        subject = `Intro: ${contact.name} at ${account.name}`;
        personalizationReason = "Auto-generated from warm path data.";
        factualClaims = [];
        supportingSources = [];
        confidenceScore = 70;
        introRequest = undefined;
      }

      await prisma.message.create({
        data: {
          workspaceId,
          warmPathId: wp.id,
          contactId: contact.id,
          accountId: account.id,
          channel: channel ?? "email",
          subject,
          body,
          introRequest,
          approvalStatus: "pending",
          status: "draft",
          generatedByAi: true,
          confidenceScore,
          personalizationReason,
          factualClaimsJson: JSON.stringify(factualClaims),
          supportingSourcesJson: JSON.stringify(supportingSources),
          riskFlagsJson: "[]",
        },
      });

      drafted++;
    }

    return NextResponse.json({ drafted });
  } catch (err) {
    console.error("[auto-draft-warm-paths]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
