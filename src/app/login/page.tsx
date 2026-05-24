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
    <div className="min-h-screen bg-[#131315] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 bg-[#1c1b1d] border-r border-[#464554] p-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#8083ff] flex items-center justify-center">
            <GitFork className="w-4 h-4 text-white" />
          </div>
          <span className="text-[14px] font-semibold text-[#e5e1e4] tracking-tight">WarmPath</span>
        </Link>

        <div className="space-y-8">
          <div>
            <h2 className="text-[32px] font-semibold text-[#e5e1e4] tracking-[-0.02em] leading-10 mb-3">
              Warm outbound wins deals.{" "}
              <span className="text-[#c0c1ff]">Cold outbound fills CRMs.</span>
            </h2>
            <p className="text-[14px] text-[#908fa0] leading-relaxed">
              WarmPath maps your team's real relationships and finds the shortest path to every buyer
              before you send a single message.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { val: "3×", label: "higher reply rate" },
              { val: "1-hop", label: "avg intro path" },
              { val: "18d", label: "avg deal velocity" },
              { val: "60%", label: "less cold outbound" },
            ].map((s) => (
              <div key={s.val} className="p-4 rounded-md bg-[#201f22] border border-[#464554]">
                <div className="text-[24px] font-semibold text-[#c0c1ff] leading-none">{s.val}</div>
                <div className="text-[12px] text-[#908fa0] mt-1">{s.label}</div>
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
              <div key={feat} className="flex items-center gap-2.5 text-[13px] text-[#c7c4d7]">
                <Zap className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                {feat}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#464554]">
          © {new Date().getFullYear()} WarmPath · warmpath.ai
        </p>
      </div>

      {/* Right auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-[#8083ff] flex items-center justify-center">
              <GitFork className="w-4 h-4 text-white" />
            </div>
            <span className="text-[14px] font-semibold text-[#e5e1e4]">WarmPath</span>
          </div>

          {/* Demo CTA */}
          <button
            type="button"
            className="w-full h-11 rounded-md bg-[#8083ff] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#c0c1ff] hover:text-[#1000a9] transition-colors mb-6 disabled:opacity-60"
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
              <div className="w-full border-t border-[#464554]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#131315] text-[12px] text-[#908fa0]">or continue with email</span>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-md border border-[#464554] p-0.5 mb-5 bg-[#1c1b1d]">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-[13px] font-medium rounded-sm transition-all ${
                  tab === t
                    ? "bg-[#2a2a2c] text-[#e5e1e4]"
                    : "text-[#908fa0] hover:text-[#c7c4d7]"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[12px] font-medium text-[#c7c4d7]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#464554] bg-[#1c1b1d] px-3 text-[14px] text-[#e5e1e4] placeholder:text-[#908fa0] outline-none focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff]/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[12px] font-medium text-[#c7c4d7]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#464554] bg-[#1c1b1d] px-3 text-[14px] text-[#e5e1e4] placeholder:text-[#908fa0] outline-none focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff]/30 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-md border border-[#464554] bg-[#2a2a2c] text-[#e5e1e4] text-[14px] font-medium hover:bg-[#353437] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="text-[12px] font-medium text-[#c7c4d7]">
                  Full name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#464554] bg-[#1c1b1d] px-3 text-[14px] text-[#e5e1e4] placeholder:text-[#908fa0] outline-none focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff]/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="text-[12px] font-medium text-[#c7c4d7]">
                  Work email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#464554] bg-[#1c1b1d] px-3 text-[14px] text-[#e5e1e4] placeholder:text-[#908fa0] outline-none focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff]/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-[12px] font-medium text-[#c7c4d7]">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#464554] bg-[#1c1b1d] px-3 text-[14px] text-[#e5e1e4] placeholder:text-[#908fa0] outline-none focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff]/30 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-md bg-[#8083ff] text-white text-[14px] font-medium hover:bg-[#c0c1ff] hover:text-[#1000a9] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create account
              </button>
              <p className="text-[11px] text-[#908fa0] text-center leading-relaxed">
                By creating an account you agree to our Terms of Service.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
