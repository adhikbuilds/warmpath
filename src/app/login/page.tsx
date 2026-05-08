"use client";

import { ArrowRight, GitFork, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    const result = await signIn("credentials", {
      demo: "true",
      redirect: false,
    });

    if (result?.ok) {
      setAuthenticated(true);
      toast.success("Welcome to WarmPath! Demo workspace is ready.");
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      setAuthenticated(true);
      toast.success("Signed in successfully.");
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      setAuthenticated(true);
      toast.success("Account created! Let's set up your workspace.");
      router.push("/onboarding");
    } else {
      toast.error("Account created but sign-in failed please sign in manually.");
      setTab("signin");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-card border-r border-border/50 p-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <GitFork className="w-4 h-4 text-brand-foreground" />
          </div>
          <span className="font-bold text-sm tracking-tight">WarmPath</span>
        </Link>

        <div className="space-y-8">
          <div>
            <div className="text-4xl font-extrabold tracking-tight leading-snug mb-3">
              Warm outbound wins deals.{" "}
              <span className="text-brand">Cold outbound fills CRMs.</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
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
              <div key={s.val} className="p-3 rounded-xl bg-brand/5 border border-brand/10">
                <div className="text-2xl font-extrabold text-brand">{s.val}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/50">
          © {new Date().getFullYear()} WarmPath · warmpath.ai
        </p>
      </div>

      {/* Right auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <GitFork className="w-4 h-4 text-brand-foreground" />
            </div>
            <span className="font-bold text-sm">WarmPath</span>
          </div>

          {/* Demo CTA */}
          <Button
            className="w-full h-11 bg-brand hover:bg-brand/90 text-brand-foreground font-semibold mb-6 gap-2"
            onClick={handleDemo}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Open demo workspace
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {/* Sign in / Sign up tabs */}
          <div className="flex rounded-lg border border-border/60 p-0.5 mb-5 bg-muted/40">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                tab === "signin"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                tab === "signup"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button type="submit" variant="outline" className="w-full h-10" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-xs font-medium">Full name</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs font-medium">Work email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-xs font-medium">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-brand hover:bg-brand/90 text-brand-foreground"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create account
              </Button>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                By creating an account you agree to our Terms of Service.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
