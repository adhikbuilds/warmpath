import { proxyToService } from "@/lib/service-proxy";

export async function POST() {
  return proxyToService("/api/demo/reset", "POST");
}
