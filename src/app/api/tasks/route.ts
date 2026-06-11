import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db/client";
import { getWorkspaceId } from "@/lib/db/workspace";

const DEMO_TASKS = [
  {
    id: "task-1",
    type: "intro_request",
    status: "pending",
    title: "Follow up with Sarah Chen on Acme AI intro",
    description:
      "Sarah agreed to introduce you to Priya Sharma at Acme AI. Send a thank-you and keep the momentum.",
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    warm_path_id: "wp-1",
    contact_name: "Priya Sharma",
    account_name: "Acme AI",
    introducer_name: "Sarah Chen",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-2",
    type: "follow_up",
    status: "pending",
    title: "Follow up on Finpilot outreach — no reply yet",
    description:
      "Elena Rodriguez hasn't replied to your warm intro email. Send a brief follow-up referencing the pricing page visit.",
    due_date: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(),
    warm_path_id: "wp-2",
    contact_name: "Elena Rodriguez",
    account_name: "Finpilot",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-3",
    type: "meeting_prep",
    status: "pending",
    title: "Prep discovery call deck for RevScale",
    description:
      "Meeting with David Kim confirmed for tomorrow. Prepare a custom ROI breakdown based on their $12M Series A and 3x GTM goal.",
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    contact_name: "David Kim",
    account_name: "RevScale",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-4",
    type: "intro_request",
    status: "pending",
    title: "Ask Rohan Mehta to intro you to CloudSync CTO",
    description:
      "Rohan is connected to Liam Chen at CloudSync. CloudSync just posted 8 engineering roles — ideal timing.",
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    contact_name: "Liam Chen",
    account_name: "CloudSync",
    introducer_name: "Rohan Mehta",
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "task-5",
    type: "follow_up",
    status: "pending",
    title: "Confirm meeting time with BrightOps",
    description:
      "Rachel Green replied positively. Nail down a 30-min slot this week before their budget cycle closes.",
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    contact_name: "Rachel Green",
    account_name: "BrightOps",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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
      // Only return demo tasks for the demo workspace; real workspaces get []
      return NextResponse.json(workspaceId === "ws-1" ? DEMO_TASKS : []);
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
