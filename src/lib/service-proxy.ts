import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const SERVICE_URL = process.env.INTELLIGENCE_SERVICE_URL ?? "http://localhost:8000";
const SERVICE_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET ?? "";

export async function proxyToService(
  path: string,
  method: string = "GET",
  body?: unknown,
  searchParams?: URLSearchParams,
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(`${SERVICE_URL}${path}`);
  if (searchParams) {
    searchParams.forEach((v, k) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Service-Secret": SERVICE_SECRET,
      "X-User-Id": session.user.id,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function proxyRequestToService(
  req: NextRequest,
  path: string,
  method?: string,
): Promise<NextResponse> {
  const body =
    method !== "GET" && method !== "DELETE" ? await req.json().catch(() => undefined) : undefined;
  return proxyToService(path, method ?? req.method, body, req.nextUrl.searchParams);
}
