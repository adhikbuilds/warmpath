import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";
import { DEMO_CONTACTS } from "@/lib/demo-data";
import { DEMO_CONTACTS_EXTRA } from "@/lib/demo-data-extended";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const contacts = await prisma.contact.findMany({
      where: { workspaceId },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });
    if (contacts.length === 0) {
      return NextResponse.json([...DEMO_CONTACTS, ...DEMO_CONTACTS_EXTRA]);
    }
    return NextResponse.json(contacts);
  } catch {
    return NextResponse.json([...DEMO_CONTACTS, ...DEMO_CONTACTS_EXTRA]);
  }
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
