"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

// Minimal demo user shape used only for the UI display layer.
// The real authority is the NextAuth JWT session; this mirrors it.
const DEMO_DISPLAY_USER: User = {
  id: "demo-user",
  name: "Adhik Agarwal",
  email: "demo@warmpath.ai",
  company_name: "WarmPath",
  role: "Founder & CEO",
  plan: "growth",
  onboarding_completed: true,
  created_at: new Date().toISOString(),
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (v: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAuthenticated: (v) => {
        if (v) {
          set({ isAuthenticated: true, user: DEMO_DISPLAY_USER });
        } else {
          set({ isAuthenticated: false, user: null });
        }
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "warmpath-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
