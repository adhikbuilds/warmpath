import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
