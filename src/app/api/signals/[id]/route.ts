import type { NextRequest } from "next/server";
import { proxyToService } from "@/lib/service-proxy";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToService(`/api/signals/${id}`);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyToService(`/api/signals/${id}`, "PUT", body);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToService(`/api/signals/${id}`, "DELETE");
}
