"use client";

import {
  ArrowRight,
  Building2,
  ExternalLink,
  Loader2,
  Route,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface NetworkResult {
  id: string;
  name: string;
  title?: string;
  company?: string;
  summary?: string;
  linkedin_url?: string;
  warm_path?: string;
}

const EXAMPLE_QUERIES = [
  "B2B SaaS founders in India",
  "VP Sales at AI-native GTM companies",
  "Heads of Revenue scaling 1M → 10M ARR",
  "Fintech CROs open to warm intros",
];

export default function NetworkSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NetworkResult[]>([]);
  const [noContacts, setNoContacts] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch(q: string) {
    const text = q.trim();
    if (!text) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/network-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, limit: 25 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Search failed (${res.status})`);
      }
      const data = (await res.json()) as {
        results: NetworkResult[];
        reason?: string;
      };
      setResults(data.results ?? []);
      setNoContacts(data.reason === "no_contacts");
      if ((data.results ?? []).length === 0 && data.reason !== "no_contacts") {
        toast.message("No matching people", { description: "Try a broader description." });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#2563eb]" />
          Network Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe who you&apos;re looking for in plain language. We search your connected contacts
          and rank the best matches with AI.
        </p>
      </div>

      {/* Search box */}
      <Card className="p-4 border-border/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. B2B SaaS founders in India"
              className="pl-9 h-11"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()} className="h-11 px-5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {/* Example chips */}
        {!searched && (
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQuery(ex);
                  runSearch(ex);
                }}
                className="text-xs px-2.5 py-1 rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Result meta */}
      {searched && !loading && !noContacts && (
        <div className="flex items-center gap-2 mt-5 mb-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {results.length} {results.length === 1 ? "match" : "matches"} in your contacts
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-5 flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#2563eb]" />
          <p className="text-sm text-muted-foreground mt-3">
            Searching your network… this can take up to a minute.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="grid gap-2.5 mt-2">
          {results.map((r) => (
            <Card key={r.id} className="p-4 border-border/60 hover:border-border/80 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.name}</span>
                    {r.title && <span className="text-sm text-muted-foreground">· {r.title}</span>}
                  </div>
                  {r.company && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {r.company}
                    </div>
                  )}
                  {r.summary && (
                    <p className="text-sm text-muted-foreground/90 mt-2 line-clamp-2">
                      {r.summary}
                    </p>
                  )}
                  {r.warm_path && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-[#4edea3] bg-[#4edea3]/10 rounded-md px-2 py-1 w-fit max-w-full">
                      <Route className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{r.warm_path}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {r.linkedin_url && (
                    <a
                      href={r.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      LinkedIn <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {r.warm_path && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      Request intro <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No contacts imported yet */}
      {!loading && searched && noContacts && (
        <Card className="p-10 mt-2 border-border/60 text-center">
          <Users className="h-6 w-6 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium mt-3">No contacts to search yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Import your contacts (LinkedIn CSV or Google) to build a searchable network.
          </p>
          <a
            href="/integrations"
            className="inline-block mt-4 text-xs font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#2563eb" }}
          >
            Go to Integrations
          </a>
        </Card>
      )}

      {/* No matches */}
      {!loading && searched && !noContacts && results.length === 0 && (
        <Card className="p-10 mt-2 border-border/60 text-center">
          <Search className="h-6 w-6 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">
            No contacts matched. Try a broader description or different role/industry.
          </p>
        </Card>
      )}
    </div>
  );
}
