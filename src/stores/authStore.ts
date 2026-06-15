"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

const DEMO_DISPLAY_USER: User = {
  id: "demo-user",
  name: "Adhik Agarwal",
  email: "demo@warmblue.ai",
  company_name: "WarmBlue",
  role: "Founder & CEO",
  plan: "growth",
  onboarding_completed: true,
  created_at: new Date().toISOString(),
};

const DEMO_EMAIL = "demo@warmpath.ai";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  workspaceId: string | null;
  workspaceName: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (v: boolean) => void;
  syncUser: (sessionUser: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }) => void;
  setWorkspace: (id: string, name: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      workspaceId: null,
      workspaceName: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAuthenticated: (v) => {
        if (v) {
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false, user: null, workspaceId: null, workspaceName: null });
        }
      },

      syncUser: (sessionUser) => {
        // Demo email always shows the polished demo persona
        if (sessionUser.email === DEMO_EMAIL) {
          set({ user: DEMO_DISPLAY_USER });
          return;
        }
        set((state) => {
          const nextUser: User = {
            id: sessionUser.id ?? state.user?.id ?? "",
            name: sessionUser.name ?? state.user?.name ?? sessionUser.email ?? "User",
            email: sessionUser.email ?? state.user?.email ?? "",
            company_name: state.user?.company_name ?? "",
            role: state.user?.role ?? "sales_rep",
            plan: state.user?.plan ?? "free",
            onboarding_completed: state.user?.onboarding_completed ?? false,
            avatar_url: sessionUser.image ?? state.user?.avatar_url ?? undefined,
            created_at: state.user?.created_at ?? new Date().toISOString(),
          };
          // Persist last-signed-in user for the login page "Continue as" chip
          try {
            localStorage.setItem(
              "warmpath-last-user",
              JSON.stringify({
                name: nextUser.name,
                email: nextUser.email,
                image: nextUser.avatar_url,
              }),
            );
          } catch {}
          return { user: nextUser };
        });
      },

      setWorkspace: (id, name) => set({ workspaceId: id, workspaceName: name }),

      logout: () =>
        set({ user: null, isAuthenticated: false, workspaceId: null, workspaceName: null }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "warmblue-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
      }),
    },
  ),
);
