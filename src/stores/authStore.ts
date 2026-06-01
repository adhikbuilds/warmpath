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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  workspaceId: string | null;
  workspaceName: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (v: boolean) => void;
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
          set({ isAuthenticated: true, user: DEMO_DISPLAY_USER });
        } else {
          set({ isAuthenticated: false, user: null, workspaceId: null, workspaceName: null });
        }
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
