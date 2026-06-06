/**
 * GET /api/debug/health
 *
 * Tests every external dependency and returns a structured report.
 * Use this to diagnose connectivity on the deployed server.
 * Not auth-guarded — safe because it reveals no user data.
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/client";

const INTEL_URL = process.env.INTELLIGENCE_SERVICE_URL ?? "http://localhost:8001";
const INTEL_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET ?? "";

interface Check {
  ok: boolean;
  detail: string;
  durationMs: number;
}

async function timed(fn: () => Promise<string>): Promise<Check> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { ok: true, detail, durationMs: Date.now() - start };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return { ok: false, detail: msg, durationMs: Date.now() - start };
  }
}

export async function GET() {
  const [db, intelService, intelAI, env] = await Promise.all([
    // 1. Postgres / Prisma
    timed(async () => {
      await prisma.$queryRaw`SELECT 1`;
      return "Prisma connected";
    }),

    // 2. Intelligence service reachability
    timed(async () => {
      const res = await fetch(`${INTEL_URL}/health`, {
        headers: { "X-Service-Secret": INTEL_SECRET },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      return `ok — version ${body.version ?? "?"}`;
    }),

    // 3. Azure OpenAI reachability via intelligence service
    timed(async () => {
      const res = await fetch(`${INTEL_URL}/agents/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Secret": INTEL_SECRET,
        },
        body: JSON.stringify({
          contact_name: "Health Check",
          contact_title: "Test",
          account_name: "Health Check Co",
          account_industry: "SaaS",
          channel: "email",
          tone: "direct",
          kb_items: [],
        }),
        signal: AbortSignal.timeout(15000),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`);
      const model = body.model ?? "unknown";
      const isMock = model === "mock";
      if (isMock) return `⚠ fell back to mock — Azure OpenAI env vars likely missing`;
      return `Azure OpenAI ok — model: ${model}`;
    }),

    // 4. Environment variable presence (no values — just existence)
    timed(async () => {
      const required = [
        "DATABASE_URL",
        "NEXTAUTH_SECRET",
        "NEXTAUTH_URL",
        "INTELLIGENCE_SERVICE_URL",
        "INTELLIGENCE_SERVICE_SECRET",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
      ];
      const missing = required.filter((k) => !process.env[k]);
      if (missing.length > 0) throw new Error(`Missing env vars: ${missing.join(", ")}`);
      return `All ${required.length} required env vars present`;
    }),
  ]);

  const allOk = db.ok && intelService.ok;
  const checks = { db, intelService, intelAI, env };

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      ts: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
