"use client";

import { Building2, Settings, Sparkles, Target, Users } from "lucide-react";
import { useState } from "react";
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
      if (!res.ok) throw new Error("Save failed");
      toast.success("Company info saved");
    } catch {
      toast.error("Failed to save company info");
    } finally {
      setSavingWorkspace(false);
    }
  };

  // Team state
  const [teamMembers] = useState([
    { id: "1", name: "Adhik Agarwal", email: "adhik@warmpath.ai", role: "Admin", connections: 847 },
    { id: "2", name: "Sarah Chen", email: "sarah@warmpath.ai", role: "Member", connections: 1240 },
    { id: "3", name: "Rohan Mehta", email: "rohan@warmpath.ai", role: "Member", connections: 634 },
  ]);

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
                onClick={() => toast.success("ICP saved agent will re-score all accounts")}
              >
                Save ICP
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
                onClick={() =>
                  toast.success("Persona saved AI will use this voice going forward")
                }
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
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        enabledSignals[signal.id] ? "left-4" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                className="mt-2"
                onClick={() => toast.success("Signal preferences saved")}
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
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50"
                >
                  <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">
                    {member.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{member.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.email} · {member.connections} LinkedIn connections
                    </p>
                  </div>
                  {member.id !== "1" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => toast.info("Remove team member?")}
                    >
                      Remove
                    </Button>
                  )}
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
