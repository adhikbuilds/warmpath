import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

const INTEL_URL = process.env.INTELLIGENCE_SERVICE_URL ?? "http://localhost:8001";
const INTEL_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();

  const body = await req.json().catch(() => ({}));
  const { accountId, contactId, signalId, warmPathId, channel = "email", tone } = body;

  if (!accountId || !contactId) {
    return NextResponse.json({ error: "accountId and contactId are required" }, { status: 400 });
  }

  // Hydrate all entities from Prisma so the intelligence service gets real context
  const [account, contact, kbItems] = await Promise.all([
    prisma.bizAccount.findFirst({ where: { id: accountId, workspaceId } }),
    prisma.contact.findFirst({ where: { id: contactId, workspaceId } }),
    prisma.knowledgeBaseItem.findMany({
      where: { workspaceId, approvedForAi: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  if (!account || !contact) {
    return NextResponse.json({ error: "Account or contact not found" }, { status: 404 });
  }

  const [signal, warmPath] = await Promise.all([
    signalId
      ? prisma.signal.findFirst({ where: { id: signalId, workspaceId } })
      : Promise.resolve(null),
    warmPathId
      ? prisma.warmPath.findFirst({ where: { id: warmPathId, workspaceId } })
      : Promise.resolve(null),
  ]);

  // Map to the GenerateRequest schema the intelligence service expects
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

  const res = await fetch(`${INTEL_URL}/agents/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Secret": INTEL_SECRET,
    },
    body: JSON.stringify(intelBody),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: "Intelligence service error", detail: err },
      { status: res.status },
    );
  }

  const result = await res.json();
  return NextResponse.json(result);
}
