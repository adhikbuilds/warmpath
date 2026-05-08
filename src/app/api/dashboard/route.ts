import type { NextRequest } from "next/server";
import { proxyToService } from "@/lib/service-proxy";

export async function GET(req: NextRequest) {
  return proxyToService("/api/dashboard/summary", "GET", undefined, req.nextUrl.searchParams);
}
