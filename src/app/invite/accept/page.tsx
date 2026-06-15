import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import InviteAcceptClient from "./client";

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#131315] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#2563eb] animate-spin" />
        </div>
      }
    >
      <InviteAcceptClient />
    </Suspense>
  );
}
