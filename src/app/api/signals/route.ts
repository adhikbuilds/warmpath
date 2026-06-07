import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_SIGNALS } from "@/lib/demo-data";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const signals = await prisma.signal.findMany({
      where: { workspaceId },
      include: {
        account: { select: { name: true } },
        contact: { select: { name: true } },
      },
      orderBy: { detectedAt: "desc" },
    });
    if (signals.length === 0) {
      return NextResponse.json(isDemo ? DEMO_SIGNALS : []);
    }
    return NextResponse.json(
      signals.map((s) => ({
        ...s,
        account_name: s.account?.name,
        contact_name: s.contact?.name,
        urgency_score: s.urgencyScore,
        confidence_score: s.confidenceScore,
        detected_at: s.detectedAt,
        source_url: s.sourceUrl,
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
      type,
      title,
      description,
      source,
      source_url,
      urgency_score,
      confidence_score,
      account_id,
      contact_id,
      detected_at,
    } = body;

    if (!type?.trim()) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const signal = await prisma.signal.create({
      data: {
        workspaceId,
        type: type.trim(),
        title: title.trim(),
        description: description?.trim() ?? null,
        source: source?.trim() ?? null,
        sourceUrl: source_url?.trim() ?? null,
        urgencyScore:
          typeof urgency_score === "number" ? Math.max(0, Math.min(100, urgency_score)) : 50,
        confidenceScore:
          typeof confidence_score === "number" ? Math.max(0, Math.min(100, confidence_score)) : 70,
        accountId: account_id ?? null,
        contactId: contact_id ?? null,
        detectedAt: detected_at ? new Date(detected_at) : new Date(),
      },
    });

    return NextResponse.json(
      {
        ...signal,
        urgency_score: signal.urgencyScore,
        confidence_score: signal.confidenceScore,
        source_url: signal.sourceUrl,
        detected_at: signal.detectedAt,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
