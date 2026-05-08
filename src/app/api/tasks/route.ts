import type { NextRequest } from "next/server";
import { proxyRequestToService, proxyToService } from "@/lib/service-proxy";

export async function GET(req: NextRequest) {
  return proxyToService("/tasks", "GET", undefined, req.nextUrl.searchParams);
}

export async function POST(req: NextRequest) {
  return proxyRequestToService(req, "/tasks", "POST");
}
