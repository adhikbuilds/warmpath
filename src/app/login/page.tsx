"use client";

import { ArrowRight, GitFork, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const { setAuthenticated, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    router.replace("/dashboard");
    return null;
  }

  const handleDemo = async () => {
    setIsLoading(true);
    const result = await signIn("credentials", { demo: "true", redirect: false });
    if (result?.ok) {
      setAuthenticated(true);
      toast.success("Welcome to WarmPath!");
      router.push("/dashboard");
    } else {
      toast.error("Demo sign-in failed.");
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.ok) {
      setAuthenticated(true);
      toast.success("Signed in.");
      router.push("/dashboard");
    } else {
      toast.error("Invalid email or password.");
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { error?: string }).error ?? "Registration failed.");
      setIsLoading(false);
      return;
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.ok) {
      setAuthenticated(true);
      toast.success("Account created!");
      router.push("/onboarding");
    } else {
      toast.error("Account created — please sign in.");
      setTab("signin");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#09090b", color: "#e5e1e4" }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10"
        style={{ backgroundColor: "#18181b", borderRight: "1px solid #27272a" }}
      >
        <Link href="/" className="text-[20px] font-bold text-white tracking-tight">
          WarmPath
        </Link>

        <div className="space-y-8">
          <div>
            <h2 className="text-[32px] font-semibold text-white tracking-tight leading-10 mb-3">
              Warm outbound wins deals.{" "}
              <span style={{ color: "#10b981" }}>Cold outbound fills CRMs.</span>
            </h2>
            <p className="text-[14px] text-[#a1a1aa] leading-relaxed">
              WarmPath maps your team's real relationships and finds the shortest path to every
              buyer before you send a single message.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { val: "3×", label: "higher reply rate" },
              { val: "1-hop", label: "avg intro path" },
              { val: "18d", label: "avg deal velocity" },
              { val: "60%", label: "less cold outbound" },
            ].map((s) => (
              <div
                key={s.val}
                className="p-4 rounded"
                style={{ backgroundColor: "#09090b", border: "1px solid #27272a" }}
              >
                <div
                  className="text-[24px] font-semibold leading-none"
                  style={{ color: "#10b981" }}
                >
                  {s.val}
                </div>
                <div className="text-[12px] text-[#a1a1aa] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {[
              "Maps your team's real relationship graph",
              "Finds warm intro paths to every buyer",
              "Detects LinkedIn engagement signals first",
              "AI drafts personalized outreach per contact",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5 text-[13px] text-[#a1a1aa]">
                <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "#10b981" }} />
                {feat}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#52525b]">
          © {new Date().getFullYear()} WarmPath · warmpath.ai
        </p>
      </div>

      {/* Right auth form */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ backgroundColor: "#09090b" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <span className="text-[20px] font-bold text-white">WarmPath</span>
          </div>

          {/* Demo CTA */}
          <button
            type="button"
            className="w-full h-11 rounded text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors mb-6 disabled:opacity-60"
            style={{ backgroundColor: "#4f46e5" }}
            onClick={handleDemo}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Open demo workspace
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "#27272a" }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-[12px] text-[#52525b]"
                style={{ backgroundColor: "#09090b" }}
              >
                or continue with email
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded p-0.5 mb-5"
            style={{ border: "1px solid #27272a", backgroundColor: "#18181b" }}
          >
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="flex-1 py-1.5 text-[13px] font-medium rounded-sm transition-all"
                style={{
                  backgroundColor: tab === t ? "#27272a" : "transparent",
                  color: tab === t ? "#e5e1e4" : "#71717a",
                }}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[12px] font-medium text-[#a1a1aa]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded px-3 text-[14px] text-white placeholder-[#52525b] outline-none transition-all"
                  style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[12px] font-medium text-[#a1a1aa]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded px-3 text-[14px] text-white placeholder-[#52525b] outline-none transition-all"
                  style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded text-white text-[14px] font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                style={{ backgroundColor: "#27272a", border: "1px solid #3f3f46" }}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="text-[12px] font-medium text-[#a1a1aa]">
                  Full name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded px-3 text-[14px] text-white placeholder-[#52525b] outline-none transition-all"
                  style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="text-[12px] font-medium text-[#a1a1aa]">
                  Work email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded px-3 text-[14px] text-white placeholder-[#52525b] outline-none transition-all"
                  style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-[12px] font-medium text-[#a1a1aa]">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded px-3 text-[14px] text-white placeholder-[#52525b] outline-none transition-all"
                  style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded text-white text-[14px] font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                style={{ backgroundColor: "#4f46e5" }}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create account
              </button>
              <p className="text-[11px] text-[#52525b] text-center leading-relaxed">
                By creating an account you agree to our Terms of Service.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
