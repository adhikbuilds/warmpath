# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun dev          # or: npm run dev
bun run build
bun run start

# Linting / formatting (Biome, not ESLint/Prettier)
bun run lint          # biome check (read-only)
bun run lint:fix      # biome check --write (auto-fix)
bun run format        # biome format --write
```

There are no tests yet. TypeScript checking is done via `tsc --noEmit` (not a configured script invoke directly).

## Architecture

### What this app is

WarmPath is an AI-first B2B GTM/outbound SaaS. It maps a company's relationship graph, finds warm intro paths to prospects, generates personalized multi-channel outreach, and manages an omnichannel approval queue. **Currently a hardcoded frontend prototype no database, no real auth, no API routes.**

### Tech stack

- **Next.js 15** with App Router, `output: "standalone"`
- **React 19** all interactive pages are `"use client"`
- **Tailwind v4** (CSS-first config, no `tailwind.config.js`)
- **Biome** for lint + format (100-char line width, double quotes, trailing commas)
- **Zustand** for all client state (no server state yet)
- **TanStack Query** installed but unused so far
- **Radix UI** primitives wrapped into `src/components/ui/`
- **Sonner** for toasts
- **Recharts** for charts
- **react-force-graph-2d** for the relationship graph visualisation

### Route structure

```
src/app/
  page.tsx                  # Marketing landing page (public)
  login/page.tsx            # Login (redirects if already authed)
  onboarding/page.tsx       # Onboarding wizard
  (app)/                    # Protected app shell layout checks auth
    layout.tsx              # Auth guard + sidebar wrapper
    dashboard/
    warm-leads/
    approval-queue/
    campaigns/ [id]/ new/
    accounts/ [id]/
    contacts/ [id]/
    signals/
    knowledge-base/
    integrations/
    relationship-graph/
    audit-log/
    ai-usage/
    team/
    billing/
    settings/
    demo-lab/
```

### State management

All runtime state lives in two Zustand stores:

- **`useAuthStore`** (`src/stores/authStore.ts`) user identity, `isAuthenticated`, persisted to localStorage via `zustand/middleware/persist` under key `"warmpath-auth"`. Auth is completely fake: `login()` just sets the DEMO_USER after a 800ms timeout.
- **`useSalesStore`** (`src/stores/salesStore.ts`) everything else: accounts, contacts, signals, warm paths, messages, campaigns, campaign assets, integrations, KB items, AI settings, audit logs, etc. Initialised from static demo data at module load time. All mutations are in-memory only (reset on page reload).

### Static demo data (the current "database")

Three files contain all hardcoded data:

| File | Contents |
|---|---|
| `src/lib/demo-data.ts` | DEMO_USER, DEMO_TEAM, DEMO_ACCOUNTS, DEMO_CONTACTS, DEMO_SIGNALS, DEMO_WARM_PATHS, DEMO_MESSAGES, DEMO_CAMPAIGNS, DEMO_RELATIONSHIP_EDGES, DEMO_NEXT_BEST_ACTIONS |
| `src/lib/demo-data-extended.ts` | DEMO_WORKSPACE, DEMO_WORKSPACE_MEMBERS, DEMO_KB_ITEMS, DEMO_AI_USAGE, DEMO_AUDIT_LOGS, DEMO_TEST_SCENARIOS, DEMO_AI_SETTINGS, extra accounts/contacts |
| `src/lib/demo-data-omnichannel.ts` | DEMO_INTEGRATIONS, DEMO_CAMPAIGN_ASSETS, DEMO_CALL_TASKS, DEMO_WHATSAPP_MESSAGES, DEMO_TELEGRAM_MESSAGES, DEMO_META_CAMPAIGNS, DEMO_CAMPAIGN_RECOMMENDATIONS, DEMO_GTM_MISSIONS, CHANNEL_CONFIG |

### AI abstraction (`src/lib/ai/index.ts`)

Three modes selected by `NEXT_PUBLIC_AI_MODE` env var:
- `mock` (default) deterministic templates, no cost, in-process
- `local` calls Ollama at `NEXT_PUBLIC_OLLAMA_BASE_URL`
- `remote` calls Anthropic/OpenAI if key present, logs cost, falls back to mock

Provider is accessed via `getAIProvider()` singleton. UI calls this directly from the client there are no API routes yet. The abstraction is designed to be moved behind server routes.

### Relationship graph engine (`src/lib/graph/index.ts`)

Real BFS pathfinding. `RelationshipGraph` class builds an adjacency map from `RelationshipEdge[]`, computes edge warmth (type × recency × strength), runs BFS up to `maxHops`, ranks paths by weakest-link × length-penalty. `buildRelationshipGraph(edges, teamNodes)` is the factory. Used in the relationship-graph page and warm-leads computation.

### Type system (`src/types/index.ts`)

Single file defining all domain types. No Zod schemas yet. Key types: `Account`, `Contact`, `Signal`, `WarmPath`, `Campaign`, `CampaignAsset`, `GeneratedMessage`, `KnowledgeBaseItem`, `ChannelIntegration`, `AIUsageLog`, `AuditLog`, `Workspace`, `WorkspaceMember`, `GTMMission`, `CampaignRecommendation`.

### Missing backend (P0 before any new features)

- No database add Prisma + PostgreSQL (or SQLite for local dev)
- No real auth `useAuthStore` is localStorage-only; replace with NextAuth or Clerk
- No API routes zero `route.ts` files exist; all data comes from Zustand
- No server actions add under `app/api/`
- Static demo files should become seed data only, not runtime imports

## Key patterns

**All app pages are `"use client"`.** Data is read directly from Zustand stores, which are initialised from demo-data imports. To add server data, introduce `useQuery` (TanStack Query is already installed) hitting new API routes, and keep Zustand for UI-only state.

**Auth guard** is a client-side `useEffect` in `(app)/layout.tsx` that checks `useAuthStore().isAuthenticated` and redirects to `/login`. Any real auth must also set this store state (or the guard must be updated to use a session cookie check).

**Audit logging** currently works via `useSalesStore().logAuditEvent()` in-memory only. Every user action should call this; when the backend exists, it should POST to `/api/audit-log` instead.

**Biome config**: 2-space indent, double quotes, semicolons always, trailing commas everywhere, line width 100. Run `bun run lint:fix` before committing to auto-fix.
