import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

type ApolloOrg = {
  name?: string | null;
  website_url?: string | null;
  blog_url?: string | null;
  funding_events?: Array<{
    id?: string | null;
    date?: string | null;
    news_url?: string | null;
    type?: string | null;
    existing_investors?: string | null;
    new_investors?: string | null;
    amount?: number | null;
    currency?: string | null;
  }> | null;
  latest_funding_stage?: string | null;
  total_funding?: number | null;
  linkedin_url?: string | null;
  primary_domain?: string | null;
};

type ApolloOrgSearchResponse = {
  organizations?: ApolloOrg[];
};

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
    if (!APOLLO_API_KEY) {
      return NextResponse.json(
        {
          error: "Apollo API key not configured",
          hint: "Add APOLLO_API_KEY to environment",
        },
        { status: 501 },
      );
    }

    const workspaceId = await getWorkspaceId();

    // Fetch workspace accounts that have a domain or name to query against
    const bizAccounts = await prisma.bizAccount.findMany({
      where: { workspaceId },
      select: { id: true, name: true, domain: true },
      take: 50, // cap to avoid overwhelming Apollo API
    });

    let signalsCreated = 0;

    for (const account of bizAccounts) {
      const queryName = account.domain ?? account.name;
      if (!queryName) continue;

      try {
        const apolloRes = await fetch("https://api.apollo.io/v1/mixed_companies/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Authorization: `Bearer ${APOLLO_API_KEY}`,
          },
          body: JSON.stringify({
            api_key: APOLLO_API_KEY,
            q_organization_name: account.name,
            per_page: 1,
          }),
        });

        if (!apolloRes.ok) continue;

        const data: ApolloOrgSearchResponse = await apolloRes.json();
        const org = data.organizations?.[0];
        if (!org) continue;

        // Emit a signal for each funding event found
        if (org.funding_events && org.funding_events.length > 0) {
          for (const event of org.funding_events) {
            // Deduplicate: skip if a signal for this event already exists
            const existingSignal = await prisma.signal.findFirst({
              where: {
                workspaceId,
                accountId: account.id,
                type: "funding_round",
                source: "apollo_signals",
                // Check for a unique enough combination to avoid duplicates
                title: { contains: org.name ?? account.name },
              },
            });
            if (existingSignal) continue;

            const amount = event.amount
              ? `$${(event.amount / 1_000_000).toFixed(1)}M`
              : "undisclosed amount";
            const stage = event.type ?? org.latest_funding_stage ?? "funding";

            await prisma.signal.create({
              data: {
                workspaceId,
                accountId: account.id,
                type: "funding_round",
                title: `${org.name ?? account.name} raised ${amount} (${stage})`,
                description: [
                  event.new_investors ? `New investors: ${event.new_investors}` : null,
                  event.existing_investors
                    ? `Existing investors: ${event.existing_investors}`
                    : null,
                  event.news_url ? `Source: ${event.news_url}` : null,
                ]
                  .filter(Boolean)
                  .join(". "),
                source: "apollo_signals",
                sourceUrl: event.news_url ?? org.website_url ?? undefined,
                urgencyScore: 70,
                confidenceScore: 75,
                detectedAt: event.date ? new Date(event.date) : new Date(),
              },
            });
            signalsCreated++;
          }
        } else if (org.latest_funding_stage) {
          // No detailed events but funding stage info available — emit once
          const existingSignal = await prisma.signal.findFirst({
            where: {
              workspaceId,
              accountId: account.id,
              type: "funding_round",
              source: "apollo_signals",
            },
          });
          if (!existingSignal) {
            const totalFunding = org.total_funding
              ? `$${(org.total_funding / 1_000_000).toFixed(1)}M total`
              : "";
            await prisma.signal.create({
              data: {
                workspaceId,
                accountId: account.id,
                type: "funding_round",
                title: `${org.name ?? account.name} — ${org.latest_funding_stage} stage${totalFunding ? ` · ${totalFunding}` : ""}`,
                description: `Latest funding stage from Apollo: ${org.latest_funding_stage}`,
                source: "apollo_signals",
                sourceUrl: org.website_url ?? undefined,
                urgencyScore: 60,
                confidenceScore: 65,
              },
            });
            signalsCreated++;
          }
        }
      } catch (accountErr) {
        // Per-account errors are non-fatal — log and continue
        console.error(
          `[apollo-signals] Failed to process account ${account.id} (${account.name}):`,
          accountErr,
        );
      }
    }

    return NextResponse.json({ signals_created: signalsCreated });
  } catch (err) {
    console.error("[apollo-signals] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
