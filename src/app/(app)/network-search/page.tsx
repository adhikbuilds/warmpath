"use client";

import { Building2, Loader2, Network, Search, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NetworkSearchResult {
  id: string;
  name: string;
  title?: string;
  email?: string;
  company?: string;
  account_id?: string;
  seniority?: string;
  department?: string;
  warmth_score?: number;
  fit_score?: number;
  linkedin_url?: string;
}

// ── Seniority badge ───────────────────────────────────────────────────────────

const SENIORITY_COLORS: Record<string, string> = {
  c_suite: "bg-brand/10 text-[#8083ff] border-brand/20",
  vp: "bg-[#7b6ea8]/10 text-[#c0c1ff] border-[#7b6ea8]/20",
  director: "bg-[#5db8a6]/10 text-[#4edea3] border-[#5db8a6]/20",
  manager: "bg-[#5db872]/10 text-[#5db872] border-[#5db872]/20",
  ic: "bg-muted text-muted-foreground border-muted",
};

const SENIORITY_LABELS: Record<string, string> = {
  c_suite: "C-Suite",
  vp: "VP",
  director: "Director",
  manager: "Manager",
  ic: "IC",
};

function SeniorityBadge({ seniority }: { seniority?: string }) {
  if (!seniority) return null;
  const color = SENIORITY_COLORS[seniority] ?? "bg-muted text-muted-foreground border-muted";
  const label = SENIORITY_LABELS[seniority] ?? seniority;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${color}`}
    >
      {label}
    </span>
  );
}

// ── Warmth bar ────────────────────────────────────────────────────────────────

function WarmthBar({ score }: { score?: number }) {
  if (score == null) return null;
  const color = score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-yellow-500" : "bg-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] text-[#c7c4d7] w-6 text-right">{score}</span>
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({
  r,
  generatingId,
  onRequestIntro,
}: {
  r: NetworkSearchResult;
  generatingId: string | null;
  onRequestIntro: (id: string) => void;
}) {
  const isGenerating = generatingId === r.id;

  return (
    <Card className="border-[#464554]/60 hover:border-brand/30 transition-colors">
      <CardContent className="p-4 flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#8083ff]/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-[#4edea3]">
          {r.name[0] ?? "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{r.name}</span>
            <SeniorityBadge seniority={r.seniority} />
          </div>

          {r.title && <p className="text-xs text-[#c7c4d7] truncate">{r.title}</p>}

          <div className="flex items-center gap-3 flex-wrap">
            {r.company && (
              <span className="flex items-center gap-1 text-[10px] text-[#c7c4d7]">
                <Building2 className="w-3 h-3" />
                {r.company}
              </span>
            )}
            {r.department && <span className="text-[10px] text-[#c7c4d7]">{r.department}</span>}
          </div>

          {r.warmth_score != null && (
            <div className="pt-1">
              <p className="text-[10px] text-[#c7c4d7] mb-0.5">Warmth</p>
              <WarmthBar score={r.warmth_score} />
            </div>
          )}
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 whitespace-nowrap"
            disabled={isGenerating}
            onClick={() => onRequestIntro(r.id)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Finding path…
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                Request intro
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NetworkSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<NetworkSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleSearch = async () => {
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch("/api/network-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      toast.error("Network search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleRequestIntro = async (contactId: string) => {
    setGeneratingId(contactId);
    try {
      const res = await fetch("/api/warm-paths/generate-for-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId }),
      });
      if (res.ok) {
        // Auto-draft a message for the newly created warm path so it lands in the queue
        await fetch("/api/ai/auto-draft-warm-paths", { method: "POST" }).catch(() => null);
        router.push("/approval-queue");
      } else {
        toast.error("Could not find a warm path to this contact");
      }
    } catch {
      toast.error("Failed to generate warm path");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div
      className="p-6 space-y-5 max-w-[900px] mx-auto"
      style={{ backgroundColor: "#131315", color: "#e5e1e4" }}
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Network className="w-5 h-5 text-[#4edea3]" />
          Network Search
        </h1>
        <p className="text-sm text-[#c7c4d7] mt-0.5">
          Search contacts in your workspace and find warm intro paths through your team's network.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#c7c4d7]" />
          <Input
            placeholder="Search by name, title, company, or department…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button onClick={handleSearch} disabled={searching} className="h-9 gap-2">
          {searching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          {searching ? "Searching…" : "Search"}
        </Button>
      </div>

      {/* Stats row */}
      {hasSearched && !searching && (
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs bg-muted text-[#c7c4d7] border-[#464554]/60">
            {results.length} contact{results.length !== 1 ? "s" : ""} found
          </Badge>
          {results.length > 0 && (
            <p className="text-xs text-[#c7c4d7]">
              Click "Request intro" to find a warm path and add it to Warm Leads.
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {searching && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-[#c7c4d7]">
            <Loader2 className="w-4 h-4 animate-spin text-[#4edea3]" />
            Searching your network…
          </div>
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-[#464554]/60">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-2.5 bg-muted rounded animate-pulse w-1/4" />
                </div>
                <div className="w-24 h-8 bg-muted rounded animate-pulse flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {!searching && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <ResultCard
              key={r.id}
              r={r}
              generatingId={generatingId}
              onRequestIntro={handleRequestIntro}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!searching && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-6 h-6 text-[#c7c4d7]/50" />
          </div>
          <p className="font-medium text-sm">No contacts found</p>
          <p className="text-xs text-[#c7c4d7] max-w-xs">
            Try a different search term, or leave it blank to see all contacts.
          </p>
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#8083ff]/10 flex items-center justify-center">
            <Network className="w-8 h-8 text-[#4edea3]" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-base">Search your network</p>
            <p className="text-sm text-[#c7c4d7] max-w-sm">
              Find any contact in your workspace by name, title, or company. Then request a warm
              intro path with one click.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 max-w-lg w-full text-left">
            {[
              {
                icon: Search,
                title: "Smart search",
                desc: "Search by name, title, company, or department",
              },
              {
                icon: Network,
                title: "BFS pathfinding",
                desc: "Finds the warmest intro path through your team's graph",
              },
              {
                icon: Zap,
                title: "One-click intro",
                desc: "Request intro generates a warm path and adds it to Warm Leads",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="p-3 rounded-lg border border-[#464554]/50 bg-[#201f22] space-y-1"
              >
                <feat.icon className="w-4 h-4 text-[#4edea3]" />
                <p className="text-xs font-medium">{feat.title}</p>
                <p className="text-[11px] text-[#c7c4d7]">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
