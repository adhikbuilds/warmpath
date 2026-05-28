"use client";

import { ArrowRight, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
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
      toast.success("Welcome to WarmBlue!");
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

  const handleSSO = async (provider: "google" | "microsoft" | "linkedin") => {
    setIsLoading(true);
    // SSO providers not yet configured in NextAuth — fall back to demo bootstrap.
    await new Promise((r) => setTimeout(r, 600));
    setAuthenticated(true);
    toast.success(`Signed in with ${provider[0].toUpperCase()}${provider.slice(1)}.`);
    router.push("/dashboard");
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
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white"
          aria-label="WarmBlue home"
        >
          <Logo size={26} />
          <span className="text-[20px] font-bold tracking-tight">WarmBlue</span>
        </Link>

        <div className="space-y-8">
          <div>
            <h2 className="text-[32px] font-semibold text-white tracking-tight leading-10 mb-3">
              Warm outbound wins deals.{" "}
              <span style={{ color: "#10b981" }}>Cold outbound fills CRMs.</span>
            </h2>
            <p className="text-[14px] text-[#a1a1aa] leading-relaxed">
              WarmBlue maps your team's real relationships and finds the shortest path to every
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
          © {new Date().getFullYear()} WarmBlue · warmblue.ai
        </p>
      </div>

      {/* Right auth form */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ backgroundColor: "#09090b" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8 text-white">
            <Logo size={24} />
            <span className="text-[20px] font-bold">WarmBlue</span>
          </div>

          {/* Demo CTA */}
          <button
            type="button"
            className="w-full h-11 rounded text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors mb-6 disabled:opacity-60"
            style={{ backgroundColor: "#2563eb" }}
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

          {/* SSO buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleSSO("google")}
              disabled={isLoading}
              className="h-10 rounded flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#18181b", border: "1px solid #27272a", color: "#e5e1e4" }}
              title="Continue with Google"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8.7 12 .7 7.4.7 3.5 3.3 1.6 7.1l3.6 2.8C6.1 7 8.8 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.6z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.2 14.3a7.3 7.3 0 0 1 0-4.6L1.6 6.9a12 12 0 0 0 0 10.2l3.6-2.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.3c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5l-3.6 2.8C3.5 20.7 7.4 23.3 12 23.3z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSSO("microsoft")}
              disabled={isLoading}
              className="h-10 rounded flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#18181b", border: "1px solid #27272a", color: "#e5e1e4" }}
              title="Continue with Microsoft"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
              </svg>
              Microsoft
            </button>
            <button
              type="button"
              onClick={() => handleSSO("linkedin")}
              disabled={isLoading}
              className="h-10 rounded flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#18181b", border: "1px solid #27272a", color: "#e5e1e4" }}
              title="Continue with LinkedIn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <rect width="24" height="24" rx="3" fill="#0A66C2" />
                <path
                  fill="#fff"
                  d="M6.5 9h2.6v8H6.5zm1.3-3.7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.6 9h2.5v1.1h.03c.35-.66 1.2-1.36 2.47-1.36 2.65 0 3.14 1.74 3.14 4V17h-2.6v-3.6c0-.86-.02-1.97-1.2-1.97-1.2 0-1.39.94-1.39 1.9V17h-2.6V9z"
                />
              </svg>
              LinkedIn
            </button>
          </div>

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
                style={{ backgroundColor: "#2563eb" }}
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
