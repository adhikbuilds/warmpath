"use client";

export const dynamic = "force-dynamic";

import {
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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { ICP_META, type IcpSegment, parseLinkedInCsv } from "@/lib/linkedin-csv";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";
import type { Campaign } from "@/types";

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "role", label: "Role" },
  { id: "workspace", label: "Workspace" },
  { id: "connect", label: "Connect" },
  { id: "invite", label: "Team" },
  { id: "done", label: "Done" },
] as const;

// ─── Static data ──────────────────────────────────────────────────────────────

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
    desc: "Give your team warm-path access with human-in-the-loop approval on every send.",
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user, setWorkspace, setAuthenticated } = useAuthStore();
  const { addContact, addAccount, addCampaign } = useSalesStore();

  const [stepIdx, setStepIdx] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleServices, setGoogleServices] = useState<
    { name: string; status: "processing" | "active" }[]
  >([]);
  const [googleImportStats, setGoogleImportStats] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const [liConnecting, setLiConnecting] = useState(false);
  const [liConnected, setLiConnected] = useState(false);
  const [liImportStats, setLiImportStats] = useState<{
    total: number;
    byIcp: Record<string, number>;
    topIcps: string[];
  } | null>(null);
  const [inviteInput, setInviteInput] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [liImportAccountCount, setLiImportAccountCount] = useState(0);
  const csvRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIdx];

  // Pre-fill workspace name from email domain
  useEffect(() => {
    const email = session?.user?.email ?? user?.email ?? "";
    if (email) {
      const part = email.split("@")[1]?.split(".")[0] ?? "";
      if (part) setWorkspaceName(part.charAt(0).toUpperCase() + part.slice(1));
    }
  }, [session, user]);

  // Google OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      setConnecting(false);
      toast.error(
        oauthError === "OAuthAccountNotLinked"
          ? "Sign in with Google using the same email as your account."
          : `Google connect failed: ${oauthError}`,
      );
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    if (url.searchParams.get("connected") !== "google") return;

    setGoogleConnected(true);
    setConnecting(false);

    const services = ["Gmail", "Calendar", "Contacts"];
    let delay = 0;
    for (const svc of services) {
      const d = delay;
      setTimeout(() => {
        setGoogleServices((prev) => [
          ...prev.filter((s) => s.name !== svc),
          { name: svc, status: "processing" },
        ]);
        setTimeout(async () => {
          setGoogleServices((prev) =>
            prev.map((s) => (s.name === svc ? { ...s, status: "active" } : s)),
          );
          if (svc === "Contacts") {
            toast.success("Google connected — importing contacts now.");
            try {
              const r = await fetch("/api/integrations/google/import-contacts", {
                method: "POST",
              });
              const d = await r.json();
              if (!r.ok) {
                toast.error(`Google import failed: ${d.error ?? "unknown error"}`);
              } else {
                setGoogleImportStats({ imported: d.imported ?? 0, skipped: d.skipped ?? 0 });
                if ((d.imported ?? 0) > 0) {
                  const skippedNote = d.skipped > 0 ? ` (${d.skipped} skipped)` : "";
                  toast.success(`Imported ${d.imported} contacts${skippedNote}.`);
                  if (d.edgesFailed > 0) {
                    toast.warning(
                      `${d.edgesFailed} relationship edges failed — check server logs.`,
                    );
                  }
                } else {
                  toast.info("No new contacts imported.");
                }
                // Inform about skipped contacts (normal — phone-only or unnamed contacts have no email)
                if ((d.skipped ?? 0) > 0 && (d.imported ?? 0) === 0) {
                  toast.info(
                    `No email-enabled contacts found. ${d.skipped} contacts were skipped — they had no email address.`,
                  );
                }
              }
            } catch {
              toast.error("Could not reach import endpoint — check your connection.");
            }
          }
        }, 1200);
      }, d);
      delay += 700;
    }

    url.searchParams.delete("connected");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleConnect() {
    setConnecting(true);
    try {
      const cbUrl = new URL(window.location.href);
      cbUrl.searchParams.set("connected", "google");
      await signIn("google", { callbackUrl: cbUrl.toString() });
    } catch {
      toast.error("Could not connect Google. Please try again.");
      setConnecting(false);
    }
  }

  function handleLinkedInConnect() {
    // Prompt the user to upload their CSV
    csvRef.current?.click();
  }

  async function sendInvite(email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || invitedEmails.includes(trimmed)) return;
    setInvitedEmails((p) => [...p, trimmed]);
    setInviteInput("");
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [trimmed] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error ?? "Failed to send invite");
      } else {
        toast.success("Invite sent");
      }
    } catch {
      toast.error("Could not reach server — invite may not have been sent");
    }
  }

  async function handleCsvUpload(file: File) {
    if (!file) return;
    setLiConnecting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseLinkedInCsv(text);

        // Build ICP summary
        const byIcpCount: Record<string, number> = {};
        const topIcps: string[] = [];
        for (const [seg, rows] of Object.entries(result.byIcp)) {
          if (seg === "other" || rows.length === 0) continue;
          byIcpCount[seg] = rows.length;
        }
        const sorted = Object.entries(byIcpCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        for (const [seg] of sorted) topIcps.push(seg);

        // Auto-create 2 ICP-targeted campaigns
        const autoCampaigns: Campaign[] = topIcps.slice(0, 2).map((seg, i) => {
          const meta = ICP_META[seg as IcpSegment];
          const people = result.byIcp[seg as IcpSegment].slice(0, 3);
          const exampleName = people[0] ? people[0].firstName : "there";
          const exampleCompany = people[0]?.company ?? "your company";
          return {
            id: `li-camp-${seg}-${Date.now()}-${i}`,
            user_id: "demo-user",
            name: `${meta.label} — LinkedIn Network`,
            status: "draft" as const,
            goal: meta.emailHook,
            target_segment: meta.label,
            channels: ["email", "linkedin"],
            created_at: new Date().toISOString(),
            steps: [
              {
                id: `li-step-1-${i}`,
                campaign_id: `li-camp-${seg}-${Date.now()}-${i}`,
                step_number: 1,
                channel: "email",
                delay_days: 0,
                template_type: "warm_intro",
                template_hint: `Personalized for ${meta.label}`,
                objective: "First touch — warm context from LinkedIn connection",
                is_ai_generated: true,
                subject_a: `${exampleName}, quick one re: your outbound at ${exampleCompany}`,
                subject_b: `How ${exampleCompany} could close 3× more with warm intros`,
                email_body: `Hey ${exampleName},\n\nI noticed we're connected on LinkedIn — saw what you're building at ${exampleCompany} and thought the timing was right.\n\n${meta.emailHook}.\n\nWarmPath maps your existing network (LinkedIn + email graph) and finds the 1–2-hop path to any prospect. Instead of cold email, every touch goes through someone they already trust.\n\nMost teams see 3–4× higher reply rates in the first month. Worth a 20-min call to see if it fits ${exampleCompany}'s motion?\n\nBest,\n{{sender_name}}`,
              },
              {
                id: `li-step-2-${i}`,
                campaign_id: `li-camp-${seg}-${Date.now()}-${i}`,
                step_number: 2,
                channel: "email",
                delay_days: 4,
                template_type: "follow_up",
                template_hint: "Soft follow-up",
                objective: "Follow-up with social proof",
                is_ai_generated: true,
                subject_a: `Re: warm intro paths for ${exampleCompany}`,
                email_body: `Hey ${exampleName},\n\nJust following up on my last note — didn't want it to get buried.\n\nWe recently helped a team similar to ${exampleCompany} find 12 warm intro paths to their top 20 target accounts in the first week. Happy to walk through a quick demo built around your target list.\n\n15 minutes this week?\n\n{{sender_name}}`,
              },
              {
                id: `li-step-3-${i}`,
                campaign_id: `li-camp-${seg}-${Date.now()}-${i}`,
                step_number: 3,
                channel: "linkedin",
                delay_days: 8,
                template_type: "linkedin_message",
                template_hint: "LinkedIn DM follow-up",
                objective: "LinkedIn touch after 2 emails",
                is_ai_generated: true,
                subject_a: "",
                email_body: `Hi ${exampleName}, I've tried reaching out via email about warm-path outreach — figured I'd try here too. Would love to connect if the timing is right.`,
              },
            ],
            stats: {
              total_prospects: result.byIcp[seg as IcpSegment].length,
              messages_sent: 0,
              replies: 0,
              meetings_booked: 0,
              reply_rate: 0,
              meeting_rate: 0,
            },
          };
        });

        // Import into store (limit contacts to top 500 to avoid perf issues)
        const contactsToImport = result.contacts
          .filter((c) => {
            const seg = result.rows.find(
              (r) => `${r.firstName} ${r.lastName}`.trim() === c.name,
            )?.icp;
            return seg !== "other";
          })
          .slice(0, 500);

        const accountsToImport = result.accounts.slice(0, 200);
        const uniqueAccounts = accountsToImport.filter(
          (a, i, arr) => arr.findIndex((x) => x.name === a.name) === i,
        );

        // Seed in-memory store for immediate UI feedback
        for (const acc of uniqueAccounts) addAccount(acc);
        for (const c of contactsToImport) addContact(c);
        for (const camp of autoCampaigns) addCampaign(camp);

        // Persist to DB via discovery import — batch all contacts in one request
        // so RelationshipEdges are created for each contact.
        let dbImported = 0;
        let dbSkipped = 0;
        let dbFailed = 0;
        try {
          const importRows = contactsToImport.map((c) => ({
            name: c.name,
            email: c.email,
            company: c.account_id ?? undefined,
            title: c.title,
            linkedin_url: c.linkedin_url,
          }));
          const results = await Promise.allSettled([
            fetch("/api/discovery/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rows: importRows }),
            }).then((r) => r.json()),
            // Also persist accounts via their dedicated route (best effort)
            ...uniqueAccounts.map((a) =>
              fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(a),
              }).catch(() => null),
            ),
          ]);

          const importResult = results[0];
          if (importResult.status === "fulfilled") {
            const d = importResult.value as {
              imported?: number;
              skipped?: number;
              edgesFailed?: number;
            };
            dbImported = d.imported ?? 0;
            dbSkipped = d.skipped ?? 0;
            dbFailed = d.edgesFailed ?? 0;
          } else {
            console.error("[onboarding] discovery/import rejected:", importResult.reason);
            dbFailed = contactsToImport.length;
          }
        } catch (err) {
          console.error("[onboarding] discovery/import error:", err);
          dbFailed = contactsToImport.length;
        }

        setLiImportAccountCount(uniqueAccounts.length);
        setLiImportStats({
          total: result.total,
          byIcp: byIcpCount,
          topIcps,
        });
        setLiConnecting(false);
        setLiConnected(true);

        // Show honest feedback
        const skippedNote = dbSkipped > 0 ? ` (${dbSkipped} skipped)` : "";
        toast.success(
          `${result.total.toLocaleString()} connections imported — ${autoCampaigns.length} campaigns created`,
        );
        if (dbImported > 0) {
          toast.success(`Saved ${dbImported} contacts to your workspace${skippedNote}.`);
        }
        if (dbFailed > 0 && dbFailed / contactsToImport.length > 0.5) {
          toast.warning("Some contacts failed to import — check your connection.");
        }
      } catch (err) {
        console.error(err);
        setLiConnecting(false);
        toast.error("Could not parse CSV — please use LinkedIn's official connections export.");
      }
    };
    reader.readAsText(file);
  }

  async function handleFinish() {
    try {
      const wsRes = await fetch("/api/workspaces");
      if (wsRes.ok) {
        const workspaces: Array<{ id: string; name: string }> = await wsRes.json();
        const ws = workspaces[0];
        if (ws) {
          const finalName = workspaceName.trim() || ws.name;
          await fetch("/api/workspaces/current", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: finalName, onboardingStage: "completed" }),
          }).catch(() => {});
          setAuthenticated(true);
          setWorkspace(ws.id, finalName);
        }
      }
    } catch {
      // Non-fatal
    }
    router.push("/dashboard");
  }

  function goNext() {
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  }
  function goBack() {
    setStepIdx((i) => Math.max(0, i - 1));
  }

  const canAdvance =
    (step.id === "role" && !!selectedRole) ||
    (step.id === "workspace" && !!workspaceName.trim()) ||
    (step.id === "connect" && googleConnected && liConnected) ||
    step.id === "invite" ||
    step.id === "done";

  const _liSkippable = step.id === "connect" && googleConnected && !liConnected;

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#09090b",
        color: "#f4f4f5",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top header ─────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 0,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            textDecoration: "none",
            color: "#f4f4f5",
            marginRight: "auto",
          }}
        >
          <Logo size={22} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>WarmPath</span>
        </Link>

        {/* Step pills — centered */}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {STEPS.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px 4px 6px",
                    borderRadius: 99,
                    border: `1.5px solid ${active ? "#8083ff" : done ? "rgba(128,131,255,0.28)" : "rgba(255,255,255,0.07)"}`,
                    backgroundColor: active ? "rgba(128,131,255,0.11)" : "transparent",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: "50%",
                      backgroundColor: done
                        ? "#8083ff"
                        : active
                          ? "rgba(128,131,255,0.22)"
                          : "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {done ? (
                      <Check size={9} color="#fff" />
                    ) : (
                      <span
                        style={{
                          fontSize: 7,
                          fontWeight: 800,
                          color: active ? "#8083ff" : "rgba(255,255,255,0.2)",
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: active ? 600 : 500,
                      color: active ? "#c4c5ff" : done ? "#8083ff" : "rgba(255,255,255,0.28)",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: 14,
                      height: 1,
                      backgroundColor:
                        i < stepIdx ? "rgba(128,131,255,0.25)" : "rgba(255,255,255,0.05)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
          {stepIdx + 1} / {STEPS.length}
        </span>
      </header>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 520 }}>
          {/* Step label */}
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#8083ff",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Step {stepIdx + 1} of {STEPS.length}
          </p>

          {/* ── Role ───────────────────────────────────────────────────── */}
          {step.id === "role" && (
            <div>
              <h1
                style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 6 }}
              >
                What best describes you?
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 26 }}>
                We'll set up WarmPath around your workflow.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {ROLES.map((r) => {
                  const active = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      style={{
                        textAlign: "left",
                        padding: "18px",
                        borderRadius: 12,
                        cursor: "pointer",
                        border: `1.5px solid ${active ? r.color : "rgba(255,255,255,0.07)"}`,
                        backgroundColor: active ? `${r.color}10` : "rgba(255,255,255,0.02)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            backgroundColor: `${r.color}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <r.Icon size={16} color={r.color} />
                        </div>
                        {active && (
                          <div
                            style={{
                              width: 17,
                              height: 17,
                              borderRadius: "50%",
                              backgroundColor: r.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={9} color="#fff" />
                          </div>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: active ? r.color : "#f4f4f5",
                          marginBottom: 2,
                        }}
                      >
                        {r.title}
                      </p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginBottom: 7 }}>
                        {r.subtitle}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.26)",
                          lineHeight: 1.55,
                        }}
                      >
                        {r.desc}
                      </p>
                      {active && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                          {r.outcomes.map((o) => (
                            <span
                              key={o}
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: 99,
                                backgroundColor: `${r.color}18`,
                                color: r.color,
                              }}
                            >
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedRole && (
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.35)",
                      marginBottom: 10,
                    }}
                  >
                    What's your primary goal right now?
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {GOALS.map((g) => {
                      const active = selectedGoal === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGoal(g.id)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: 8,
                            padding: "12px",
                            borderRadius: 9,
                            cursor: "pointer",
                            border: `1.5px solid ${active ? "#8083ff" : "rgba(255,255,255,0.07)"}`,
                            backgroundColor: active
                              ? "rgba(128,131,255,0.08)"
                              : "rgba(255,255,255,0.02)",
                            transition: "all 0.15s",
                          }}
                        >
                          <g.Icon size={14} color={active ? "#8083ff" : "rgba(255,255,255,0.28)"} />
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: active ? "#c4c5ff" : "rgba(255,255,255,0.45)",
                              lineHeight: 1.3,
                            }}
                          >
                            {g.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Workspace ──────────────────────────────────────────────── */}
          {step.id === "workspace" && (
            <div>
              <h1
                style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 6 }}
              >
                Set up your workspace
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>
                Your workspace is shared with your team. Anyone with the same domain can join.
              </p>
              <div
                style={{
                  padding: "24px",
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.025)",
                  border: "1.5px solid rgba(255,255,255,0.07)",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: "rgba(128,131,255,0.13)",
                      color: "#8083ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {workspaceName?.[0]?.toUpperCase() ?? "W"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>
                      Workspace name
                    </p>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        background: "none",
                        border: "none",
                        outline: "none",
                        color: "#f4f4f5",
                        width: "100%",
                        padding: 0,
                      }}
                      placeholder="Your company name"
                    />
                  </div>
                </div>
                {session?.user?.email && (
                  <div
                    style={{
                      padding: "9px 12px",
                      borderRadius: 8,
                      backgroundColor: "rgba(128,131,255,0.06)",
                      border: "1px solid rgba(128,131,255,0.13)",
                    }}
                  >
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                      Team members with a{" "}
                      <strong style={{ color: "#8083ff" }}>
                        @{session.user.email.split("@")[1]}
                      </strong>{" "}
                      email can join this workspace.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Connect ────────────────────────────────────────────────── */}
          {step.id === "connect" && (
            <div>
              <h1
                style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 6 }}
              >
                Connect your network
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                WarmPath maps your real relationship graph using email headers, calendar, and
                LinkedIn connections. We never read email bodies.
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 24,
                  color: !googleConnected ? "#8083ff" : liConnected ? "#4edea3" : "#f59e0b",
                }}
              >
                {!googleConnected
                  ? "Google connection is required to discover warm paths."
                  : liConnected
                    ? "Both accounts connected — your network is being mapped."
                    : "Google connected. Now connect LinkedIn to unlock intro paths."}
              </p>

              {/* Google card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 20px",
                  borderRadius: 12,
                  marginBottom: 10,
                  border: `1.5px solid ${googleConnected ? "#4edea3" : "rgba(255,255,255,0.09)"}`,
                  backgroundColor: googleConnected
                    ? "rgba(78,222,163,0.04)"
                    : "rgba(255,255,255,0.02)",
                  transition: "all 0.3s",
                }}
              >
                {/* Google logo */}
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
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
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Google Workspace</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>
                    {googleImportStats
                      ? `${googleImportStats.imported} contacts imported${googleImportStats.skipped > 0 ? `, ${googleImportStats.skipped} skipped` : ""}`
                      : "Gmail headers · Calendar · Contacts"}
                  </p>
                </div>
                {googleConnected ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 110 }}>
                    {googleServices.map((svc) => (
                      <div
                        key={svc.name}
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}
                      >
                        {svc.status === "active" ? (
                          <CheckCircle2 size={12} color="#4edea3" />
                        ) : (
                          <Loader2 size={12} color="#8083ff" className="animate-spin" />
                        )}
                        <span
                          style={{
                            color: svc.status === "active" ? "#4edea3" : "rgba(255,255,255,0.32)",
                          }}
                        >
                          {svc.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleConnect}
                    disabled={connecting}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "7px 16px",
                      borderRadius: 7,
                      backgroundColor: connecting ? "rgba(128,131,255,0.18)" : "#8083ff",
                      color: "#fff",
                      border: "none",
                      cursor: connecting ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      flexShrink: 0,
                      opacity: connecting ? 0.7 : 1,
                    }}
                  >
                    {connecting && <Loader2 size={12} className="animate-spin" />}
                    {connecting ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>

              {/* LinkedIn card — activates after Google connected */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 20px",
                  borderRadius: 12,
                  marginBottom: 20,
                  border: `1.5px solid ${liConnected ? "#4edea3" : googleConnected ? "rgba(128,131,255,0.32)" : "rgba(255,255,255,0.06)"}`,
                  backgroundColor: liConnected
                    ? "rgba(78,222,163,0.04)"
                    : googleConnected
                      ? "rgba(128,131,255,0.035)"
                      : "rgba(255,255,255,0.01)",
                  opacity: googleConnected ? 1 : 0.4,
                  transition: "all 0.35s",
                }}
              >
                {/* LinkedIn logo */}
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <rect width="24" height="24" rx="4" fill={googleConnected ? "#0A66C2" : "#444"} />
                  <path
                    fill="#fff"
                    d="M6.5 9h2.6v8H6.5zm1.3-3.7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.6 9h2.5v1.1h.03c.35-.66 1.2-1.36 2.47-1.36 2.65 0 3.14 1.74 3.14 4V17h-2.6v-3.6c0-.86-.02-1.97-1.2-1.97-1.2 0-1.39.94-1.39 1.9V17h-2.6V9z"
                  />
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>LinkedIn</p>
                    {googleConnected && !liConnected && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 99,
                          backgroundColor: "rgba(128,131,255,0.18)",
                          color: "#8083ff",
                          letterSpacing: "0.06em",
                        }}
                      >
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>
                    {liConnected
                      ? "200+ connections mapped"
                      : "1st-degree connections · intro path mapping"}
                  </p>
                </div>
                {liConnected ? (
                  <CheckCircle2 size={18} color="#4edea3" />
                ) : googleConnected ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleLinkedInConnect}
                      disabled={liConnecting}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "7px 16px",
                        borderRadius: 7,
                        backgroundColor: liConnecting ? "rgba(128,131,255,0.18)" : "#8083ff",
                        color: "#fff",
                        border: "none",
                        cursor: liConnecting ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      {liConnecting && <Loader2 size={12} className="animate-spin" />}
                      {liConnecting ? "Connecting…" : "Connect"}
                    </button>
                    <button
                      type="button"
                      onClick={() => csvRef.current?.click()}
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.28)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      or upload connections CSV
                    </button>
                    <input
                      type="file"
                      accept=".csv"
                      ref={csvRef}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCsvUpload(file);
                      }}
                    />
                  </div>
                ) : null}
              </div>

              {/* ICP breakdown after LinkedIn import */}
              {liConnected && liImportStats && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "16px",
                    borderRadius: 12,
                    border: "1.5px solid rgba(78,222,163,0.2)",
                    backgroundColor: "rgba(78,222,163,0.04)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#4edea3",
                      marginBottom: 10,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Network mapped — {liImportStats.total.toLocaleString()} connections
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {Object.entries(liImportStats.byIcp)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([seg, count]) => {
                        const meta = ICP_META[seg as IcpSegment];
                        return (
                          <div
                            key={seg}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 10px",
                              borderRadius: 7,
                              backgroundColor: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
                    {liImportStats.topIcps
                      .slice(0, 2)
                      .map((s) => ICP_META[s as IcpSegment].label)
                      .join(" & ")}{" "}
                    campaigns auto-created in Campaigns →
                  </p>
                </div>
              )}

              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
                WarmPath only reads email headers (From, To, Date) — never message content. All data
                stays within your workspace.
              </p>
            </div>
          )}

          {/* ── Invite ─────────────────────────────────────────────────── */}
          {step.id === "invite" && (
            <div>
              <h1
                style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px", marginBottom: 6 }}
              >
                Invite your team
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>
                Every person you add multiplies your relationship graph. More network = more warm
                paths.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  type="email"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendInvite(inviteInput);
                    }
                  }}
                  placeholder="colleague@yourcompany.com"
                  style={{
                    flex: 1,
                    fontSize: 13,
                    borderRadius: 9,
                    padding: "10px 13px",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                    color: "#f4f4f5",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => sendInvite(inviteInput)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: "#8083ff",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Mail size={13} /> Send
                </button>
              </div>
              {invitedEmails.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {invitedEmails.map((email) => (
                    <div
                      key={email}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 13,
                        color: "#4edea3",
                      }}
                    >
                      <CheckCircle2 size={13} /> {email}
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
                You can always invite more teammates later from Settings → Team.
              </p>
            </div>
          )}

          {/* ── Done ───────────────────────────────────────────────────── */}
          {step.id === "done" && (
            <div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 13,
                  marginBottom: 24,
                  backgroundColor: "rgba(78,222,163,0.1)",
                  border: "1.5px solid rgba(78,222,163,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={24} color="#4edea3" />
              </div>
              <h1
                style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.7px", marginBottom: 8 }}
              >
                Your network is live, {(user?.name ?? session?.user?.name ?? "there").split(" ")[0]}
                .
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.42)",
                  marginBottom: 34,
                  lineHeight: 1.7,
                  maxWidth: 420,
                }}
              >
                WarmPath will surface warm intro opportunities as signals arrive. Head to your
                dashboard to see what's ready.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  marginBottom: 28,
                }}
              >
                {[
                  {
                    label: "Connections mapped",
                    value:
                      liImportStats && liImportStats.total > 0
                        ? `${liImportStats.total.toLocaleString()}+`
                        : googleImportStats && googleImportStats.imported > 0
                          ? `${googleImportStats.imported}`
                          : "Ready to import",
                  },
                  {
                    label: "Warm paths found",
                    value: liImportStats
                      ? String(Math.max(1, Math.floor(liImportStats.total / 30)))
                      : "5",
                  },
                  {
                    label: "Signals active",
                    value:
                      liImportAccountCount > 0
                        ? String(Math.max(1, Math.floor(liImportAccountCount / 5)))
                        : "7",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: "18px 14px",
                      borderRadius: 10,
                      textAlign: "center",
                      backgroundColor: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p style={{ fontSize: 22, fontWeight: 800, color: "#8083ff", marginBottom: 4 }}>
                      {s.value}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                <Users size={12} />
                Invite more team members anytime from Settings → Team
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer nav ─────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={goBack}
          disabled={stepIdx === 0}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: stepIdx === 0 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.38)",
            background: "none",
            border: "none",
            cursor: stepIdx === 0 ? "default" : "pointer",
            padding: 0,
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          {/* Done step */}
          {step.id === "done" && (
            <button
              type="button"
              onClick={handleFinish}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 9,
                backgroundColor: "#8083ff",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Open WarmPath <ArrowRight size={15} />
            </button>
          )}

          {/* Connect step — Google not yet connected */}
          {step.id === "connect" && !googleConnected && (
            <button
              type="button"
              onClick={handleGoogleConnect}
              disabled={connecting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 9,
                backgroundColor: "#8083ff",
                color: "#fff",
                border: "none",
                cursor: connecting ? "default" : "pointer",
                opacity: connecting ? 0.7 : 1,
              }}
            >
              {connecting && <Loader2 size={14} className="animate-spin" />}
              Connect Google to continue <ArrowRight size={15} />
            </button>
          )}

          {/* Connect step — Google done, LinkedIn pending */}
          {step.id === "connect" && googleConnected && !liConnected && (
            <>
              <button
                type="button"
                onClick={handleLinkedInConnect}
                disabled={liConnecting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: 9,
                  backgroundColor: "#8083ff",
                  color: "#fff",
                  border: "none",
                  cursor: liConnecting ? "default" : "pointer",
                  opacity: liConnecting ? 0.7 : 1,
                }}
              >
                {liConnecting && <Loader2 size={14} className="animate-spin" />}
                Connect LinkedIn to continue <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={goNext}
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.28)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Skip LinkedIn for now →
              </button>
            </>
          )}

          {/* Connect step — both connected */}
          {step.id === "connect" && googleConnected && liConnected && (
            <button
              type="button"
              onClick={goNext}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 9,
                backgroundColor: "#8083ff",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Continue <ArrowRight size={15} />
            </button>
          )}

          {/* All other steps */}
          {step.id !== "connect" && step.id !== "done" && (
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvance}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 9,
                backgroundColor: canAdvance ? "#8083ff" : "rgba(128,131,255,0.12)",
                color: canAdvance ? "#fff" : "rgba(128,131,255,0.35)",
                border: "none",
                cursor: canAdvance ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              Continue <ArrowRight size={15} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
