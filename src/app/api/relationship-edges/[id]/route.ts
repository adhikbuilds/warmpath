import type { NextRequest } from "next/server";
import { proxyToService } from "@/lib/service-proxy";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToService(`/api/relationship-edges/${id}`, "DELETE");
}
