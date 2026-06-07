import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_ACCOUNTS } from "@/lib/demo-data";
import { DEMO_ACCOUNTS_EXTRA } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const prismaAccounts = await prisma.bizAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    const baseAccounts =
      prismaAccounts.length > 0
        ? prismaAccounts
        : isDemo
          ? [...DEMO_ACCOUNTS, ...DEMO_ACCOUNTS_EXTRA]
          : [];

    return NextResponse.json(baseAccounts);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const { workspaceId } = await getWorkspaceContext();
    const body = await req.json().catch(() => ({}));
    const {
      name,
      domain,
      industry,
      employeeCount,
      location,
      description,
      stage,
      fitScore,
      intentScore,
      warmthScore,
      logoUrl,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const account = await prisma.bizAccount.create({
      data: {
        workspaceId,
        name: name.trim(),
        domain: domain?.trim() || null,
        industry: industry?.trim() || null,
        employeeCount: employeeCount ? Number(employeeCount) : null,
        location: location?.trim() || null,
        description: description?.trim() || null,
        stage: stage || "prospect",
        fitScore: fitScore ?? 0,
        intentScore: intentScore ?? 0,
        warmthScore: warmthScore ?? 0,
        logoUrl: logoUrl?.trim() || null,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
