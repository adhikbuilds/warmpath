"use client";

import { ArrowRight, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/stores/authStore";

function LoginPageContent() {
  const { isAuthenticated, setAuthenticated } = useAuthStore();
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"signin" | "signup">(
    searchParams.get("tab") === "signup" ? "signup" : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  // Clear stale Zustand state when NextAuth says we're logged out
  useEffect(() => {
    if (sessionStatus === "unauthenticated" && isAuthenticated) {
      setAuthenticated(false);
    }
  }, [sessionStatus, isAuthenticated, setAuthenticated]);

  // Redirect as soon as NextAuth confirms a live session — don't wait for Zustand
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/workspace-select");
    }
  }, [sessionStatus, router]);

  if (sessionStatus === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#09090b" }}
      >
        <div
          className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: "#2a2a2e", borderTopColor: "#2563eb" }}
        />
      </div>
    );
  }

  const handleDemo = async () => {
    setIsLoading(true);
    try {
      // Ensure demo user + workspace exist in DB
      await fetch("/api/demo/seed", { method: "POST" });
      const result = await signIn("credentials", { demo: "true", redirect: false });
      if (result?.ok) {
        setAuthenticated(true);
        toast.success("Welcome to WarmBlue!");
        router.push("/dashboard");
        return;
      }
      toast.error("Demo login failed — please try again.");
    } catch {
      toast.error("Something went wrong.");
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
      router.push("/workspace-select");
    } else {
      toast.error("Invalid email or password.");
    }
    setIsLoading(false);
  };

  const handleOAuth = async (provider: "google" | "linkedin") => {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl: "/workspace-select" });
    // signIn redirects, so nothing to do after
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
      toast.success("Account created!");
      router.push("/onboarding");
    } else {
      toast.error("Account created — please sign in.");
      setTab("signin");
    }
    setIsLoading(false);
  };

  const inputStyle = {
    width: "100%",
    height: 40,
    borderRadius: 8,
    padding: "0 12px",
    fontSize: 14,
    backgroundColor: "#fafafa",
    border: "1px solid #e0e0e4",
    color: "#111113",
    outline: "none",
  } as const;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#fafafa", color: "#111113" }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ backgroundColor: "#ffffff", borderRight: "1px solid #e0e0e4" }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2"
          style={{ color: "#111113", textDecoration: "none" }}
        >
          <Logo size={26} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" }}>WarmBlue</span>
        </Link>

        <div className="space-y-8">
          <div>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#111113",
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              Warm outbound wins deals.{" "}
              <span style={{ color: "#059669" }}>Cold outbound fills CRMs.</span>
            </h2>
            <p style={{ fontSize: 14, color: "#666670", lineHeight: 1.7 }}>
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
                className="p-4 rounded-xl"
                style={{ backgroundColor: "#fafafa", border: "1px solid #e0e0e4" }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: "#059669" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "#666670", marginTop: 2 }}>{s.label}</div>
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
              <div
                key={feat}
                className="flex items-center gap-2.5"
                style={{ fontSize: 13, color: "#444448" }}
              >
                <Zap size={13} style={{ color: "#059669", flexShrink: 0 }} />
                {feat}
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: "#9090a0" }}>
          © {new Date().getFullYear()} WarmBlue · warmblue.ai
        </p>
      </div>

      {/* Right auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full" style={{ maxWidth: 360 }}>
          {/* Mobile logo */}
          <div
            className="flex lg:hidden items-center justify-center gap-2 mb-8"
            style={{ color: "#111113" }}
          >
            <Logo size={24} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>WarmBlue</span>
          </div>

          {/* Demo CTA */}
          <button
            type="button"
            className="w-full h-11 rounded-lg text-white flex items-center justify-center gap-2 font-semibold mb-5 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: "#2563eb", fontSize: 14 }}
            onClick={handleDemo}
            disabled={isLoading || !!oauthLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight size={16} />}
            Open demo workspace
          </button>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={isLoading || !!oauthLoading}
              className="h-10 rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-60 transition-colors"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e0e0e4",
                color: "#111113",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {oauthLoading === "google" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
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
              )}
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("linkedin")}
              disabled={isLoading || !!oauthLoading}
              className="h-10 rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-60 transition-colors"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e0e0e4",
                color: "#111113",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {oauthLoading === "linkedin" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                  <rect width="24" height="24" rx="3" fill="#0A66C2" />
                  <path
                    fill="#fff"
                    d="M6.5 9h2.6v8H6.5zm1.3-3.7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.6 9h2.5v1.1h.03c.35-.66 1.2-1.36 2.47-1.36 2.65 0 3.14 1.74 3.14 4V17h-2.6v-3.6c0-.86-.02-1.97-1.2-1.97-1.2 0-1.39.94-1.39 1.9V17h-2.6V9z"
                  />
                </svg>
              )}
              LinkedIn
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid #e0e0e4" }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-[12px]"
                style={{ backgroundColor: "#fafafa", color: "#9090a0" }}
              >
                or continue with email
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-lg p-0.5 mb-4"
            style={{ border: "1px solid #e0e0e4", backgroundColor: "#f4f4f6" }}
          >
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all"
                style={{
                  backgroundColor: tab === t ? "#ffffff" : "transparent",
                  color: tab === t ? "#111113" : "#666670",
                  border: tab === t ? "1px solid #e0e0e4" : "1px solid transparent",
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  style={{ fontSize: 12, fontWeight: 500, color: "#444448", display: "block" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e4")}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  style={{ fontSize: 12, fontWeight: 500, color: "#444448", display: "block" }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e4")}
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                style={{
                  backgroundColor: "#111113",
                  color: "#ffffff",
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                }}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-name"
                  style={{ fontSize: 12, fontWeight: 500, color: "#444448", display: "block" }}
                >
                  Full name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e4")}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-email"
                  style={{ fontSize: 12, fontWeight: 500, color: "#444448", display: "block" }}
                >
                  Work email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e4")}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-password"
                  style={{ fontSize: 12, fontWeight: 500, color: "#444448", display: "block" }}
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e4")}
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  backgroundColor: "#2563eb",
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                }}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create account
              </button>
              <p style={{ fontSize: 11, color: "#9090a0", textAlign: "center", lineHeight: 1.6 }}>
                By creating an account you agree to our Terms of Service.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
