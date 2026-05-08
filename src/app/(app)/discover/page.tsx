"use client";

import {
  Building2,
  CheckCircle2,
  Compass,
  Globe,
  Import,
  Loader2,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
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
import { useSalesStore } from "@/stores/salesStore";

interface DiscoveredLead {
  name: string;
  domain?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  description?: string;
  employee_count_estimate?: number;
  rating?: number;
  review_count?: number;
  technologies: string[];
  emails_found: string[];
  linkedin_url?: string;
  fit_score_estimate: number;
  source: string;
}

const EXAMPLE_QUERIES = [
  "B2B SaaS project management",
  "DevTools startups",
  "Revenue operations software",
  "Sales intelligence platforms",
  "HR tech companies",
];

function FitScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  const label = score >= 70 ? "Strong fit" : score >= 50 ? "Moderate fit" : "Weak fit";
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

function DiscoveredLeadCard({
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
  const isGoogle = lead.source?.toLowerCase().includes("google");
  const visibleTechs = lead.technologies?.slice(0, 3) ?? [];
  const extraTechCount = (lead.technologies?.length ?? 0) - visibleTechs.length;

  return (
    <Card className="border-border/60 hover:border-brand/30 transition-colors flex flex-col">
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand">
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
            className={`text-[10px] flex-shrink-0 ${
              isGoogle
                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                : "bg-violet-500/10 text-violet-500 border-violet-500/20"
            }`}
          >
            {isGoogle ? "Google Maps" : "AI Discovery"}
          </Badge>
        </div>

        {/* Meta row */}
        <div className="space-y-1">
          {(lead.industry || lead.city || lead.country) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {[lead.industry, lead.city, lead.country].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          {lead.address && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.address}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="w-3 h-3 flex-shrink-0" />
              <a
                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-brand transition-colors"
              >
                {lead.website}
              </a>
            </div>
          )}
          {lead.employee_count_estimate && lead.employee_count_estimate > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>~{lead.employee_count_estimate.toLocaleString()} employees</span>
            </div>
          ) : null}
          {lead.rating && lead.rating > 0 ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{lead.rating.toFixed(1)}</span>
              {lead.review_count && lead.review_count > 0 ? (
                <span>({lead.review_count.toLocaleString()} reviews)</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Description */}
        {lead.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {lead.description}
          </p>
        )}

        {/* Technology chips */}
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

        {/* Fit score bar */}
        <FitScoreBar score={lead.fit_score_estimate ?? 0} />

        {/* Import action */}
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

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("United States");
  const [limit, setLimit] = useState(10);
  const [searching, setSearching] = useState(false);
  const [leads, setLeads] = useState<DiscoveredLead[]>([]);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);
  const [searchMode, setSearchMode] = useState<"api" | "ai_stub" | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setLeads([]);
    setImportedIds(new Set());
    setHasSearched(true);
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location, limit }),
      });
      const data = await res.json();
      setLeads(data.leads ?? []);
      setSearchMode(data.mode ?? null);
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
      const allIds = leads.map((_, i) => String(i));
      setImportedIds(new Set(allIds));
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

  const unimportedCount = leads.filter((_, i) => !importedIds.has(String(i))).length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand" />
            Lead Discovery
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Find ICP companies via Google Maps · powered by AI enrichment
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20"
          >
            Google Maps
          </Badge>
          <Badge
            variant="outline"
            className="text-xs bg-violet-500/10 text-violet-500 border-violet-500/20"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI Enrichment
          </Badge>
          <Badge
            variant="outline"
            className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          >
            Email Enrichment
          </Badge>
        </div>
      </div>

      {/* Search panel */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4 text-brand" />
            Search for companies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="e.g. B2B SaaS project management"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="relative min-w-[160px]">
              <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[110px] h-9 text-sm">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 results</SelectItem>
                <SelectItem value="10">10 results</SelectItem>
                <SelectItem value="20">20 results</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
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

          {/* Example query chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Try:</span>
            {EXAMPLE_QUERIES.map((eq) => (
              <button
                key={eq}
                type="button"
                onClick={() => setQuery(eq)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  query === eq
                    ? "border-brand/60 bg-brand/10 text-brand"
                    : "border-border/60 bg-muted/50 text-muted-foreground hover:border-brand/30 hover:text-foreground"
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI stub mode banner */}
      {searchMode === "ai_stub" && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p>
            Using AI-powered discovery (add{" "}
            <code className="font-mono bg-blue-500/10 px-1 rounded">GOOGLE_MAPS_API_KEY</code> for
            live data)
          </p>
        </div>
      )}

      {/* Results area */}
      {searching && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            Discovering companies matching your query…
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {!searching && leads.length > 0 && (
        <div className="space-y-4">
          {/* Results count + import all bar */}
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

          {/* Results grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leads.map((lead, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: leads have no stable id
              <DiscoveredLeadCard
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
            Try a different query or location the AI discovery engine may need broader search
            terms.
          </p>
        </div>
      )}

      {!searching && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
            <Compass className="w-8 h-8 text-brand" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-base">Search for companies above to discover leads</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter an industry or product type, pick a location, and let AI surface your next best
              accounts.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 max-w-lg w-full text-left">
            {[
              {
                icon: Globe,
                title: "Google Maps data",
                desc: "Business listings, ratings, contact details",
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
                <feat.icon className="w-4 h-4 text-brand" />
                <p className="text-xs font-medium">{feat.title}</p>
                <p className="text-[11px] text-muted-foreground">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
