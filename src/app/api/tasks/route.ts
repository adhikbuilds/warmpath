import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const tasks = await prisma.task.findMany({
      where: { workspaceId },
      include: {
        account: { select: { name: true } },
        contact: { select: { name: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 100,
    });
    if (tasks.length === 0) {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      tasks.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        title: t.title,
        description: t.description ?? "",
        due_date: t.dueAt?.toISOString() ?? null,
        account_name: t.account?.name ?? "",
        contact_name: t.contact?.name ?? "",
        created_at: t.createdAt.toISOString(),
      })),
    );
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = await getWorkspaceId();
    if (!workspaceId || workspaceId === "ws-1") {
      return NextResponse.json({ error: "Workspace not found" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { type, title, description, dueAt, contactId, accountId } = body;

    if (!type?.trim()) return NextResponse.json({ error: "type is required" }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const task = await prisma.task.create({
      data: {
        workspaceId,
        ownerId: session.user.id,
        type: type.trim(),
        title: title.trim(),
        description: description ?? null,
        dueAt: dueAt ? new Date(dueAt) : null,
        contactId: contactId ?? null,
        accountId: accountId ?? null,
        status: "pending",
      },
      include: {
        account: { select: { name: true } },
        contact: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        id: task.id,
        type: task.type,
        status: task.status,
        title: task.title,
        description: task.description ?? "",
        due_date: task.dueAt?.toISOString() ?? null,
        account_name: task.account?.name ?? "",
        contact_name: task.contact?.name ?? "",
        created_at: task.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
