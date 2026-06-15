import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const accounts = await prisma.bizAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    // Try Twenty CRM if configured
    if (process.env.TWENTY_API_KEY) {
      try {
        const { syncFromTwenty } = await import("@/lib/twenty/sync");
        const twentyData = await syncFromTwenty();
        const prismaSet = new Set(accounts.map((a) => a.name.toLowerCase()));
        const newFromTwenty = twentyData.accounts.filter(
          (a) => !prismaSet.has(a.name.toLowerCase()),
        );
        return NextResponse.json([...newFromTwenty, ...accounts]);
      } catch {
        // Twenty not available
      }
    }

    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json().catch(() => ({}));
    const { name, domain, industry, employeeCount, location, description, stage, logoUrl } = body;
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const existing = await prisma.bizAccount.findFirst({
      where: { workspaceId, name: name.trim() },
    });
    if (existing) {
      return NextResponse.json(existing);
    }
    const account = await prisma.bizAccount.create({
      data: {
        workspaceId,
        name: name.trim(),
        domain: domain ?? undefined,
        industry: industry ?? undefined,
        employeeCount: employeeCount ?? undefined,
        location: location ?? undefined,
        description: description ?? undefined,
        stage: stage ?? "prospect",
        logoUrl: logoUrl ?? undefined,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
