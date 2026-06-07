import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceContext } from "@/lib/db/workspace";
import { DEMO_CONTACTS } from "@/lib/demo-data";
import { DEMO_CONTACTS_EXTRA } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const { workspaceId, isDemo } = await getWorkspaceContext();
    const rawContacts = await prisma.contact.findMany({
      where: { workspaceId },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });

    // Normalize name=email rows caused by Google import bug (email stored as displayName)
    const prismaContacts = rawContacts.map((c) => {
      const nameIsEmail = c.name && (c.name === c.email || c.name.includes("@"));
      if (nameIsEmail && c.email) {
        const derived = c.email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (ch) => ch.toUpperCase());
        return { ...c, name: derived };
      }
      return c;
    });

    const baseContacts =
      prismaContacts.length > 0
        ? prismaContacts
        : isDemo
          ? [...DEMO_CONTACTS, ...DEMO_CONTACTS_EXTRA]
          : [];

    return NextResponse.json(baseContacts);
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
