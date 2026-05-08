import type { NextRequest } from "next/server";
import { proxyRequestToService, proxyToService } from "@/lib/service-proxy";

export async function GET() {
  return proxyToService("/campaigns");
}

export async function POST(req: NextRequest) {
  return proxyRequestToService(req, "/campaigns", "POST");
}
