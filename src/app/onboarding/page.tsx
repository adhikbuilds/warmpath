"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle,
  GitFork,
  Sparkles,
  Target,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";

const STEPS = [
  { id: "welcome", title: "Welcome to WarmPath", icon: Sparkles },
  { id: "company", title: "Your company", icon: Building2 },
  { id: "icp", title: "Define your ICP", icon: Target },
  { id: "persona", title: "Your writing voice", icon: Users },
  { id: "import", title: "Import accounts", icon: Upload },
  { id: "connect", title: "Connect LinkedIn", icon: GitFork },
  { id: "signals", title: "Signal preferences", icon: Zap },
  { id: "done", title: "You're all set!", icon: CheckCircle },
];

const INDUSTRIES = [
  "SaaS",
  "Fintech",
  "Healthcare",
  "E-commerce",
  "Enterprise Software",
  "Cybersecurity",
  "HR Tech",
  "MarTech",
];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-2000", "2000+"];
const TONES = [
  { id: "conversational", label: "Conversational", desc: "Friendly and warm, like a colleague" },
  { id: "professional", label: "Professional", desc: "Polished and formal, boardroom-ready" },
  { id: "direct", label: "Direct", desc: "Short, punchy, no fluff" },
  { id: "consultative", label: "Consultative", desc: "Thoughtful and insight-driven" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [jobTitles, setJobTitles] = useState("");
  const [tone, setTone] = useState("conversational");
  const [writingSample, setWritingSample] = useState("");
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [importMethod, setImportMethod] = useState<string | null>(null);

  const toggleItem = (item: string, selected: string[], setSelected: (s: string[]) => void) => {
    setSelected(selected.includes(item) ? selected.filter((i) => i !== item) : [...selected, item]);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const renderStep = () => {
    switch (STEPS[step].id) {
      case "welcome":
        return (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
              <GitFork className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Welcome, {user?.name?.split(" ")[0] ?? "there"}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm leading-relaxed">
                WarmPath turns your team's relationship graph into your biggest competitive
                advantage. Let's get you set up in under 5 minutes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center">
              {[
                { stat: "5×", label: "higher reply rate" },
                { stat: "47%", label: "close rate" },
                { stat: "5 min", label: "setup time" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-lg border border-border/60 bg-muted/20"
                >
                  <div className="text-lg font-bold text-brand">{item.stat}</div>
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-left max-w-xs mx-auto">
              {[
                "Map your team's full relationship graph",
                "Auto-detect warm paths to every prospect",
                "Generate AI messages in your exact voice",
                "Approve in one click send in seconds",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        );

      case "company":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Tell us about your company</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This helps WarmPath craft relevant, personalized outreach.
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Company name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-9"
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Website</Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="h-9"
                placeholder="acme.com"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">One-liner pitch</Label>
              <Textarea
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                className="resize-none h-16 text-sm"
                placeholder="We help enterprise revenue teams close more deals by automating warm intro routing..."
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Used in intro request messages to your connectors.
              </p>
            </div>
          </div>
        );

      case "icp":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Define your ideal customer</h2>
              <p className="text-sm text-muted-foreground mt-1">
                WarmPath will score every account against this profile automatically.
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">Target industries</Label>
              <div className="flex flex-wrap gap-1.5">
                {INDUSTRIES.map((ind) => (
                  <button
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
              <Label className="text-xs font-medium mb-2 block">Company size</Label>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map((size) => (
                  <button
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
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                Target job titles (comma-separated)
              </Label>
              <Textarea
                value={jobTitles}
                onChange={(e) => setJobTitles(e.target.value)}
                className="resize-none h-14 text-sm"
                placeholder="VP of Sales, Head of Revenue, CRO..."
              />
            </div>
          </div>
        );

      case "persona":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Your AI writing voice</h2>
              <p className="text-sm text-muted-foreground mt-1">
                WarmPath writes messages that sound exactly like you not a robot.
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium mb-2 block">Communication tone</Label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      tone === t.id
                        ? "border-brand/40 bg-brand/5"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    <p className="text-xs font-semibold">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                Paste a sample message (optional but recommended)
              </Label>
              <Textarea
                value={writingSample}
                onChange={(e) => setWritingSample(e.target.value)}
                className="resize-none h-24 text-sm font-mono text-xs"
                placeholder="Hey Marcus noticed Finpilot just closed a Series B. Congrats! I've been following..."
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                The AI learns your patterns from this. More samples = better mimicry.
              </p>
            </div>
          </div>
        );

      case "import":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Import your target accounts</h2>
              <p className="text-sm text-muted-foreground mt-1">
                WarmPath will enrich, score, and find warm paths for every account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: "csv",
                  label: "Upload CSV",
                  desc: "Company names, domains, contacts",
                  icon: Upload,
                },
                {
                  id: "hubspot",
                  label: "From HubSpot",
                  desc: "Import existing CRM accounts",
                  icon: Building2,
                },
                {
                  id: "salesforce",
                  label: "From Salesforce",
                  desc: "Sync your opportunity pipeline",
                  icon: Building2,
                },
                {
                  id: "manual",
                  label: "Add manually",
                  desc: "Type accounts one by one",
                  icon: Users,
                },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    setImportMethod(method.id);
                    if (method.id !== "manual") {
                      toast.info(`${method.label} integration available on Growth plan`);
                    }
                  }}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    importMethod === method.id
                      ? "border-brand/40 bg-brand/5"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  <method.icon className="w-5 h-5 text-brand mb-2" />
                  <p className="text-sm font-semibold">{method.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{method.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Skip for now we've pre-loaded 10 demo accounts for you to explore.
            </p>
          </div>
        );

      case "connect":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Connect LinkedIn</h2>
              <p className="text-sm text-muted-foreground mt-1">
                LinkedIn is the backbone of the relationship graph. Connect your profile to map your
                1st and 2nd-degree connections.
              </p>
            </div>
            <Card
              className={`border-2 transition-colors ${linkedinConnected ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60"}`}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0077B5]/10 flex items-center justify-center text-[#0077B5] font-bold text-sm flex-shrink-0">
                  in
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">LinkedIn</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {linkedinConnected
                      ? "Connected 847 connections mapped, 23 warm paths discovered"
                      : "Maps your connections to discover warm paths to prospects"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={linkedinConnected ? "outline" : "default"}
                  onClick={() => {
                    setLinkedinConnected(true);
                    toast.success("LinkedIn connected mapping 847 connections...");
                  }}
                >
                  {linkedinConnected ? (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Connected
                    </span>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Also add team members to expand the graph:
              </p>
              {["Sarah Chen (1,240 connections)", "Rohan Mehta (634 connections)"].map((member) => (
                <div
                  key={member}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 text-sm"
                >
                  <span>{member}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs"
                    onClick={() => toast.success(`Invite sent to ${member.split(" ")[0]}`)}
                  >
                    Invite
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              You can skip and connect later from Settings → Team.
            </p>
          </div>
        );

      case "signals":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Signal preferences</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which buying signals trigger your agent to take action.
              </p>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Funding rounds", desc: "Company raises Series A/B/C", recommended: true },
                {
                  label: "Hiring signals",
                  desc: "Posting VP Sales / RevOps roles",
                  recommended: true,
                },
                {
                  label: "Pricing page visits",
                  desc: "Intent signal high urgency",
                  recommended: true,
                },
                { label: "Leadership changes", desc: "New CRO/VP Sales hired", recommended: true },
                {
                  label: "Champion job change",
                  desc: "Your warm contact moves companies",
                  recommended: true,
                },
                {
                  label: "G2 / review site activity",
                  desc: "Researching competitors",
                  recommended: false,
                },
                {
                  label: "Tech stack changes",
                  desc: "Adopting or dropping relevant tools",
                  recommended: false,
                },
              ].map((signal) => (
                <div
                  key={signal.label}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{signal.label}</span>
                      {signal.recommended && (
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-brand/10 text-brand border-brand/20"
                        >
                          recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{signal.desc}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Change these anytime in Settings → Signals.
            </p>
          </div>
        );

      case "done":
        return (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">You're all set!</h2>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm leading-relaxed">
                WarmPath has mapped your relationship graph, scored your accounts, and queued your
                first AI-generated outreach for approval.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {[
                { value: "10", label: "Accounts scored" },
                { value: "5", label: "Warm paths found" },
                { value: "5", label: "Messages queued" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center"
                >
                  <div className="text-lg font-bold text-emerald-500">{item.value}</div>
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-left max-w-xs mx-auto">
              <p className="text-xs font-semibold text-center mb-3">
                Your first week with WarmPath:
              </p>
              {[
                { day: "Today", action: "Review 5 queued messages in the approval queue" },
                { day: "Day 2", action: "Explore your relationship graph spot the warm paths" },
                { day: "Day 3", action: "Launch your first warm outbound campaign" },
                { day: "Day 7", action: "Review first reply stats and signal feed" },
              ].map((item) => (
                <div key={item.day} className="flex items-start gap-2 text-xs">
                  <span className="text-brand font-medium w-12 flex-shrink-0">{item.day}</span>
                  <span className="text-muted-foreground">{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-xs font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
            </div>
          ))}
        </div>

        <Card className="border-border/60">
          <CardContent className="p-6">
            {renderStep()}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === 0) {
                    router.push("/dashboard");
                  } else {
                    setStep((s) => s - 1);
                  }
                }}
              >
                {step === 0 ? "Skip tour" : "Back"}
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  if (isLastStep) {
                    router.push("/dashboard");
                  } else {
                    next();
                  }
                }}
              >
                {isLastStep ? (
                  <>
                    Go to dashboard
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
