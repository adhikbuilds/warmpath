import { NextResponse } from "next/server";

const DEMO_TASKS = [
  {
    id: "task-1",
    type: "intro_request",
    status: "pending",
    title: "Follow up with Sarah Chen on Acme AI intro",
    description: "Sarah agreed to introduce you to Priya Sharma at Acme AI. Send a thank-you and keep the momentum.",
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
    description: "Elena Rodriguez hasn't replied to your warm intro email. Send a brief follow-up referencing the pricing page visit.",
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
    description: "Meeting with David Kim confirmed for tomorrow. Prepare a custom ROI breakdown based on their $12M Series A and 3x GTM goal.",
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
    description: "Rohan is connected to Liam Chen at CloudSync. CloudSync just posted 8 engineering roles — ideal timing.",
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
    description: "Rachel Green replied positively. Nail down a 30-min slot this week before their budget cycle closes.",
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    contact_name: "Rachel Green",
    account_name: "BrightOps",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(DEMO_TASKS);
}

export async function POST() {
  return NextResponse.json({ error: "Not implemented in demo" }, { status: 501 });
}
