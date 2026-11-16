# WarmPath

B2B outbound built on warm introductions instead of cold sequences.

Cold outreach reply rates keep falling as AI SDR tools flood inboxes. WarmPath asks a different question: **who on your team already knows someone at the target account, and how warm is that path?** It ranks targets by the warmest route to them and drafts the intro ask. A human approves every message before it goes out.

## What it does

- **Relationship graph.** Edges are built from intro history, coworker overlap, calendar meetings, email threads, CRM ownership and LinkedIn connections. Each edge's warmth is `type weight × recency decay × strength`, and edges older than 90 days are marked stale. A breadth-first search finds the warmest paths from team members to target contacts.
- **Warm-lead ranking.** Accounts and contacts are scored by opportunity and path warmth, with buying signals layered on top.
- **AI research and drafting.** Prospect research, intro requests and messages across email, LinkedIn, WhatsApp and phone call scripts, grounded in a per-workspace knowledge base.
- **Human approval queue.** Every AI draft lands in a keyboard-driven queue (split view, edit and approve). Nothing is sent without sign-off, and every action is written to an audit log with AI usage tracking.
- **Integrations.** Contacts sync with Twenty CRM, email goes out through Brevo SMTP, and LinkedIn connections come in via CSV import.

## Architecture

```
 Next.js 15 (App Router, React 19)          FastAPI intelligence service
  UI, auth (NextAuth), API routes  ───────►  graph engine · scoring · signals
  Prisma ─► Postgres (Neon)                  research/drafting agents · scheduler
           │                                         │
           └──── shared Postgres ◄───────────────────┘
 LLM: Anthropic or Azure OpenAI, behind one provider interface
```

| Path | What lives there |
|---|---|
| `src/app/(app)` | Product screens: dashboard, warm leads, relationship graph, approval queue, campaigns, signals, knowledge base, audit log |
| `src/app/api` | Route handlers; heavy work is proxied to the intelligence service |
| `src/lib/graph`, `src/lib/scoring` | Path-finding and warmth scoring (TypeScript; ported to Python in the service) |
| `src/lib/ai` | LLM provider abstraction (Anthropic and Azure OpenAI) |
| `prisma/` | Schema (34 models) and seed |
| `intelligence-service/` | FastAPI backend, also published as [warmpath-intelligence](https://github.com/adhikbuilds/warmpath-intelligence) |

## Run it

```bash
npm install
cp .env.example .env.local        # database URL, auth secret, LLM keys
npm run db:push && npm run db:seed
npm run dev                       # http://localhost:3000
```

The intelligence service runs separately: `cd intelligence-service && pip install -r requirements.txt && uvicorn main:app --reload`.

Deployment to Azure Container Apps on free-tier resources is described in [`DEPLOY_AZURE.md`](DEPLOY_AZURE.md).
