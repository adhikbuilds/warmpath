import { type NextRequest, NextResponse } from "next/server";
import { callAzureOpenAI, isAzureConfigured } from "@/lib/ai/azure-generate";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { logger } from "@/lib/logger";

const INTEL_URL = process.env.INTELLIGENCE_SERVICE_URL ?? "http://localhost:8001";
const INTEL_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET ?? "";
const ROUTE = "POST /api/ai/generate-message";

export async function POST(req: NextRequest) {
  const start = Date.now();

  const session = await auth();
  if (!session?.user?.id) {
    logger.warn("Unauthenticated generate attempt", { route: ROUTE });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();

  const body = await req.json().catch(() => ({}));
  const { accountId, contactId, signalId, warmPathId, channel = "email", tone } = body;

  if (!accountId || !contactId) {
    logger.warn("Missing required IDs", { route: ROUTE, accountId, contactId });
    return NextResponse.json({ error: "accountId and contactId are required" }, { status: 400 });
  }

  logger.info("Generate message start", {
    route: ROUTE,
    userId: session.user.id,
    workspaceId,
    accountId,
    contactId,
    signalId,
    warmPathId,
    channel,
  });

  // Hydrate all entities from Prisma
  let account: Awaited<ReturnType<typeof prisma.bizAccount.findFirst>>;
  let contact: Awaited<ReturnType<typeof prisma.contact.findFirst>>;
  let kbItems: Awaited<ReturnType<typeof prisma.knowledgeBaseItem.findMany>>;

  try {
    [account, contact, kbItems] = await Promise.all([
      prisma.bizAccount.findFirst({ where: { id: accountId, workspaceId } }),
      prisma.contact.findFirst({ where: { id: contactId, workspaceId } }),
      prisma.knowledgeBaseItem.findMany({
        where: { workspaceId, approvedForAi: true },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);
  } catch (err) {
    logger.error("Prisma lookup failed", {
      route: ROUTE,
      workspaceId,
      accountId,
      contactId,
      error: err,
    });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!account || !contact) {
    logger.warn("Account or contact not found in workspace", {
      route: ROUTE,
      workspaceId,
      accountId,
      contactId,
      accountFound: !!account,
      contactFound: !!contact,
    });
    return NextResponse.json({ error: "Account or contact not found" }, { status: 404 });
  }

  logger.info("Prisma hydration ok", {
    route: ROUTE,
    accountName: account.name,
    contactName: contact.name,
    kbItemCount: kbItems.length,
  });

  const [signal, warmPath] = await Promise.all([
    signalId
      ? prisma.signal.findFirst({ where: { id: signalId, workspaceId } })
      : Promise.resolve(null),
    warmPathId
      ? prisma.warmPath.findFirst({ where: { id: warmPathId, workspaceId } })
      : Promise.resolve(null),
  ]).catch((err) => {
    logger.warn("Signal/warmPath lookup failed (non-fatal)", {
      route: ROUTE,
      signalId,
      warmPathId,
      error: err,
    });
    return [null, null] as const;
  });

  // Map to GenerateRequest schema
  const intelBody: Record<string, unknown> = {
    contact_name: contact.name,
    contact_title: contact.title ?? "",
    contact_department: contact.department ?? undefined,
    contact_persona: contact.persona ?? undefined,
    account_name: account.name,
    account_industry: account.industry ?? "SaaS",
    account_employee_count: account.employeeCount ?? undefined,
    account_location: account.location ?? undefined,
    account_description: account.description ?? undefined,
    channel,
    tone: tone ?? "direct and friendly",
    kb_items: kbItems.map((k) => ({
      type: k.type,
      title: k.title,
      content: k.content,
      approved_for_ai: k.approvedForAi,
    })),
  };

  if (signal) {
    intelBody.signal_type = signal.type;
    intelBody.signal_title = signal.title;
    intelBody.signal_description = signal.description ?? undefined;
  }

  if (warmPath) {
    const pathNames: string[] = (() => {
      try {
        return JSON.parse((warmPath as unknown as { pathJson?: string }).pathJson ?? "[]");
      } catch {
        return [];
      }
    })();
    intelBody.warm_path = pathNames;
    intelBody.intro_person = pathNames[1] ?? undefined;
  }

  // Pass sender identity so the AI signs with the actual user's name, not a hardcoded default.
  intelBody.sender_name =
    session.user?.name?.split(" ")[0] ?? session.user?.email?.split("@")[0] ?? "Your Rep";
  intelBody.workspace_name = "WarmPath";

  // Azure-first: call Azure OpenAI directly when credentials are available.
  // Falls back to the Python intelligence service if Azure is not configured.
  if (isAzureConfigured()) {
    logger.info("Calling Azure OpenAI directly", {
      route: ROUTE,
      channel,
      kbItemCount: kbItems.length,
      hasSignal: !!signal,
      hasWarmPath: !!warmPath,
    });

    try {
      const result = await callAzureOpenAI(
        intelBody as unknown as Parameters<typeof callAzureOpenAI>[0],
      );

      logger.info("Generate message complete (Azure)", {
        route: ROUTE,
        durationMs: Date.now() - start,
        model: result.model,
        confidenceScore: result.confidence_score,
      });

      return NextResponse.json(result);
    } catch (err) {
      logger.error("Azure OpenAI call failed — falling back to intelligence service", {
        route: ROUTE,
        durationMs: Date.now() - start,
        error: err,
      });
      // Fall through to Python service below
    }
  }

  logger.info("Calling intelligence service", {
    route: ROUTE,
    intelUrl: `${INTEL_URL}/agents/generate`,
    channel,
    kbItemCount: kbItems.length,
    hasSignal: !!signal,
    hasWarmPath: !!warmPath,
  });

  let res: Response;
  try {
    res = await fetch(`${INTEL_URL}/agents/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Secret": INTEL_SECRET,
      },
      body: JSON.stringify(intelBody),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    logger.error("Intelligence service unreachable", {
      route: ROUTE,
      intelUrl: INTEL_URL,
      durationMs: Date.now() - start,
      error: err,
    });
    return NextResponse.json(
      { error: "Intelligence service unreachable", detail: String(err) },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    logger.error("Intelligence service returned error", {
      route: ROUTE,
      status: res.status,
      durationMs: Date.now() - start,
      responseBody: errBody,
    });
    return NextResponse.json(
      { error: "Intelligence service error", detail: errBody },
      { status: res.status },
    );
  }

  const result = await res.json();
  const model = result.model ?? "unknown";
  const isMock = model === "mock";

  logger.info("Generate message complete (intelligence service)", {
    route: ROUTE,
    durationMs: Date.now() - start,
    model,
    isMock,
    costUsd: result.cost_usd,
    confidenceScore: result.confidence_score,
  });

  if (isMock) {
    logger.warn("Intelligence service fell back to mock — Azure OpenAI may not be configured", {
      route: ROUTE,
      intelUrl: INTEL_URL,
    });
  }

  return NextResponse.json(result);
}
