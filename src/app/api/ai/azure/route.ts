import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceId } from "@/lib/db/workspace";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace found" }, { status: 403 });
  }

  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    return NextResponse.json({ error: "Azure OpenAI not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { messages, deploymentName } = body as {
      messages: Array<{ role: string; content: string }>;
      deploymentName?: string;
    };

    const deployment = deploymentName ?? process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-02-15-preview";
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");

    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Azure OpenAI error", response.status, error);
      return NextResponse.json({ error: "Azure OpenAI request failed" }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Azure OpenAI route error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
