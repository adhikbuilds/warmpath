import type { NextRequest } from "next/server";
import { proxyToService } from "@/lib/service-proxy";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToService(`/api/integrations/${id}/connect-demo`, "POST");
}
