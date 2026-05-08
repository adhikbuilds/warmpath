"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionBridge />
      {children}
    </SessionProvider>
  );
}

function SessionBridge() {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const sessionUser = session.user as typeof session.user & { id?: string; role?: string };
      setUser({
        id: sessionUser.id ?? "session-user",
        name: sessionUser.name ?? "WarmPath User",
        email: sessionUser.email ?? "",
        company_name: "WarmPath",
        role: sessionUser.role ?? "Member",
        plan: "growth",
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      });
      return;
    }

    if (status === "unauthenticated") {
      setAuthenticated(false);
    }
  }, [session, setAuthenticated, setUser, status]);

  return null;
}
