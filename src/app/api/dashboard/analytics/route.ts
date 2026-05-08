import { proxyToService } from "@/lib/service-proxy";

export async function GET() {
  return proxyToService("/api/dashboard/analytics");
}
