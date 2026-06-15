"use client";

import { AlertCircle, CheckCircle, Loader2, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type InviteState =
  | { phase: "loading" }
  | { phase: "ready"; workspaceName: string; inviterName: string; email: string; role: string }
  | { phase: "error"; message: string }
  | { phase: "accepting" }
  | { phase: "done" };

export default function InviteAcceptClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<InviteState>({ phase: "loading" });
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState({ phase: "error", message: "Invalid invite link — no token found." });
      return;
    }

    Promise.all([
      fetch(`/api/team/invite/accept?token=${token}`).then((r) => r.json()),
      fetch("/api/auth/session").then((r) => (r.ok ? r.json() : null)),
    ]).then(([inviteData, session]) => {
      if (inviteData.status === "accepted") {
        setState({ phase: "error", message: "This invite has already been used." });
        return;
      }
      if (inviteData.error) {
        const msg =
          inviteData.error === "Invite not found"
            ? "This invite link is invalid or has been revoked."
            : inviteData.error;
        setState({ phase: "error", message: msg });
        return;
      }
      setCurrentEmail(session?.user?.email ?? null);
      setState({
        phase: "ready",
        workspaceName: inviteData.workspaceName,
        inviterName: inviteData.inviterName,
        email: inviteData.email,
        role: inviteData.role,
      });
    });
  }, [token]);

  async function handleAccept() {
    setState({ phase: "accepting" });
    try {
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (res.status === 401) {
        const callbackUrl = encodeURIComponent(`/invite/accept?token=${token}`);
        router.push(`/login?callbackUrl=${callbackUrl}`);
        return;
      }
      if (res.status === 403) {
        setState({ phase: "error", message: "This invite was sent to a different email address." });
        return;
      }
      if (res.status === 410) {
        setState({
          phase: "error",
          message: "This invite link has expired. Ask your teammate to send a new one.",
        });
        return;
      }
      if (res.status === 409) {
        setState({ phase: "error", message: "This invite has already been used." });
        return;
      }
      if (data.success) {
        setState({ phase: "done" });
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setState({ phase: "error", message: data.error ?? "Failed to accept invite." });
      }
    } catch {
      setState({ phase: "error", message: "Something went wrong. Please try again." });
    }
  }

  const isLoggedIn = !!currentEmail;

  return (
    <div className="min-h-screen bg-[#131315] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold text-white tracking-tight">WarmPath</span>
        </div>

        <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-[#2563eb]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#2563eb]" />
              </div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Workspace invite</p>
            </div>
          </div>

          <div className="px-8 py-8">
            {state.phase === "loading" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-6 h-6 text-[#2563eb] animate-spin" />
                <p className="text-sm text-white/50">Loading invite details…</p>
              </div>
            )}

            {state.phase === "ready" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-white mb-2">Join {state.workspaceName}</h1>
                  <p className="text-sm text-white/60 leading-relaxed">
                    <span className="text-white/80 font-medium">{state.inviterName}</span> has
                    invited <span className="text-[#2563eb] font-medium">{state.email}</span> to
                    join <span className="text-white/80 font-medium">{state.workspaceName}</span> as
                    a {state.role === "sales_rep" ? "Sales Rep" : state.role}.
                  </p>
                </div>

                {isLoggedIn && currentEmail?.toLowerCase() !== state.email.toLowerCase() && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">
                      You are signed in as <strong>{currentEmail}</strong> but this invite was sent
                      to <strong>{state.email}</strong>. Sign in with the correct account to accept.
                    </p>
                  </div>
                )}

                {isLoggedIn ? (
                  <Button
                    onClick={handleAccept}
                    className="w-full bg-[#2563eb] hover:bg-[#6f72e8] text-white font-semibold h-11"
                    disabled={currentEmail?.toLowerCase() !== state.email.toLowerCase()}
                  >
                    Accept & join workspace
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const callbackUrl = encodeURIComponent(`/invite/accept?token=${token}`);
                      router.push(`/login?callbackUrl=${callbackUrl}`);
                    }}
                    className="w-full bg-[#2563eb] hover:bg-[#6f72e8] text-white font-semibold h-11"
                  >
                    Sign in to accept
                  </Button>
                )}

                <p className="text-center text-[11px] text-white/30">
                  By accepting, you'll join as a{" "}
                  {state.role === "sales_rep" ? "Sales Rep" : state.role}. Admins can change your
                  role after you join.
                </p>
              </div>
            )}

            {state.phase === "accepting" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-6 h-6 text-[#2563eb] animate-spin" />
                <p className="text-sm text-white/50">Joining workspace…</p>
              </div>
            )}

            {state.phase === "done" && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-base font-semibold text-white">You're in!</p>
                <p className="text-sm text-white/50">Redirecting to your dashboard…</p>
              </div>
            )}

            {state.phase === "error" && (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white mb-1">Invite unavailable</p>
                  <p className="text-sm text-white/50">{state.message}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="border-white/20 text-white/70 hover:text-white"
                >
                  Go to login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
