"use client";

import { useEffect } from "react";
import { useSalesStore } from "@/stores/salesStore";

// Mounts once inside the authenticated app shell and fetches all data
// from API routes into the Zustand store.
export function StoreInitializer() {
  const initialize = useSalesStore((s) => s.initialize);
  const initialized = useSalesStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return null;
}
