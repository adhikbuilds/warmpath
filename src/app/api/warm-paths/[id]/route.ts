import type { NextRequest } from "next/server";
import { proxyToService } from "@/lib/service-proxy";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyToService(`/api/warm-paths/${id}`, "PUT", body);
}
