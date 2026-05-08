"use client";

import { Building2, Search, User, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSalesStore } from "@/stores/salesStore";

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
}

export function CommandBar({ open, onClose }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const { accounts, contacts, signals } = useSalesStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.toLowerCase();
  const matchedAccounts = q
    ? accounts
        .filter((a) => a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q))
        .slice(0, 4)
    : [];
  const matchedContacts = q
    ? contacts
        .filter((c) => c.name.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
        .slice(0, 4)
    : [];
  const matchedSignals = q
    ? signals.filter((s) => s.title.toLowerCase().includes(q)).slice(0, 3)
    : [];

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled globally via window listener */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss div */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search accounts, contacts, signals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {q && (
          <div className="max-h-80 overflow-y-auto py-2">
            {matchedAccounts.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1.5">
                  Accounts
                </p>
                {matchedAccounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => navigate(`/accounts/${a.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand">
                      {a.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.industry} · {a.employee_count} employees
                      </p>
                    </div>
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            )}
            {matchedContacts.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1.5">
                  Contacts
                </p>
                {matchedContacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/contacts/${c.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.title}</p>
                    </div>
                    <User className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            )}
            {matchedSignals.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-1.5">
                  Signals
                </p>
                {matchedSignals.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => navigate("/signals")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <p className="text-sm font-medium flex-1 truncate">{s.title}</p>
                  </button>
                ))}
              </div>
            )}
            {matchedAccounts.length === 0 &&
              matchedContacts.length === 0 &&
              matchedSignals.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No results for &quot;{query}&quot;
                </p>
              )}
          </div>
        )}
        {!q && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Type to search accounts, contacts, and signals
          </div>
        )}
      </div>
    </div>
  );
}
