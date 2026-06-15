"use client";

import { AlertTriangle, Building2, Settings, Sparkles, Target, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";

const INDUSTRIES = [
  "SaaS",
  "Fintech",
  "Healthcare",
  "E-commerce",
  "Enterprise Software",
  "Cybersecurity",
  "Data & Analytics",
  "HR Tech",
  "MarTech",
  "DevTools",
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-2000", "2000+"];

const TECH_STACKS = [
  "Salesforce",
  "HubSpot",
  "AWS",
  "Azure",
  "GCP",
  "Slack",
  "Jira",
  "Zendesk",
  "Marketo",
  "Snowflake",
  "dbt",
  "Databricks",
];

const SIGNAL_TYPES = [
  { id: "funding", label: "Funding rounds", enabled: true },
  { id: "job_posting", label: "Job postings (hiring signals)", enabled: true },
  { id: "pricing_page_visit", label: "Pricing page visits", enabled: true },
  { id: "website_visit", label: "Website visits", enabled: false },
  { id: "tech_stack_change", label: "Tech stack changes", enabled: true },
  { id: "leadership_change", label: "Leadership changes", enabled: true },
  { id: "champion_job_change", label: "Champion job changes", enabled: true },
  { id: "g2_review", label: "G2 reviews", enabled: false },
  { id: "linkedin_post", label: "LinkedIn engagement", enabled: true },
];

export default function SettingsPage() {
  const { user: _user } = useAuthStore();

  // ICP state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(["SaaS", "Fintech"]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["51-200", "201-500", "501-2000"]);
  const [selectedTech, setSelectedTech] = useState<string[]>(["Salesforce", "HubSpot"]);
  const [jobTitles, setJobTitles] = useState(
    "VP of Sales, Head of Revenue, Chief Revenue Officer, VP GTM",
  );
  const [geographies, setGeographies] = useState("United States, Canada, United Kingdom");
  const [minRevenue, setMinRevenue] = useState("10");
  const [maxRevenue, setMaxRevenue] = useState("500");

  // Persona state
  const [personaTone, setPersonaTone] = useState("conversational");
  const [personaStyle, setPersonaStyle] = useState("");
  const [personaSamples, setPersonaSamples] = useState(
    "Hey Sarah congrats on the Series B, that's a huge milestone. I've been following what you're building at Finpilot...",
  );

  // Signals state
  const [enabledSignals, setEnabledSignals] = useState<Record<string, boolean>>(
    Object.fromEntries(SIGNAL_TYPES.map((s) => [s.id, s.enabled])),
  );

  // Workspace / company info state
  const [workspaceName, setWorkspaceName] = useState("WarmPath");
  const [workspaceWebsite, setWorkspaceWebsite] = useState("warmpath.ai");
  const [workspaceDescription, setWorkspaceDescription] = useState(
    "AI sales agent that routes outreach through your team's relationship graph",
  );
  const [savingWorkspace, setSavingWorkspace] = useState(false);

  // Briefing state
  const [dailyEmailDigest, setDailyEmailDigest] = useState(false);
  const [savingBriefing, setSavingBriefing] = useState(false);

  // ICP save state
  const [savingIcp, setSavingIcp] = useState(false);

  useEffect(() => {
    // Load ICP + workspace data from API (DB-backed)
    fetch("/api/workspaces/current")
      .then((r) => r.json())
      .then((ws) => {
        if (ws.industry)
          setSelectedIndustries(
            ws.industry
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
          );
        if (ws.companySize)
          setSelectedSizes(
            ws.companySize
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
          );
        if (ws.region) setGeographies(ws.region);
        if (ws.name) setWorkspaceName(ws.name);
        if (ws.website) setWorkspaceWebsite(ws.website);
        if (ws.description) setWorkspaceDescription(ws.description);
        if (Array.isArray(ws.members)) {
          setTeamMembers(
            ws.members.map(
              (m: { id: string; role: string; user: { name: string | null; email: string } }) => ({
                id: m.id,
                role: m.role,
                user: m.user,
              }),
            ),
          );
        }
      })
      .catch(() => {
        // Fall back to localStorage for workspace fields
        try {
          const saved = localStorage.getItem("warmpath-workspace");
          if (saved) {
            const d = JSON.parse(saved);
            if (d.name) setWorkspaceName(d.name);
            if (d.website) setWorkspaceWebsite(d.website);
            if (d.description) setWorkspaceDescription(d.description);
          }
        } catch {}
      });

    // Load user preferences from API (DB-backed)
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((prefs) => {
        if (typeof prefs.dailyEmailDigest === "boolean")
          setDailyEmailDigest(prefs.dailyEmailDigest);
      })
      .catch(() => {});

    // Persona and signals remain localStorage-only
    try {
      const saved = localStorage.getItem("warmpath-persona-settings");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.tone) setPersonaTone(d.tone);
        if (d.style) setPersonaStyle(d.style);
        if (d.samples) setPersonaSamples(d.samples);
      }
    } catch {}
    try {
      const saved = localStorage.getItem("warmpath-signal-settings");
      if (saved) {
        const d = JSON.parse(saved);
        setEnabledSignals(d);
      }
    } catch {}

    // localStorage fallback for ICP fields not covered by DB columns
    try {
      const saved = localStorage.getItem("warmpath-icp-settings");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.selectedTech) setSelectedTech(d.selectedTech);
        if (d.jobTitles) setJobTitles(d.jobTitles);
        if (d.minRevenue) setMinRevenue(d.minRevenue);
        if (d.maxRevenue) setMaxRevenue(d.maxRevenue);
      }
    } catch {}
  }, []);

  const saveWorkspace = async () => {
    setSavingWorkspace(true);
    try {
      const res = await fetch("/api/workspaces/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName,
          website: workspaceWebsite,
          description: workspaceDescription,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Company info saved");
    } catch {
      // Fallback to localStorage if API fails
      try {
        localStorage.setItem(
          "warmpath-workspace",
          JSON.stringify({
            name: workspaceName,
            website: workspaceWebsite,
            description: workspaceDescription,
          }),
        );
      } catch {}
      toast.error("Failed to save company info");
    } finally {
      setSavingWorkspace(false);
    }
  };

  // Admin state
  const [clearingDemo, setClearingDemo] = useState(false);

  const clearDemoData = async () => {
    setClearingDemo(true);
    try {
      const res = await fetch("/api/admin/clear-demo-data", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const d = data.deleted ?? {};
      toast.success(
        `Demo data cleared — removed ${d.seed_contacts ?? 0} demo contacts, ${d.signals ?? 0} signals, ${d.seed_accounts ?? 0} accounts.`,
      );
    } catch (err) {
      toast.error(`Clear failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setClearingDemo(false);
    }
  };

  // Team state — loaded from API
  const [teamMembers, setTeamMembers] = useState<
    { id: string; role: string; user: { name: string | null; email: string } }[]
  >([]);

  const toggleItem = (item: string, selected: string[], setSelected: (s: string[]) => void) => {
    setSelected(selected.includes(item) ? selected.filter((i) => i !== item) : [...selected, item]);
  };

  return (
    <div className="p-6 space-y-5 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your ICP, AI writing persona, signals, and team.
        </p>
      </div>

      <Tabs defaultValue="icp">
        <TabsList className="h-8">
          <TabsTrigger value="icp" className="text-xs h-7">
            ICP Builder
          </TabsTrigger>
          <TabsTrigger value="persona" className="text-xs h-7">
            AI Persona
          </TabsTrigger>
          <TabsTrigger value="signals" className="text-xs h-7">
            Signals
          </TabsTrigger>
          <TabsTrigger value="team" className="text-xs h-7">
            Team
          </TabsTrigger>
        </TabsList>

        {/* ICP Builder */}
        <TabsContent value="icp" className="mt-4 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-brand" />
                Ideal Customer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-xs font-medium mb-2 block">Target industries</Label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.map((ind) => (
                    <button
                      type="button"
                      key={ind}
                      onClick={() => toggleItem(ind, selectedIndustries, setSelectedIndustries)}
                      className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                        selectedIndustries.includes(ind)
                          ? "bg-brand/10 text-brand border-brand/30"
                          : "border-border/60 text-muted-foreground hover:border-border"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Company size (employees)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMPANY_SIZES.map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => toggleItem(size, selectedSizes, setSelectedSizes)}
                      className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                        selectedSizes.includes(size)
                          ? "bg-brand/10 text-brand border-brand/30"
                          : "border-border/60 text-muted-foreground hover:border-border"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Min ARR ($M)</Label>
                  <Input
                    value={minRevenue}
                    onChange={(e) => setMinRevenue(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Max ARR ($M)</Label>
                  <Input
                    value={maxRevenue}
                    onChange={(e) => setMaxRevenue(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Target job titles</Label>
                <Textarea
                  value={jobTitles}
                  onChange={(e) => setJobTitles(e.target.value)}
                  className="text-sm resize-none h-16"
                  placeholder="VP of Sales, Head of Revenue..."
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Geographies</Label>
                <Input
                  value={geographies}
                  onChange={(e) => setGeographies(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="United States, Canada..."
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Tech stack signals</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TECH_STACKS.map((tech) => (
                    <button
                      type="button"
                      key={tech}
                      onClick={() => toggleItem(tech, selectedTech, setSelectedTech)}
                      className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                        selectedTech.includes(tech)
                          ? "bg-brand/10 text-brand border-brand/30"
                          : "border-border/60 text-muted-foreground hover:border-border"
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                disabled={savingIcp}
                onClick={async () => {
                  setSavingIcp(true);
                  try {
                    // Save DB-backed fields to workspace
                    await fetch("/api/workspaces/current", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        industry: selectedIndustries.join(", "),
                        companySize: selectedSizes.join(", "),
                        region: geographies,
                      }),
                    });
                    // Save remaining ICP fields to localStorage (no DB column yet)
                    localStorage.setItem(
                      "warmpath-icp-settings",
                      JSON.stringify({ selectedTech, jobTitles, minRevenue, maxRevenue }),
                    );
                    toast.success("ICP saved — agent will re-score all accounts");
                  } catch {
                    toast.error("Failed to save ICP");
                  } finally {
                    setSavingIcp(false);
                  }
                }}
              >
                {savingIcp ? "Saving..." : "Save ICP"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Persona */}
        <TabsContent value="persona" className="mt-4 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                AI Writing Persona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-3 rounded-lg bg-brand/5 border border-brand/20">
                <p className="text-xs text-brand">
                  The AI persona engine learns your writing style and generates messages that sound
                  exactly like you not generic templates.
                </p>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Tone</Label>
                <Select value={personaTone} onValueChange={setPersonaTone}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversational">
                      Conversational friendly, casual warmth
                    </SelectItem>
                    <SelectItem value="professional">Professional polished, formal</SelectItem>
                    <SelectItem value="direct">Direct concise, no fluff</SelectItem>
                    <SelectItem value="consultative">
                      Consultative insightful, thoughtful
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  Describe your writing style (optional)
                </Label>
                <Textarea
                  value={personaStyle}
                  onChange={(e) => setPersonaStyle(e.target.value)}
                  className="text-sm resize-none h-20"
                  placeholder="I write short, punchy messages. I reference specific things about the person's company. I avoid buzzwords like 'synergy'. I often open with a genuine compliment..."
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  Sample messages (paste 2-3 of your best outreach messages)
                </Label>
                <Textarea
                  value={personaSamples}
                  onChange={(e) => setPersonaSamples(e.target.value)}
                  className="text-sm resize-none h-28 font-mono text-xs"
                  placeholder="Paste your best cold/warm outreach messages here..."
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  These are used locally to calibrate tone never stored externally.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  localStorage.setItem(
                    "warmpath-persona-settings",
                    JSON.stringify({
                      tone: personaTone,
                      style: personaStyle,
                      samples: personaSamples,
                    }),
                  );
                  toast.success("Persona saved — AI will use this voice going forward");
                }}
              >
                Save persona
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signals */}
        <TabsContent value="signals" className="mt-4 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/50">
                <div>
                  <p className="text-sm font-medium">Daily email briefing</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receive a morning digest of top signals and warm path opportunities.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingBriefing}
                  onClick={async () => {
                    const next = !dailyEmailDigest;
                    setSavingBriefing(true);
                    try {
                      const res = await fetch("/api/user/preferences", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ dailyEmailDigest: next }),
                      });
                      if (!res.ok) throw new Error("Failed");
                      setDailyEmailDigest(next);
                      toast.success(next ? "Daily briefing enabled" : "Daily briefing disabled");
                    } catch {
                      toast.error("Failed to update briefing preference");
                    } finally {
                      setSavingBriefing(false);
                    }
                  }}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    dailyEmailDigest ? "bg-primary" : "bg-muted"
                  } ${savingBriefing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#e5e1e4] shadow transition-transform ${
                      dailyEmailDigest ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Signal detection settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SIGNAL_TYPES.map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm">{signal.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEnabledSignals((s) => ({ ...s, [signal.id]: !s[signal.id] }));
                    }}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      enabledSignals[signal.id] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#e5e1e4] shadow transition-transform ${
                        enabledSignals[signal.id] ? "left-4" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                className="mt-2"
                onClick={() => {
                  localStorage.setItem("warmpath-signal-settings", JSON.stringify(enabledSignals));
                  toast.success("Signal preferences saved");
                }}
              >
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="mt-4 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamMembers.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">No team members yet.</p>
              )}
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50"
                >
                  <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">
                    {(member.user.name ?? member.user.email)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{member.user.name ?? member.user.email}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="mt-1"
                onClick={() =>
                  toast.info(
                    "Invite sent! They'll connect their LinkedIn to expand the relationship graph.",
                  )
                }
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Invite team member
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                Admin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <Trash2 className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Clear demo data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Removes seed contacts (Samantha Torres etc.), demo accounts, all signals, and
                    stale warm paths. Your real Google-imported contacts and relationship edges are
                    never touched.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs flex-shrink-0"
                  disabled={clearingDemo}
                  onClick={clearDemoData}
                >
                  {clearingDemo ? "Clearing…" : "Clear"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Company name</Label>
                  <Input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Website</Label>
                  <Input
                    value={workspaceWebsite}
                    onChange={(e) => setWorkspaceWebsite(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  One-liner (used in intro requests)
                </Label>
                <Input
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={saveWorkspace} disabled={savingWorkspace}>
                {savingWorkspace ? "Saving..." : "Save"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
