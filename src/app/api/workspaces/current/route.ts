import type { NextRequest } from "next/server";
import { proxyRequestToService, proxyToService } from "@/lib/service-proxy";

export async function GET() {
  return proxyToService("/workspaces/current");
}

export async function PATCH(req: NextRequest) {
  return proxyRequestToService(req, "/workspaces/current", "PATCH");
}
