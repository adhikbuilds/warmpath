import type { NextRequest } from "next/server";
import { proxyToService } from "@/lib/service-proxy";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToService(`/api/messages/${id}`);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyToService(`/api/messages/${id}`, "PUT", body);
}
