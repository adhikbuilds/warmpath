"use client";

import {
  Activity,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  Globe,
  Import,
  Loader2,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { useSalesStore } from "@/stores/salesStore";

// ── Filter option lists ───────────────────────────────────────────────────────

const INDUSTRIES = [
  "B2B SaaS",
  "FinTech",
  "DevTools",
  "HR Tech",
  "Marketing Tech",
  "Cybersecurity",
  "E-commerce",
  "Healthcare Tech",
  "EdTech",
  "Sales Tech",
  "RevOps",
  "PropTech",
];

const SENIORITY_LEVELS = ["C-Suite", "VP", "Director", "Manager", "IC"];

const COMPANY_SIZES = [
  { label: "1–10", value: "1-10" },
  { label: "11–50", value: "11-50" },
  { label: "51–200", value: "51-200" },
  { label: "201–500", value: "201-500" },
  { label: "501–1k", value: "501-1000" },
  { label: "1000+", value: "1000+" },
];

const FUNDING_STAGES = [
  "Bootstrapped",
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Public",
];

const TECH_STACK = [
  "Salesforce",
  "HubSpot",
  "Outreach",
  "Salesloft",
  "ZoomInfo",
  "Apollo",
  "Slack",
  "Jira",
  "GitHub",
  "Stripe",
  "Intercom",
  "Segment",
];

const LOCATIONS = [
  "United States",
  "United Kingdom",
  "India",
  "Canada",
  "Australia",
  "Germany",
  "Singapore",
  "UAE",
  "Israel",
  "France",
];

// ── Website visitor demo data ─────────────────────────────────────────────────

interface WebsiteVisitor {
  id: string;
  company: string;
  domain: string;
  industry: string;
  size: string;
  location: string;
  funding: string;
  pages_visited: string[];
  session_duration: string;
  visit_count: number;
  last_visit: string;
  intent_score: number;
  warm_path: { via: string; strength: "strong" | "moderate" } | null;
  converted: boolean;
}

const DEMO_VISITORS: WebsiteVisitor[] = [
  {
    id: "v-1",
    company: "Gong.io",
    domain: "gong.io",
    industry: "Sales Tech",
    size: "501-1000",
    location: "San Francisco, CA",
    funding: "Series D",
    pages_visited: ["/pricing", "/demo", "/case-studies", "/integrations"],
    session_duration: "8m 12s",
    visit_count: 6,
    last_visit: "38 min ago",
    intent_score: 97,
    warm_path: { via: "Adhik Agarwal → Ravi Shankar (CRO)", strength: "strong" },
    converted: false,
  },
  {
    id: "v-2",
    company: "Stripe Inc.",
    domain: "stripe.com",
    industry: "FinTech",
    size: "1000+",
    location: "San Francisco, CA",
    funding: "Public",
    pages_visited: ["/pricing", "/integrations", "/demo"],
    session_duration: "4m 32s",
    visit_count: 3,
    last_visit: "2 hr ago",
    intent_score: 94,
    warm_path: { via: "Sarah Chen → Alex Thompson (VP Sales)", strength: "strong" },
    converted: false,
  },
  {
    id: "v-3",
    company: "Loom Inc.",
    domain: "loom.com",
    industry: "B2B SaaS",
    size: "51-200",
    location: "New York, NY",
    funding: "Series B",
    pages_visited: ["/pricing", "/integrations"],
    session_duration: "3m 44s",
    visit_count: 4,
    last_visit: "3 hr ago",
    intent_score: 88,
    warm_path: { via: "Maya Iyer → James Park (VP Sales)", strength: "strong" },
    converted: false,
  },
  {
    id: "v-4",
    company: "Notion Labs",
    domain: "notion.so",
    industry: "B2B SaaS",
    size: "201-500",
    location: "San Francisco, CA",
    funding: "Series C+",
    pages_visited: ["/pricing", "/case-studies"],
    session_duration: "2m 18s",
    visit_count: 2,
    last_visit: "5 hr ago",
    intent_score: 81,
    warm_path: { via: "Rohan Mehta → Divya Kapoor (Head of Revenue)", strength: "moderate" },
    converted: false,
  },
  {
    id: "v-5",
    company: "Amplitude Inc.",
    domain: "amplitude.com",
    industry: "Marketing Tech",
    size: "501-1000",
    location: "San Francisco, CA",
    funding: "Public",
    pages_visited: ["/pricing", "/demo"],
    session_duration: "5m 01s",
    visit_count: 2,
    last_visit: "8 hr ago",
    intent_score: 76,
    warm_path: { via: "Sarah Chen → Mike Lee (Head of Partnerships)", strength: "moderate" },
    converted: false,
  },
  {
    id: "v-6",
    company: "Figma Inc.",
    domain: "figma.com",
    industry: "DevTools",
    size: "501-1000",
    location: "San Francisco, CA",
    funding: "Public",
    pages_visited: ["/demo"],
    session_duration: "1m 05s",
    visit_count: 1,
    last_visit: "11 hr ago",
    intent_score: 62,
    warm_path: null,
    converted: false,
  },
  {
    id: "v-7",
    company: "Lattice HQ",
    domain: "lattice.com",
    industry: "HR Tech",
    size: "201-500",
    location: "San Francisco, CA",
    funding: "Series F",
    pages_visited: ["/integrations"],
    session_duration: "1m 22s",
    visit_count: 1,
    last_visit: "1 day ago",
    intent_score: 48,
    warm_path: null,
    converted: false,
  },
  {
    id: "v-8",
    company: "Linear App",
    domain: "linear.app",
    industry: "DevTools",
    size: "11-50",
    location: "San Francisco, CA",
    funding: "Series A",
    pages_visited: ["/pricing"],
    session_duration: "0m 58s",
    visit_count: 1,
    last_visit: "2 days ago",
    intent_score: 55,
    warm_path: null,
    converted: false,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface DiscoveredLead {
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  description?: string;
  employee_count_estimate?: number;
  technologies: string[];
  emails_found: string[];
  linkedin_url?: string;
  fit_score_estimate: number;
  source: string;
  funding_stage?: string;
  city?: string;
  country?: string;
}

// ── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
        selected
          ? "bg-[#8083ff]/12 text-[#4edea3] border-brand/40"
          : "bg-transparent text-muted-foreground border-border/50 hover:border-brand/30 hover:text-foreground"
      }`}
    >
      {label}
      {selected && <X className="w-2.5 h-2.5 flex-shrink-0" />}
    </button>
  );
}

// ── Fit score bar ─────────────────────────────────────────────────────────────

function FitBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-400";
  const label = score >= 80 ? "Strong fit" : score >= 60 ? "Moderate fit" : "Weak fit";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <TrendingUp className="w-2.5 h-2.5" />
          AI Fit Score
        </span>
        <span className="text-[10px] font-semibold">{score}%</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Lead card ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  idx,
  isImported,
  isImporting,
  onImport,
}: {
  lead: DiscoveredLead;
  idx: number;
  isImported: boolean;
  isImporting: boolean;
  onImport: (lead: DiscoveredLead, idx: number) => void;
}) {
  const visibleTechs = lead.technologies?.slice(0, 3) ?? [];
  const extraTechCount = (lead.technologies?.length ?? 0) - visibleTechs.length;

  return (
    <Card className="border-border/60 hover:border-brand/30 transition-colors flex flex-col">
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#8083ff]/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#4edea3]">
              {lead.name?.[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{lead.name}</p>
              {lead.domain && (
                <p className="text-[10px] text-muted-foreground truncate">{lead.domain}</p>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] flex-shrink-0 bg-violet-500/10 text-violet-500 border-violet-500/20"
          >
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            Apollo DB
          </Badge>
        </div>

        <div className="space-y-1">
          {(lead.industry || lead.city || lead.country) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {[lead.industry, lead.city, lead.country].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          {lead.employee_count_estimate && lead.employee_count_estimate > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>~{lead.employee_count_estimate.toLocaleString()} employees</span>
            </div>
          ) : null}
          {lead.funding_stage && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="w-3 h-3 flex-shrink-0" />
              <span>{lead.funding_stage}</span>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="w-3 h-3 flex-shrink-0" />
              <a
                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-[#4edea3] transition-colors"
              >
                {lead.website}
              </a>
            </div>
          )}
        </div>

        {lead.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {lead.description}
          </p>
        )}

        {visibleTechs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTechs.map((tech) => (
              <span
                key={tech}
                className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
              >
                {tech}
              </span>
            ))}
            {extraTechCount > 0 && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                +{extraTechCount} more
              </span>
            )}
          </div>
        )}

        <FitBar score={lead.fit_score_estimate ?? 0} />

        <div className="mt-auto pt-1">
          {isImported ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Added to pipeline
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              disabled={isImporting}
              onClick={() => onImport(lead, idx)}
            >
              {isImporting ? (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
              ) : (
                <Import className="w-3 h-3 mr-1.5" />
              )}
              Import to Pipeline
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-lg bg-muted animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-muted rounded animate-pulse w-2/3" />
            <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
        </div>
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="flex gap-1">
          <div className="h-4 bg-muted rounded animate-pulse w-14" />
          <div className="h-4 bg-muted rounded animate-pulse w-10" />
          <div className="h-4 bg-muted rounded animate-pulse w-16" />
        </div>
        <div className="h-7 bg-muted rounded animate-pulse w-full" />
      </CardContent>
    </Card>
  );
}

// ── Visitor intent badge ──────────────────────────────────────────────────────

function IntentBadge({ score }: { score: number }) {
  if (score >= 85)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        <Activity className="w-2.5 h-2.5" />
        High intent
      </span>
    );
  if (score >= 65)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
        <Activity className="w-2.5 h-2.5" />
        Medium
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted border border-border/50 px-2 py-0.5 rounded-full">
      <Activity className="w-2.5 h-2.5" />
      Low
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter();
  const { addAccount, addContact, addWarmPath } = useSalesStore();
  const [activeTab, setActiveTab] = useState<"search" | "visitors">("visitors");

  // ── Search filters ──────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSeniority, setSelectedSeniority] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFunding, setSelectedFunding] = useState<string[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [hiringSignals, setHiringSignals] = useState(false);
  const [resultCount, setResultCount] = useState("10");

  // ── Search results ──────────────────────────────────────────────────────────
  const [searching, setSearching] = useState(false);
  const [leads, setLeads] = useState<DiscoveredLead[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── Visitors — demo sample data shown to demo@warmpath.ai only ──
  const { user } = useAuthStore();
  const isDemoVisitors = user?.email === "demo@warmpath.ai";
  const [visitors, setVisitors] = useState(isDemoVisitors ? DEMO_VISITORS : []);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<Set<string>>(new Set());
  const [bulkConverting, setBulkConverting] = useState(false);

  function toggleVisitorSelected(id: string) {
    setSelectedVisitorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllUnconverted() {
    const unconverted = visitors.filter((v) => !v.converted).map((v) => v.id);
    const allSelected =
      unconverted.length > 0 && unconverted.every((id) => selectedVisitorIds.has(id));
    setSelectedVisitorIds(allSelected ? new Set() : new Set(unconverted));
  }

  const activeFiltersCount = [
    ...selectedIndustries,
    ...selectedSeniority,
    ...selectedSizes,
    ...selectedFunding,
    ...selectedTechs,
    ...(selectedLocation ? [selectedLocation] : []),
    ...(hiringSignals ? ["hiring"] : []),
  ].length;

  const clearFilters = () => {
    setSelectedIndustries([]);
    setSelectedSeniority([]);
    setSelectedSizes([]);
    setSelectedFunding([]);
    setSelectedTechs([]);
    setSelectedLocation("");
    setHiringSignals(false);
    setKeyword("");
  };

  function toggleFilter(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const handleSearch = async () => {
    const hasQuery = keyword.trim() || activeFiltersCount > 0;
    if (!hasQuery) return;
    setSearching(true);
    setLeads([]);
    setHasSearched(true);
    setImportedIds(new Set());
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            keyword || (selectedIndustries.length > 0 ? selectedIndustries.join(", ") : "B2B SaaS"),
          location: selectedLocation || "United States",
          limit: Number(resultCount),
          filters: {
            industries: selectedIndustries,
            seniority: selectedSeniority,
            company_sizes: selectedSizes,
            funding_stages: selectedFunding,
            technologies: selectedTechs,
            hiring_signals: hiringSignals,
          },
        }),
      });
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      toast.error("Discovery search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (lead: DiscoveredLead, idx: number) => {
    setImportingId(String(idx));
    try {
      const res = await fetch("/api/discovery/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: [lead], stage: "prospect" }),
      });
      if (res.ok) {
        setImportedIds((prev) => new Set([...prev, String(idx)]));
        toast.success(`${lead.name} added to pipeline`);
        useSalesStore.getState().reset();
        setTimeout(() => useSalesStore.getState().initialize(), 100);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImportingId(null);
    }
  };

  const handleImportAll = async () => {
    const unimported = leads.filter((_, i) => !importedIds.has(String(i)));
    if (!unimported.length) return;
    setImportingAll(true);
    try {
      const res = await fetch("/api/discovery/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: unimported, stage: "prospect" }),
      });
      const data = await res.json();
      setImportedIds(new Set(leads.map((_, i) => String(i))));
      toast.success(`${data.imported ?? unimported.length} companies added to pipeline`);
      setTimeout(() => {
        useSalesStore.getState().reset();
        useSalesStore.getState().initialize();
      }, 100);
    } catch {
      toast.error("Bulk import failed");
    } finally {
      setImportingAll(false);
    }
  };

  const handleConvertVisitor = async (visitor: WebsiteVisitor) => {
    setConvertingId(visitor.id);
    await new Promise((r) => setTimeout(r, 800));

    const accountId = `acc-vis-${visitor.id}-${Date.now()}`;
    const contactId = `con-vis-${visitor.id}-${Date.now()}`;
    const warmPathId = `wp-vis-${visitor.id}-${Date.now()}`;

    addAccount({
      name: visitor.company,
      domain: visitor.domain,
      industry: visitor.industry,
      employee_count: parseInt(visitor.size.split("-")[0].replace("+", ""), 10) || 50,
      location: visitor.location,
      description: `Identified via website visitor tracking. Visited ${visitor.pages_visited.join(", ")}.`,
      stage: "prospect",
      fit_score: visitor.intent_score,
      intent_score: visitor.intent_score,
      warmth_score: visitor.warm_path ? (visitor.warm_path.strength === "strong" ? 85 : 60) : 20,
      opportunity_score: visitor.intent_score,
    });

    addContact({
      account_id: accountId,
      name: visitor.warm_path
        ? (visitor.warm_path.via.split("→").pop()?.trim().split(" (")[0] ?? "Key Contact")
        : "Key Contact",
      email: `contact@${visitor.domain}`,
      title: visitor.warm_path
        ? (visitor.warm_path.via.split("(").pop()?.replace(")", "") ?? "Revenue Leader")
        : "Revenue Leader",
      seniority: "vp",
      department: "Revenue",
      persona: "Revenue Leader",
      fit_score: visitor.intent_score,
      warmth_score: visitor.warm_path ? (visitor.warm_path.strength === "strong" ? 85 : 60) : 20,
      engagement_score: visitor.intent_score,
    });

    if (visitor.warm_path) {
      const introVia = visitor.warm_path.via.split("→")[0].trim();
      addWarmPath({
        id: warmPathId,
        account_id: accountId,
        contact_id: contactId,
        path_nodes: [
          { id: "team-1", name: introVia, type: "team_member" },
          {
            id: contactId,
            name: visitor.warm_path.via.split("→").pop()?.trim().split(" (")[0] ?? "Contact",
            type: "contact",
          },
        ],
        path_explanation: `${introVia} has a direct connection to the decision-maker at ${visitor.company}.`,
        warmth_score: visitor.warm_path.strength === "strong" ? 85 : 60,
        confidence_score: visitor.warm_path.strength === "strong" ? 90 : 70,
        recommended_intro_person: introVia,
        recommended_channel: "linkedin",
        status: "active",
      });
    }

    setVisitors((prev) => prev.map((v) => (v.id === visitor.id ? { ...v, converted: true } : v)));
    setConvertingId(null);
    // Auto-navigate to Warm Leads after 2s and the new lead is highlighted there
    toast.success(`${visitor.company} added as warm lead`, {
      description: visitor.warm_path ? "Navigating to Warm Leads in 2 s…" : "Added to pipeline",
    });
    setTimeout(() => {
      router.push(`/warm-leads?highlight=${accountId}`);
    }, 2000);
  };

  const handleBulkConvertVisitors = async () => {
    const toConvert = visitors.filter((v) => selectedVisitorIds.has(v.id) && !v.converted);
    if (!toConvert.length) return;
    setBulkConverting(true);
    for (const v of toConvert) {
      await handleConvertVisitor(v);
    }
    setSelectedVisitorIds(new Set());
    setBulkConverting(false);
    toast.success(`${toConvert.length} visitors added to Warm Leads`);
  };

  const unimportedCount = leads.filter((_, i) => !importedIds.has(String(i))).length;
  const highIntentVisitors = visitors.filter((v) => v.intent_score >= 80 && !v.converted).length;

  return (
    <div
      className="p-6 space-y-5 max-w-[1400px] mx-auto"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#4edea3]" />
            Lead Discovery
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Find ICP prospects with Apollo-grade filters · identify anonymous website visitors
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs bg-violet-500/10 text-violet-500 border-violet-500/20"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Apollo DB
          </Badge>
          <Badge
            variant="outline"
            className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          >
            AI Enrichment
          </Badge>
          <Badge
            variant="outline"
            className="text-xs bg-[#8083ff]/10 text-[#4edea3] border-brand/20"
          >
            <Eye className="w-3 h-3 mr-1" />
            Visitor ID
          </Badge>
        </div>
      </div>

      {/* ── Tab switcher ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("visitors")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === "visitors"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Website Visitors
          {highIntentVisitors > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#8083ff] text-white text-[10px] font-bold flex items-center justify-center">
              {highIntentVisitors}
            </span>
          )}
          {isDemoVisitors && (
            <span className="text-[9px] font-medium border border-amber-500/40 text-amber-500 bg-amber-500/10 rounded px-1 py-0.5">
              Sample
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === "search"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Prospect Search
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          WEBSITE VISITORS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "visitors" && (
        <>
          {/* USP hero */}
          <div className="rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/6 to-brand/2 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-[#4edea3]" />
                <span className="text-xs font-semibold text-[#4edea3] uppercase tracking-wider">
                  WarmBlue USP
                </span>
              </div>
              <p className="text-lg font-bold leading-snug">
                Turn anonymous website visitors into warm leads — before they leave
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
                We deanonymize companies visiting your site, score their intent based on pages
                viewed, and surface a warm intro path through your team's network — so your first
                touch is always warm.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <div className="text-center px-4 py-2.5 rounded-xl bg-background border border-border/60">
                <p className="text-2xl font-bold text-[#4edea3]">
                  {visitors.filter((v) => !v.converted).length}
                </p>
                <p className="text-[11px] text-muted-foreground">new visitors</p>
              </div>
              <div className="text-center px-4 py-2.5 rounded-xl bg-background border border-border/60">
                <p className="text-2xl font-bold text-emerald-500">
                  {visitors.filter((v) => v.warm_path && !v.converted).length}
                </p>
                <p className="text-[11px] text-muted-foreground">have warm path</p>
              </div>
            </div>
          </div>

          {/* Visitors table */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#4edea3]" />
                  Identified Visitors
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-muted text-muted-foreground ml-1"
                  >
                    Last 7 days
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    {visitors.filter((v) => v.converted).length} converted ·{" "}
                    {visitors.filter((v) => !v.converted).length} pending
                  </p>
                  {selectedVisitorIds.size > 0 && (
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1.5 bg-[#4edea3] text-black hover:bg-[#4edea3]/90"
                      disabled={bulkConverting}
                      onClick={handleBulkConvertVisitors}
                    >
                      {bulkConverting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      Add {selectedVisitorIds.size} to Warm Leads
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          aria-label="Select all unconverted visitors"
                          checked={
                            visitors.filter((v) => !v.converted).length > 0 &&
                            visitors
                              .filter((v) => !v.converted)
                              .every((v) => selectedVisitorIds.has(v.id))
                          }
                          onChange={selectAllUnconverted}
                          className="accent-[#4edea3]"
                        />
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                        Company
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">
                        Pages visited
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">
                        Activity
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">
                        Intent
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 min-w-[200px]">
                        Warm path
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((v) => (
                      <tr
                        key={v.id}
                        className={`border-b border-border/40 last:border-0 transition-colors hover:bg-muted/20 ${
                          v.converted ? "opacity-50" : ""
                        } ${selectedVisitorIds.has(v.id) ? "bg-[#4edea3]/5" : ""}`}
                      >
                        <td className="px-4 py-3.5">
                          {!v.converted && (
                            <input
                              type="checkbox"
                              aria-label={`Select ${v.company}`}
                              checked={selectedVisitorIds.has(v.id)}
                              onChange={() => toggleVisitorSelected(v.id)}
                              className="accent-[#4edea3]"
                            />
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#8083ff]/10 flex items-center justify-center text-xs font-bold text-[#4edea3] flex-shrink-0">
                              {v.company[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{v.company}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground">
                                  {v.domain}
                                </span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {v.industry}
                                </span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {v.size} emp
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {v.pages_visited.map((page) => (
                              <span
                                key={page}
                                className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono"
                              >
                                {page}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium">
                            {v.visit_count} visit{v.visit_count !== 1 ? "s" : ""}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {v.session_duration} · {v.last_visit}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-1.5">
                            <IntentBadge score={v.intent_score} />
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  v.intent_score >= 85
                                    ? "bg-emerald-500"
                                    : v.intent_score >= 65
                                      ? "bg-yellow-500"
                                      : "bg-slate-400"
                                }`}
                                style={{ width: `${v.intent_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {v.warm_path ? (
                            <div className="space-y-1">
                              <div
                                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  v.warm_path.strength === "strong"
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-yellow-500/10 text-yellow-600"
                                }`}
                              >
                                <Zap className="w-2.5 h-2.5" />
                                {v.warm_path.strength === "strong"
                                  ? "Strong path"
                                  : "Moderate path"}
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-snug">
                                {v.warm_path.via}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              No warm path found
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {v.converted ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Converted
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant={v.warm_path ? "default" : "outline"}
                              className="h-7 text-xs whitespace-nowrap gap-1.5"
                              disabled={convertingId === v.id}
                              onClick={() => handleConvertVisitor(v)}
                            >
                              {convertingId === v.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Zap className="w-3 h-3" />
                              )}
                              {v.warm_path ? "Create Warm Lead" : "Add to Pipeline"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PROSPECT SEARCH TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "search" && (
        <>
          {/* Filter panel */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#4edea3]" />
                  Apollo-style Filters
                </CardTitle>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear all ({activeFiltersCount})
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Row 1: Keyword + Location + Count + Search */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Job title, company name, or keywords…"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={resultCount} onValueChange={setResultCount}>
                  <SelectTrigger className="w-[110px] h-9 text-sm">
                    <SelectValue placeholder="Results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 results</SelectItem>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSearch}
                  disabled={searching || (!keyword.trim() && activeFiltersCount === 0)}
                  className="h-9 gap-2"
                >
                  {searching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {searching ? "Searching…" : "Search"}
                </Button>
              </div>

              {/* Industry */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Industry
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.map((ind) => (
                    <FilterChip
                      key={ind}
                      label={ind}
                      selected={selectedIndustries.includes(ind)}
                      onToggle={() => toggleFilter(selectedIndustries, setSelectedIndustries, ind)}
                    />
                  ))}
                </div>
              </div>

              {/* Seniority + Company Size */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Seniority
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SENIORITY_LEVELS.map((s) => (
                      <FilterChip
                        key={s}
                        label={s}
                        selected={selectedSeniority.includes(s)}
                        onToggle={() => toggleFilter(selectedSeniority, setSelectedSeniority, s)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Company Size
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPANY_SIZES.map((sz) => (
                      <FilterChip
                        key={sz.value}
                        label={sz.label}
                        selected={selectedSizes.includes(sz.value)}
                        onToggle={() => toggleFilter(selectedSizes, setSelectedSizes, sz.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Funding Stage */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Funding Stage
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FUNDING_STAGES.map((f) => (
                    <FilterChip
                      key={f}
                      label={f}
                      selected={selectedFunding.includes(f)}
                      onToggle={() => toggleFilter(selectedFunding, setSelectedFunding, f)}
                    />
                  ))}
                </div>
              </div>

              {/* Technologies + Hiring signals */}
              <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Technologies Used
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TECH_STACK.map((tech) => (
                      <FilterChip
                        key={tech}
                        label={tech}
                        selected={selectedTechs.includes(tech)}
                        onToggle={() => toggleFilter(selectedTechs, setSelectedTechs, tech)}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-5 sm:pt-6">
                  <button
                    type="button"
                    onClick={() => setHiringSignals(!hiringSignals)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      hiringSignals
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        : "border-border/60 text-muted-foreground hover:border-brand/30 hover:text-foreground"
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${hiringSignals ? "text-amber-500" : ""}`} />
                    Hiring signals
                    <div
                      className={`w-8 h-4 rounded-full transition-all relative ${
                        hiringSignals ? "bg-amber-500" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${
                          hiringSignals ? "left-4" : "left-0.5"
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading skeletons */}
          {searching && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-[#4edea3]" />
                Discovering companies matching your filters…
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}

          {/* Results */}
          {!searching && leads.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{leads.length} leads found</span>
                  {importedIds.size > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {importedIds.size} imported
                    </Badge>
                  )}
                </div>
                {unimportedCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={handleImportAll}
                    disabled={importingAll}
                  >
                    {importingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Import className="w-3.5 h-3.5" />
                    )}
                    {importingAll ? "Importing…" : `Import All (${unimportedCount})`}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {leads.map((lead, idx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: leads have no stable id
                  <LeadCard
                    key={`${lead.name}-${idx}`}
                    lead={lead}
                    idx={idx}
                    isImported={importedIds.has(String(idx))}
                    isImporting={importingId === String(idx)}
                    onImport={handleImport}
                  />
                ))}
              </div>
            </div>
          )}

          {!searching && hasSearched && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-sm">No companies found</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Try adjusting your filters or broadening your search terms.
              </p>
            </div>
          )}

          {!searching && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#8083ff]/10 flex items-center justify-center">
                <Target className="w-8 h-8 text-[#4edea3]" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-base">
                  Set your filters above to find ICP companies
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Filter by industry, seniority, company size, funding stage, tech stack, and hiring
                  signals — then import directly into your pipeline.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 max-w-lg w-full text-left">
                {[
                  {
                    icon: Users,
                    title: "Apollo-grade filters",
                    desc: "Industry, seniority, size, funding, tech stack",
                  },
                  {
                    icon: Sparkles,
                    title: "AI enrichment",
                    desc: "Technologies, employee estimates, fit scoring",
                  },
                  {
                    icon: TrendingUp,
                    title: "Pipeline import",
                    desc: "One-click to add any lead as a prospect account",
                  },
                ].map((feat) => (
                  <div
                    key={feat.title}
                    className="p-3 rounded-lg border border-border/50 bg-card space-y-1"
                  >
                    <feat.icon className="w-4 h-4 text-[#4edea3]" />
                    <p className="text-xs font-medium">{feat.title}</p>
                    <p className="text-[11px] text-muted-foreground">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
