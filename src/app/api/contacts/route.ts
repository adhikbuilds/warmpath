import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const contacts = await prisma.contact.findMany({
      where: { workspaceId },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });

    // Try Twenty CRM if configured
    if (process.env.TWENTY_API_KEY) {
      try {
        const { syncFromTwenty } = await import("@/lib/twenty/sync");
        const twentyData = await syncFromTwenty();
        const prismaSet = new Set(contacts.map((c) => c.email?.toLowerCase()).filter(Boolean));
        const newFromTwenty = twentyData.contacts.filter(
          (c) => !c.email || !prismaSet.has(c.email.toLowerCase()),
        );
        return NextResponse.json([...newFromTwenty, ...contacts]);
      } catch {
        // Twenty not available
      }
    }

    return NextResponse.json(contacts);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
