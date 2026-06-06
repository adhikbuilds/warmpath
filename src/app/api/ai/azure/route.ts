import { type NextRequest, NextResponse } from "next/server";
import {
  AZURE_API_KEY,
  AZURE_ENDPOINT,
  type AzureGenerateRequest,
  callAzureOpenAI,
  isAzureConfigured,
} from "@/lib/ai/azure-generate";

export async function POST(req: NextRequest) {
  if (!isAzureConfigured()) {
    return NextResponse.json(
      {
        error:
          "Azure OpenAI not configured — set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in .env.local",
        endpoint: AZURE_ENDPOINT ? "set" : "missing",
        apiKey: AZURE_API_KEY ? "set" : "missing",
      },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Ping — just verify the route is reachable and Azure is configured
  if (body._ping) {
    return NextResponse.json({ ok: true, configured: true });
  }

  const request = body as AzureGenerateRequest;

  try {
    const result = await callAzureOpenAI(request);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("Azure OpenAI")) {
      const status = Number.parseInt(message.match(/Azure OpenAI (\d+)/)?.[1] ?? "502") || 502;
      return NextResponse.json({ error: "Azure OpenAI error", detail: message }, { status });
    }
    if (message.includes("timed out") || message.includes("abort")) {
      return NextResponse.json({ error: "Azure OpenAI request timed out" }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Azure OpenAI unreachable", detail: message },
      { status: 502 },
    );
  }
}
