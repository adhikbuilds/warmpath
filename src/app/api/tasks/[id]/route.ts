import type { NextRequest } from "next/server";
import { proxyRequestToService, proxyToService } from "@/lib/service-proxy";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToService(`/tasks/${id}`);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequestToService(req, `/tasks/${id}`, "PATCH");
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequestToService(_req, `/tasks/${id}`, "DELETE");
}
