"use client";

export const dynamic = "force-dynamic";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  GitMerge,
  Layers,
  Loader2,
  Mail,
  MessageCircle,
  Network,
  Plus,
  Settings,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/stores/authStore";

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { id: "role", label: "Your role", desc: "Who are you?" },
  { id: "goal", label: "Your goal", desc: "What do you want?" },
  { id: "workspace", label: "Your team", desc: "Set up workspace" },
  { id: "connect", label: "Connect", desc: "Import your network" },
  { id: "discover", label: "Discover", desc: "People you know" },
  { id: "invite", label: "Invite", desc: "Bring your team" },
  { id: "first-path", label: "First path", desc: "Your first warm intro" },
  { id: "done", label: "Done", desc: "You're all set" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ─── Data ────────────────────────────────────────────────────────────────────

const ROLES = [
  {
    id: "ae",
    Icon: Target,
    title: "Account Executive",
    subtitle: "I carry a quota",
    desc: "Find warm intros to target accounts. Close deals through relationships, not cold email.",
    color: "#8083ff",
    outcomes: ["3.2× reply rate", "1-hop avg path", "30s approvals"],
  },
  {
    id: "director",
    Icon: Users,
    title: "Sales Director",
    subtitle: "I lead a team",
    desc: "Give your team warm path access with human-in-the-loop approval on every send.",
    color: "#10b981",
    outcomes: ["60% less cold spend", "Team-wide graph", "Full audit trail"],
  },
  {
    id: "revops",
    Icon: GitMerge,
    title: "Revenue Ops",
    subtitle: "I run GTM operations",
    desc: "Map relationship ROI, score every path, and prove network-sourced pipeline to your CFO.",
    color: "#f59e0b",
    outcomes: ["18d faster cycle", "Network attribution", "CRM sync"],
  },
  {
    id: "founder",
    Icon: Layers,
    title: "Founder / CEO",
    subtitle: "I'm building the company",
    desc: "Turn your personal network into structured warm paths — to buyers, hires, and investors.",
    color: "#ec4899",
    outcomes: ["Direct network access", "Investor intros", "Partnership paths"],
  },
];

const GOALS = [
  { id: "sales", Icon: TrendingUp, label: "Close more deals" },
  { id: "fundraising", Icon: BarChart3, label: "Fundraising" },
  { id: "hiring", Icon: UserPlus, label: "Recruiting & hiring" },
  { id: "partnerships", Icon: Network, label: "Partnerships" },
  { id: "customer_dev", Icon: MessageCircle, label: "Customer development" },
  { id: "other", Icon: Settings, label: "Something else" },
];

const DEMO_PEOPLE = [
  { name: "Priya Sharma", title: "VP of Sales", company: "Acme AI", color: "#8b5cf6" },
  { name: "Liam Chen", title: "CTO", company: "CloudStack", color: "#2563eb" },
  { name: "Aisha Patel", title: "Head of Growth", company: "Finflow", color: "#10b981" },
  { name: "Marcus Williams", title: "Founder", company: "GridOps", color: "#f59e0b" },
  { name: "Elena Rodriguez", title: "Dir. of Engineering", company: "NovaTech", color: "#ec4899" },
  { name: "David Kim", title: "Chief Revenue Officer", company: "SalesForge", color: "#06b6d4" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [goalDetails, setGoalDetails] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleServices, setGoogleServices] = useState<Array<{ name: string; status: "processing" | "active" }>>([]);
  const [addedPeople, setAddedPeople] = useState<Set<string>>(new Set());
  const [inviteInput, setInviteInput] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [firstPath, setFirstPath] = useState<{ from: string; to: string; warmth: number } | null>(null);
  const [pathLoading, setPathLoading] = useState(false);

  useEffect(() => {
    const email = session?.user?.email ?? user?.email ?? "";
    if (email) {
      const domain = email.split("@")[1]?.split(".")[0] ?? "";
      if (domain) setWorkspaceName(domain.charAt(0).toUpperCase() + domain.slice(1));
    }
  }, [session, user]);

  // Handle Google OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("connected") !== "google") return;

    setGoogleConnected(true);
    setConnecting(false);

    const services = ["Gmail", "Calendar", "Contacts"];
    let delay = 0;
    for (const svc of services) {
      const d = delay;
      setTimeout(() => {
        setGoogleServices((prev) => [...prev.filter((s) => s.name !== svc), { name: svc, status: "processing" }]);
        setTimeout(() => {
          setGoogleServices((prev) => prev.map((s) => s.name === svc ? { ...s, status: "active" } : s));
          if (svc === "Contacts") {
            toast.success("Google connected — your network is importing.");
            setTimeout(() => goNext(), 1200);
          }
        }, 1200);
      }, d);
      delay += 700;
    }

    fetch("/api/integrations/google/import-contacts", { method: "POST" }).catch(() => {});
    url.searchParams.delete("connected");
    window.history.replaceState({}, "", url.toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate first warm path
  useEffect(() => {
    const step = STEPS[currentStep];
    if (step.id === "first-path" && !firstPath) {
      setPathLoading(true);
      setTimeout(() => {
        const connector = Array.from(addedPeople)[0] ?? "Priya Sharma";
        setFirstPath({ from: connector, to: "OpenAI Procurement Lead", warmth: 78 });
        setPathLoading(false);
      }, 1800);
    }
  }, [currentStep, firstPath, addedPeople]);

  const step = STEPS[currentStep];

  function goNext() {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  }
  function goBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  async function handleGoogleConnect() {
    setConnecting(true);
    try {
      await signIn("google", { callbackUrl: window.location.href + "?connected=google" });
    } catch {
      toast.error("Could not connect Google. Please try again.");
      setConnecting(false);
    }
  }

  function handleFinish() {
    router.push("/dashboard");
  }

  const canAdvance =
    (step.id === "role" && !!selectedRole) ||
    (step.id === "goal" && !!selectedGoal) ||
    (step.id === "workspace" && !!workspaceName.trim()) ||
    step.id === "discover" ||
    step.id === "invite" ||
    step.id === "first-path" ||
    step.id === "done";

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#09090b", color: "#f4f4f5" }}>
      {/* ── Left rail ──────────────────────────────────────────────────── */}
      <aside style={{
        width: 260, flexShrink: 0, padding: "32px 24px",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48, textDecoration: "none", color: "#f4f4f5" }}>
          <Logo size={24} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>WarmBlue</span>
        </Link>

        <div style={{ flex: 1 }}>
          {STEPS.map((s, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                {/* Line connector */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: done ? "#8083ff" : active ? "rgba(128,131,255,0.15)" : "rgba(255,255,255,0.06)",
                    border: active ? "1.5px solid #8083ff" : done ? "none" : "1.5px solid rgba(255,255,255,0.1)",
                    transition: "all 0.2s",
                  }}>
                    {done ? <Check size={12} color="#fff" /> : (
                      <span style={{ fontSize: 9, fontWeight: 700, color: active ? "#8083ff" : "rgba(255,255,255,0.3)" }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 1, height: 28, backgroundColor: done ? "#8083ff40" : "rgba(255,255,255,0.06)", marginTop: 2 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 28 }}>
                  <p style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "#f4f4f5" : done ? "#8083ff" : "rgba(255,255,255,0.35)", lineHeight: 1.2 }}>
                    {s.label}
                  </p>
                  {active && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.desc}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          © 2026 WarmBlue
        </p>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Content area */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 80px" }}>
          <div style={{ width: "100%", maxWidth: 640 }}>
            {step.id === "role" && (
              <StepRole selectedRole={selectedRole} onSelectRole={setSelectedRole} />
            )}
            {step.id === "goal" && (
              <StepGoal selectedGoal={selectedGoal} onSelectGoal={setSelectedGoal} goalDetails={goalDetails} onGoalDetails={setGoalDetails} />
            )}
            {step.id === "workspace" && (
              <StepWorkspace workspaceName={workspaceName} onChangeName={setWorkspaceName} email={session?.user?.email ?? user?.email ?? ""} />
            )}
            {step.id === "connect" && (
              <StepConnect connecting={connecting} googleConnected={googleConnected} googleServices={googleServices} onConnectGoogle={handleGoogleConnect} />
            )}
            {step.id === "discover" && (
              <StepDiscover addedPeople={addedPeople} onTogglePerson={(name) =>
                setAddedPeople((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; })
              } />
            )}
            {step.id === "invite" && (
              <StepInvite inviteInput={inviteInput} onChangeInput={setInviteInput} invitedEmails={invitedEmails}
                onInvite={(email) => {
                  if (email && !invitedEmails.includes(email)) {
                    setInvitedEmails((p) => [...p, email]);
                    setInviteInput("");
                    toast.success(`Invite sent to ${email}`);
                  }
                }} />
            )}
            {step.id === "first-path" && (
              <StepFirstPath loading={pathLoading} path={firstPath} addedCount={addedPeople.size} />
            )}
            {step.id === "done" && (
              <StepDone userName={user?.name ?? session?.user?.name ?? "there"} />
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{
          padding: "20px 80px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 500,
              color: currentStep === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
              background: "none", border: "none", cursor: currentStep === 0 ? "default" : "pointer",
              padding: 0,
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              {currentStep + 1} / {STEPS.length}
            </span>
            {step.id === "done" ? (
              <button type="button" onClick={handleFinish} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 14, fontWeight: 600, padding: "10px 24px", borderRadius: 10,
                backgroundColor: "#8083ff", color: "#fff", border: "none", cursor: "pointer",
              }}>
                Open WarmBlue <ArrowRight size={15} />
              </button>
            ) : step.id === "connect" ? (
              /* Connect step: no skip — must connect Google */
              googleConnected ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4edea3" }}>
                  <CheckCircle2 size={16} /> Importing your network…
                </div>
              ) : (
                <button type="button" onClick={handleGoogleConnect} disabled={connecting} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 14, fontWeight: 600, padding: "10px 24px", borderRadius: 10,
                  backgroundColor: "#8083ff", color: "#fff", border: "none",
                  cursor: connecting ? "default" : "pointer",
                  opacity: connecting ? 0.7 : 1,
                }}>
                  {connecting ? <Loader2 size={15} className="animate-spin" /> : <></>}
                  Connect Google to continue <ArrowRight size={15} />
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 14, fontWeight: 600, padding: "10px 24px", borderRadius: 10,
                  backgroundColor: canAdvance ? "#8083ff" : "rgba(128,131,255,0.15)",
                  color: canAdvance ? "#fff" : "rgba(128,131,255,0.4)",
                  border: "none", cursor: canAdvance ? "pointer" : "default",
                  transition: "all 0.2s",
                }}
              >
                Continue <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Step: Role ───────────────────────────────────────────────────────────────

function StepRole({ selectedRole, onSelectRole }: { selectedRole: string; onSelectRole: (r: string) => void }) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8 }}>
        What best describes you?
      </h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 36 }}>
        We'll tailor WarmBlue's setup and recommendations to your role.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {ROLES.map((r) => {
          const active = selectedRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRole(r.id)}
              style={{
                textAlign: "left", padding: "20px", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${active ? r.color : "rgba(255,255,255,0.08)"}`,
                backgroundColor: active ? `${r.color}10` : "rgba(255,255,255,0.03)",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  backgroundColor: `${r.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <r.Icon size={18} color={r.color} />
                </div>
                {active && (
                  <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={10} color="#fff" />
                  </div>
                )}
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: active ? r.color : "#f4f4f5", marginBottom: 3 }}>{r.title}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{r.subtitle}</p>
              <p style={{ fontSize: 12, color: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>{r.desc}</p>
              {active && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
                  {r.outcomes.map((o) => (
                    <span key={o} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, backgroundColor: `${r.color}18`, color: r.color }}>
                      {o}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step: Goal ───────────────────────────────────────────────────────────────

function StepGoal({ selectedGoal, onSelectGoal, goalDetails, onGoalDetails }: {
  selectedGoal: string; onSelectGoal: (g: string) => void;
  goalDetails: string; onGoalDetails: (s: string) => void;
}) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8 }}>
        What's your primary goal?
      </h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 36 }}>
        This helps us surface the right warm paths and signals for your team.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {GOALS.map((g) => {
          const active = selectedGoal === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectGoal(g.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                gap: 10, padding: "16px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${active ? "#8083ff" : "rgba(255,255,255,0.08)"}`,
                backgroundColor: active ? "rgba(128,131,255,0.1)" : "rgba(255,255,255,0.03)",
                transition: "all 0.15s",
              }}
            >
              <g.Icon size={18} color={active ? "#8083ff" : "rgba(255,255,255,0.35)"} />
              <span style={{ fontSize: 13, fontWeight: 600, color: active ? "#c0c1ff" : "rgba(255,255,255,0.65)" }}>
                {g.label}
              </span>
            </button>
          );
        })}
      </div>
      {selectedGoal && (
        <textarea
          value={goalDetails}
          onChange={(e) => onGoalDetails(e.target.value)}
          placeholder="Tell us more about your specific goal or target market…"
          rows={3}
          style={{
            width: "100%", fontSize: 14, borderRadius: 10, padding: "12px 14px",
            resize: "none", outline: "none",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.1)",
            color: "#f4f4f5",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}

// ─── Step: Workspace ──────────────────────────────────────────────────────────

function StepWorkspace({ workspaceName, onChangeName, email }: {
  workspaceName: string; onChangeName: (s: string) => void; email: string;
}) {
  const domain = email.split("@")[1] ?? "";
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8 }}>
        Set up your workspace
      </h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 36 }}>
        Your workspace is shared with your team. Anyone with a <span style={{ color: "#8083ff" }}>@{domain}</span> email can join.
      </p>
      <div style={{
        padding: "28px", borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1.5px solid rgba(255,255,255,0.08)",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            backgroundColor: "rgba(128,131,255,0.15)", color: "#8083ff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 800,
          }}>
            {workspaceName?.[0]?.toUpperCase() ?? "W"}
          </div>
          <div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Workspace name</p>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => onChangeName(e.target.value)}
              style={{
                fontSize: 18, fontWeight: 700, background: "none",
                border: "none", outline: "none", color: "#f4f4f5",
                width: 300, padding: 0,
              }}
              placeholder="Your company name"
            />
          </div>
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "rgba(128,131,255,0.08)", border: "1px solid rgba(128,131,255,0.15)" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            Team members with a <strong style={{ color: "#8083ff" }}>@{domain}</strong> email address will be able to find and join this workspace.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step: Connect ────────────────────────────────────────────────────────────

