"use client";

export const dynamic = "force-dynamic";

import { ArrowRight, Building2, Loader2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/authStore";

type Workspace = {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  ownerId: string;
  role: string;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: "#f4f4f6", text: "#666670", border: "#e0e0e4" },
  starter: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  growth: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  enterprise: { bg: "#faf5ff", text: "#7c3aed", border: "#ddd6fe" },
};

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, setWorkspace, setAuthenticated } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    // Sync NextAuth session → Zustand so app layout guard stays happy
    if (status === "authenticated") {
      setAuthenticated(true);
      loadWorkspaces();
    }
  }, [status]);

  async function loadWorkspaces() {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error();
      const data: Workspace[] = await res.json();
      setWorkspaces(data);
      // Auto-enter if only one workspace
      if (data.length === 1) {
        enterWorkspace(data[0]);
      } else if (data.length === 0) {
        router.replace("/onboarding");
      }
    } catch {
      // Fallback: if API fails (e.g. no DB), go straight to dashboard
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  function enterWorkspace(ws: Workspace) {
    setEntering(ws.id);
    setWorkspace(ws.id, ws.name);
    router.push("/dashboard");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error();
      const ws = await res.json();
      toast.success("Workspace created!");
      enterWorkspace({ ...ws, plan: "free", memberCount: 1, ownerId: "", role: "owner" });
    } catch {
      toast.error("Failed to create workspace.");
      setCreating(false);
    }
  }

  if (status === "loading" || loading || (workspaces.length === 1 && entering)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#fafafa" }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#5456d4" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "#fafafa" }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 mb-10"
        style={{ color: "#111113", textDecoration: "none" }}
      >
        <Logo size={28} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>WarmBlue</span>
      </Link>

      <div
        className="w-full rounded-2xl p-8"
        style={{
          maxWidth: 520,
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e4",
          boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111113", marginBottom: 6 }}>
            {workspaces.length === 0 ? "No workspaces found" : "Choose a workspace"}
          </h1>
          <p style={{ fontSize: 14, color: "#666670" }}>
            {user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back."}{" "}
            {workspaces.length > 0
              ? "Select a workspace to continue."
              : "Create a workspace to get started."}
          </p>
        </div>

        {/* Workspace list */}
        {workspaces.length > 0 && (
          <div className="space-y-2 mb-4">
            {workspaces.map((ws) => {
              const plan = PLAN_COLORS[ws.plan] ?? PLAN_COLORS.free;
              const initials = ws.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join("");
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => enterWorkspace(ws)}
                  disabled={entering === ws.id}
                  className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all"
                  style={{
                    backgroundColor: entering === ws.id ? "#f4f4f6" : "#fafafa",
                    border: "1px solid #e0e0e4",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (entering !== ws.id)
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#5456d4";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#e0e0e4";
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: "#eeeeff",
                      color: "#5456d4",
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {initials || <Building2 size={18} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111113",
                        marginBottom: 4,
                      }}
                    >
                      {ws.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: plan.bg,
                          color: plan.text,
                          border: `1px solid ${plan.border}`,
                        }}
                      >
                        {PLAN_LABELS[ws.plan] ?? ws.plan}
                      </span>
                      <span
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "#9090a0" }}
                      >
                        <Users size={11} />
                        {ws.memberCount} {ws.memberCount === 1 ? "member" : "members"}
                      </span>
                      {ws.role === "owner" && (
                        <span className="text-[11px]" style={{ color: "#9090a0" }}>
                          · Owner
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  {entering === ws.id ? (
                    <Loader2
                      className="w-4 h-4 animate-spin shrink-0"
                      style={{ color: "#5456d4" }}
                    />
                  ) : (
                    <ArrowRight size={16} className="shrink-0" style={{ color: "#9090a0" }} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Divider */}
        {workspaces.length > 0 && (
          <div className="flex items-center gap-3 my-4" style={{ color: "#9090a0", fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "#e0e0e4" }} />
            or
            <div style={{ flex: 1, height: 1, backgroundColor: "#e0e0e4" }} />
          </div>
        )}

        {/* Create workspace */}
        {!showCreate ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-medium transition-colors"
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid #e0e0e4",
              color: "#5456d4",
              cursor: "pointer",
            }}
          >
            <Plus size={15} />
            Create a new workspace
          </button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label
                htmlFor="ws-name"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#666670",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Workspace name
              </label>
              <input
                id="ws-name"
                type="text"
                autoFocus
                placeholder="Acme Corp"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full h-10 rounded-lg px-3 text-[14px] outline-none transition-all"
                style={{
                  backgroundColor: "#fafafa",
                  border: "1px solid #e0e0e4",
                  color: "#111113",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#5456d4")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e4")}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 h-10 rounded-lg text-[14px] font-medium"
                style={{
                  backgroundColor: "#fafafa",
                  border: "1px solid #e0e0e4",
                  color: "#666670",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="flex-1 h-10 rounded-lg text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#5456d4", cursor: "pointer" }}
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#9090a0", marginTop: 24 }}>
        © 2026 WarmBlue ·{" "}
        <a href="#" style={{ color: "#9090a0" }}>
          Privacy
        </a>
      </p>
    </div>
  );
}
