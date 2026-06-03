"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
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
  // Track whether we've ever had a real NextAuth session in this tab.
  // Without this, "unauthenticated" fires on first load and clears demo sessions.
  const hadRealSession = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      hadRealSession.current = true;
      const sessionUser = session.user as typeof session.user & { id?: string; role?: string };
      setUser({
        id: sessionUser.id ?? "session-user",
        name: sessionUser.name ?? "WarmBlue User",
        email: sessionUser.email ?? "",
        company_name: "WarmBlue",
        role: sessionUser.role ?? "Member",
        plan: "growth",
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      });
      return;
    }

    // Only clear Zustand auth if we previously had a real NextAuth session.
    // This preserves demo fallback sessions (which have no NextAuth session).
    if (status === "unauthenticated" && hadRealSession.current) {
      hadRealSession.current = false;
      setAuthenticated(false);
    }
  }, [session, setAuthenticated, setUser, status]);

  return null;
}