function StepConnect({ connecting, googleConnected, googleServices, onConnectGoogle }: {
  connecting: boolean;
  googleConnected: boolean;
  googleServices: Array<{ name: string; status: "processing" | "active" }>;
  onConnectGoogle: () => void;
}) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8 }}>
        Connect your network
      </h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
        WarmBlue imports your email headers, calendar, and contacts to map your real relationship graph. We never read email bodies.
      </p>
      <p style={{ fontSize: 13, color: "rgba(128,131,255,0.8)", marginBottom: 36, fontWeight: 500 }}>
        Google connection is required to discover warm paths.
      </p>

      {/* Google card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
        borderRadius: 12, marginBottom: 12,
        border: `1.5px solid ${googleConnected ? "#4edea3" : "rgba(255,255,255,0.1)"}`,
        backgroundColor: googleConnected ? "rgba(78,222,163,0.05)" : "rgba(255,255,255,0.03)",
        transition: "all 0.3s",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8.7 12 .7 7.4.7 3.5 3.3 1.6 7.1l3.6 2.8C6.1 7 8.8 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.6z" />
          <path fill="#FBBC05" d="M5.2 14.3a7.3 7.3 0 0 1 0-4.6L1.6 6.9a12 12 0 0 0 0 10.2l3.6-2.8z" />
          <path fill="#34A853" d="M12 23.3c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5l-3.6 2.8C3.5 20.7 7.4 23.3 12 23.3z" />
        </svg>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Google</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Gmail headers · Calendar · Contacts</p>
        </div>
        {googleConnected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 130 }}>
            {googleServices.map((svc) => (
              <div key={svc.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                {svc.status === "active"
                  ? <CheckCircle2 size={13} color="#4edea3" />
                  : <Loader2 size={13} color="#8083ff" className="animate-spin" />}
                <span style={{ color: svc.status === "active" ? "#4edea3" : "rgba(255,255,255,0.4)" }}>{svc.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={onConnectGoogle}
            disabled={connecting}
            style={{
              fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8,
              backgroundColor: "#8083ff", color: "#fff", border: "none",
              cursor: connecting ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              opacity: connecting ? 0.7 : 1,
            }}
          >
            {connecting ? <Loader2 size={13} className="animate-spin" /> : null}
            {connecting ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>

      {/* LinkedIn card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "20px 24px",
        borderRadius: 12, marginBottom: 20,
        border: "1.5px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.03)",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
          <rect width="24" height="24" rx="4" fill="#0A66C2" />
          <path fill="#fff" d="M6.5 9h2.6v8H6.5zm1.3-3.7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.6 9h2.5v1.1h.03c.35-.66 1.2-1.36 2.47-1.36 2.65 0 3.14 1.74 3.14 4V17h-2.6v-3.6c0-.86-.02-1.97-1.2-1.97-1.2 0-1.39.94-1.39 1.9V17h-2.6V9z" />
        </svg>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>LinkedIn</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Upload your connections export</p>
        </div>
        <label style={{
          fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 8,
          border: "1.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
        }}>
          Upload CSV
          <input type="file" accept=".csv,.zip" style={{ display: "none" }}
            onChange={() => toast.success("LinkedIn CSV received — connections will sync shortly.")} />
        </label>
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
        We only access email headers (From, To, Date) — never email bodies. Calendar event titles are used to measure relationship recency. All data stays within your workspace.
      </p>
    </div>
  );
}

// ─── Step: Discover ───────────────────────────────────────────────────────────

function StepDiscover({ addedPeople, onTogglePerson }: { addedPeople: Set<string>; onTogglePerson: (name: string) => void }) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8 }}>
        People in your network
      </h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 36 }}>
        These are senior contacts WarmBlue found in your imported network. Add them to unlock intro paths through their connections.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {DEMO_PEOPLE.map((p) => {
          const added = addedPeople.has(p.name);
          const initials = p.name.split(" ").map((n) => n[0]).join("");
          return (
            <div key={p.name} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              borderRadius: 10,
              border: `1.5px solid ${added ? "rgba(78,222,163,0.3)" : "rgba(255,255,255,0.08)"}`,
              backgroundColor: added ? "rgba(78,222,163,0.05)" : "rgba(255,255,255,0.03)",
              transition: "all 0.15s",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                backgroundColor: `${p.color}20`, color: p.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5", marginBottom: 1 }}>{p.name}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{p.title} · {p.company}</p>
              </div>
              <button
                type="button"
                onClick={() => onTogglePerson(p.name)}
                style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${added ? "#4edea3" : "rgba(128,131,255,0.4)"}`,
                  backgroundColor: added ? "#4edea3" : "transparent",
                  cursor: "pointer",
                }}
              >
                {added ? <Check size={13} color="#09090b" /> : <Plus size={13} color="#8083ff" />}
              </button>
            </div>
          );
        })}
      </div>
      {addedPeople.size > 0 && (
        <p style={{ fontSize: 12, color: "#4edea3", marginTop: 16, fontWeight: 500 }}>
          {addedPeople.size} connection{addedPeople.size > 1 ? "s" : ""} added — WarmBlue will map paths through their networks.
        </p>
      )}
    </div>
  );
}

// ─── Step: Invite ─────────────────────────────────────────────────────────────

function StepInvite({ inviteInput, onChangeInput, invitedEmails, onInvite }: {
  inviteInput: string; onChangeInput: (s: string) => void;
  invitedEmails: string[]; onInvite: (email: string) => void;
}) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8 }}>
        Invite your team
      </h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 36 }}>
        Each team member you add multiplies your relationship graph. More network = more warm paths.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          type="email"
          value={inviteInput}
          onChange={(e) => onChangeInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onInvite(inviteInput); }}
          placeholder="colleague@yourcompany.com"
          style={{
            flex: 1, fontSize: 14, borderRadius: 10, padding: "12px 14px",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.1)",
            color: "#f4f4f5", outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => onInvite(inviteInput)}
          style={{
            padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            backgroundColor: "#8083ff", color: "#fff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Mail size={14} /> Send
        </button>
      </div>
      {invitedEmails.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {invitedEmails.map((email) => (
            <div key={email} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4edea3" }}>
              <CheckCircle2 size={14} /> {email}
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 20 }}>
        You can also invite teammates from Settings → Team after setup.
      </p>
    </div>
  );
}

// ─── Step: First path ─────────────────────────────────────────────────────────

function StepFirstPath({ loading, path, addedCount }: {
  loading: boolean;
  path: { from: string; to: string; warmth: number } | null;
  addedCount: number;
}) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginBottom: 8 }}>
        Your first warm path
      </h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 36 }}>
        {addedCount > 0
          ? `WarmBlue found an intro path using your ${addedCount} new connection${addedCount > 1 ? "s" : ""}.`
          : "WarmBlue scanned your network and found an intro opportunity."}
      </p>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 16 }}>
          <Loader2 size={36} color="#8083ff" className="animate-spin" />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Scanning your network…</p>
        </div>
      ) : path ? (
        <div style={{
          borderRadius: 14, padding: "28px",
          border: "1.5px solid rgba(128,131,255,0.25)",
          backgroundColor: "rgba(128,131,255,0.05)",
        }}>
          {/* Path nodes */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
            {["You", path.from, path.to].map((node, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flex: i === 1 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    backgroundColor: i === 0 ? "rgba(78,222,163,0.15)" : i === 1 ? "rgba(128,131,255,0.15)" : "rgba(245,158,11,0.15)",
                    border: `1.5px solid ${i === 0 ? "#4edea3" : i === 1 ? "#8083ff" : "#f59e0b"}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                    color: i === 0 ? "#4edea3" : i === 1 ? "#8083ff" : "#f59e0b",
                  }}>
                    {node.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 80, lineHeight: 1.3 }}>{node}</p>
                </div>
                {i < 2 && (
                  <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)", margin: "0 8px", marginBottom: 20 }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Path warmth score</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#4edea3" }}>{path.warmth}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${path.warmth}%`, backgroundColor: "#4edea3", borderRadius: 2 }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Step: Done ───────────────────────────────────────────────────────────────

function StepDone({ userName }: { userName: string }) {
  return (
    <div>
      <div style={{
        width: 56, height: 56, borderRadius: 14, marginBottom: 28,
        backgroundColor: "rgba(78,222,163,0.12)", border: "1.5px solid rgba(78,222,163,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Zap size={26} color="#4edea3" />
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px", marginBottom: 8 }}>
        Your network is live, {userName.split(" ")[0]}.
      </h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 40, maxWidth: 480, lineHeight: 1.7 }}>
        WarmBlue will surface warm intro opportunities as signals arrive from your network. Head to your dashboard to see what's ready.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Connections mapped", value: "164+" },
          { label: "Warm paths found", value: "5" },
          { label: "Signals active", value: "7" },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "20px 16px", borderRadius: 10, textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#8083ff", marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
        <Users size={13} />
        Invite more team members anytime from Settings → Team
      </div>
    </div>
  );
}
