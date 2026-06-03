import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_CONTACTS } from "@/lib/demo-data";
import { DEMO_CONTACTS_EXTRA } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const prismaContacts = await prisma.contact.findMany({
      where: { workspaceId },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });
    const baseContacts =
      prismaContacts.length > 0 ? prismaContacts : [...DEMO_CONTACTS, ...DEMO_CONTACTS_EXTRA];

    // Try Twenty CRM if configured
    if (process.env.TWENTY_API_KEY) {
      try {
        const { syncFromTwenty } = await import("@/lib/twenty/sync");
        const twentyData = await syncFromTwenty();
        // Merge: Twenty contacts come first (they are the CRM of record)
        const prismaSet = new Set(baseContacts.map((c) => c.email?.toLowerCase()).filter(Boolean));
        const newFromTwenty = twentyData.contacts.filter(
          (c) => !c.email || !prismaSet.has(c.email.toLowerCase()),
        );
        return NextResponse.json([...newFromTwenty, ...baseContacts]);
      } catch {
        // Twenty not available, use Prisma/demo only
      }
    }

    return NextResponse.json(baseContacts);
  } catch {
    return NextResponse.json([...DEMO_CONTACTS, ...DEMO_CONTACTS_EXTRA]);
  }
}

export async function POST(req: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json().catch(() => ({}));
    const {
      name,
      email,
      title,
      phone,
      accountId,
      linkedinUrl,
      seniority,
      department,
      persona,
      warmthScore,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        workspaceId,
        name: name.trim(),
        email: email?.trim() || null,
        title: title?.trim() || null,
        phone: phone?.trim() || null,
        accountId: accountId || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        seniority: seniority || null,
        department: department || null,
        persona: persona || null,
        warmthScore: warmthScore ?? 0,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
