import type { NextRequest } from "next/server";
import { proxyRequestToService } from "@/lib/service-proxy";

export async function POST(req: NextRequest) {
  return proxyRequestToService(req, "/discovery/import", "POST");
}
