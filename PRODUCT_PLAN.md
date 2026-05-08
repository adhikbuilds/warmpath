# WarmPath Product Plan

## The Core Thesis

Cold AI outreach is collapsing reply rates dropped from **8.5% (2019) → 3.4% (2026)**. Meanwhile warm outreach holds at **34% reply rate**. 11x, Artisan, and Apollo are all shipping autonomous AI SDRs that actively burn their customers' TAM through volume spam. WarmPath's weapon: **your team's relationship graph is the intelligence layer**, not a flat list of 200M contacts. Every outreach decision is warmth-first. Human approval stays in the loop. That is the antidote to the AI SDR credibility crisis.

### Market Evidence
| Metric | Cold Outreach | Warm Outreach |
|--------|--------------|---------------|
| Reply rate | 3.4% (2026) | 34% |
| Email open rate | ~20% | 42% |
| Referral close rate | <5% | 26% |
| Deal velocity | Baseline | 5–10x faster |
| Prospect LTV | Baseline | +16% |

### Competitive Gap
No competitor focuses on relationship graph analysis as the core intelligence layer. Warmly.ai captures de-anonymized website visitors. Common Room tracks community signals. Apollo has 200M contacts. None of them ask: *who on your team already knows this person, and how warm is that connection today?*

---

## Current State Audit

### What Works (Frontend Prototype)
- Marketing landing page, login, onboarding wizard
- Dashboard KPI overview with GTM missions
- Account / contact / signal list views with filtering
- Warm-leads ranking by opportunity score
- Approval queue with keyboard shortcuts, split-view, edit-and-approve
- Campaign list and campaign model
- Integration toggle UI (demo mode)
- Knowledge base CRUD + AI approval toggle
- Audit log + AI usage tracking
- Mock AI generation across 6 channels (email, phone, WhatsApp, Telegram, LinkedIn, Meta Ads)
- Zustand store architecture with optimistic updates

### What Is Broken / Missing

| Area | Status | Impact |
|------|--------|--------|
| API routes → database | All return hardcoded demo data | P0 nothing is real |
| Auth | Faked in Zustand localStorage | P0 no real users |
| Remote AI provider | Stubbed, falls back to mock | P0 no real generation |
| Python intelligence service | Does not exist | P0 no real signals/graph |
| Campaign sequence builder (`/campaigns/new`) | Page does not exist | P1 |
| Warm intro orchestration workflow | Shows paths, can't execute them | P1 |
| Relationship graph visualization | Page exists, not wired to data | P1 |
| Signal ingestion pipeline | All signals are hardcoded | P1 |
| Campaign execution engine | No scheduler, no send logic | P1 |
| Network coverage map | Does not exist | P2 |
| AI research agent | Does not exist | P2 |
| Meeting intelligence | Does not exist | P2 |
| Analytics / attribution | Does not exist | P2 |
| LinkedIn engagement feed | Does not exist | P2 |

---

## Architecture

### Current (Facade)
```
Browser → Next.js (Zustand store) → Hardcoded demo-data.ts constants
```

### Target
```
Browser → Next.js App + API Routes → SQLite / Postgres via Prisma
                     ↓ internal HTTP
         Python FastAPI Intelligence Service
           ├── AI Agent Orchestrator  (LangGraph + Claude Sonnet 4.6)
           ├── Signal Ingestion Pipeline (job posts, funding, G2, LinkedIn)
           ├── Graph Computation Engine  (BFS already written in TS, port to Python)
           ├── Email Delivery            (Resend / SendGrid)
           ├── Enrichment Waterfall      (Hunter.io, Clearbit, Proxycurl)
           └── Sequence Execution Scheduler (APScheduler)
```

### Why Python for the Intelligence Layer
The Next.js API layer handles CRUD, auth, and UI data. Python handles everything that needs real intelligence: LangGraph agent orchestration, web scraping (Playwright), ML-based scoring, async job queues, and the AI SDK ecosystem (LangChain, LlamaIndex). This split is how Clay, Common Room, and Outreach are all structured.

---

## Part 1 Backend Foundation (Gate for Everything Else)

### B1 Connect Auth to Database
**Priority:** P0 | **Effort:** 3 days

Connect NextAuth v5 to the Prisma adapter (both already installed). Real user registration, email/password login, Google OAuth. Replace the fake `useAuthStore.login()` mock with real JWT sessions. Move auth guard from client-side `useEffect` in `(app)/layout.tsx` to Next.js middleware (`middleware.ts`).

**Acceptance criteria:**
- New user can register and log in with email + password
- Google OAuth creates and links a real DB user
- Protected routes redirect to `/login` at the edge (not after hydration)
- `useAuthStore` reads from NextAuth session, not localStorage

---

### B2 Wire API Routes to Prisma
**Priority:** P0 | **Effort:** 5 days

Each of the 15 API route directories currently returns hardcoded `DEMO_*` constants. Connect every route to the real Prisma client, scoped by `workspaceId` from the session.

Routes to wire (in priority order):
1. `/api/accounts` `BizAccount` CRUD
2. `/api/contacts` `Contact` CRUD
3. `/api/signals` `Signal` list + create
4. `/api/warm-paths` `WarmPath` list + create + status update
5. `/api/campaigns` `Campaign` CRUD + `CampaignStep`
6. `/api/approvals` `Message` + `CampaignAsset` approval workflow
7. `/api/knowledge-base` `KnowledgeBaseItem` CRUD
8. `/api/integrations` `IntegrationConnection` CRUD
9. `/api/dashboard` aggregated KPI query
10. `/api/audit-log` `AuditLog` list
11. `/api/ai-usage` `AIUsageLog` list
12. `/api/workspaces/current` `Workspace` + `WorkspaceMember`
13. `/api/billing` Stripe webhook handler (schema already has `Subscription` model)

**Acceptance criteria:**
- Every route reads and writes to SQLite via Prisma
- All queries scoped to current workspace (no cross-tenant data leakage)
- Pagination on list endpoints (cursor-based, 50 items default)

---

### B3 Database Seed
**Priority:** P0 | **Effort:** 1 day

Convert `demo-data.ts`, `demo-data-extended.ts`, `demo-data-omnichannel.ts` into a proper `prisma/seed.ts` that inserts realistic data into the DB on first run. Demo mode becomes a "Reset to sample data" button in Settings, not the default runtime state.

**Acceptance criteria:**
- `bun prisma db seed` populates all tables with the existing demo fixtures
- Seed is idempotent (re-running does not duplicate records)
- `/api/demo/reset` endpoint calls the seed script scoped to the current workspace

---

### B4 Python FastAPI Service Bootstrap
**Priority:** P0 | **Effort:** 3 days

```
/intelligence-service/
  main.py              # FastAPI app, CORS, health check
  routers/
    agents.py          # POST /agents/research, POST /agents/generate
    signals.py         # GET /signals/ingest, POST /signals/score
    graph.py           # POST /graph/compute-paths, GET /graph/coverage
    enrich.py          # POST /enrich/contact, POST /enrich/account
  services/
    ai_client.py       # Anthropic SDK with prompt caching
    graph_engine.py    # BFS pathfinding (port from src/lib/graph/index.ts)
    signal_scrapers/   # One file per signal source
  scheduler.py         # APScheduler for daily/weekly jobs
  Dockerfile
```

Called from Next.js API routes via `INTELLIGENCE_SERVICE_URL` env var (internal HTTP, not public-facing).

**Acceptance criteria:**
- `GET /health` returns 200 from Docker container
- All routes authenticated with shared secret header
- Errors from Python service degrade gracefully in Next.js (show mock data, log error)

---

### B5 Remote AI Provider (Claude)
**Priority:** P0 | **Effort:** 2 days

Implement the missing `RemoteAIProvider` in `src/lib/ai/index.ts`. Calls Claude Sonnet 4.6 via Anthropic SDK. Prompt caching on system prompt + KB context block (saves 60–80% on repeated generations). Log every call to `AIUsageLog` table with token counts and cost estimate. Fall back to mock on error.

```typescript
// Cache structure: system prompt (KB + workspace context) cached once per workspace
// Per-request: contact + account + signal data (not cached, changes per message)
```

**Acceptance criteria:**
- `NEXT_PUBLIC_AI_MODE=remote` uses Claude with real API key
- KB items loaded once per session and cached in Anthropic prompt cache
- Token usage and cost logged to `AIUsageLog` after every generation
- Fallback to mock if API key missing or Anthropic returns error

---

## Part 2 Feature Epics

---

### Epic 1 Relationship Intelligence Engine
*The core differentiator. No competitor has this as their primary product surface.*

---

#### Story 1.1 Interactive Relationship Graph
**Priority:** P1 | **Effort:** 5 days | **Page:** `/relationship-graph`

`react-force-graph-2d` is already installed. Make it real.

**What to build:**
- Nodes: team members (blue), contacts (green), accounts (purple ring around contact cluster)
- Edges colored by warmth score: red (<40) → yellow (40–70) → green (70+), thickness = strength
- Click any contact node → right sidebar slides in with: all paths from team to that contact, warmth score per path, path explanation, "Draft Intro" CTA button
- Search bar: type contact name → graph re-centers and highlights their paths and edges
- Filters: minimum warmth threshold slider, filter by team member, filter by account
- "Coverage mode" toggle → dims all nodes with no warm path to target accounts
- Zoom to fit, zoom to selection, fullscreen mode

**Acceptance criteria:**
- Graph loads from real `RelationshipEdge` DB records within 2s
- Paths computed by existing BFS engine (already written in `src/lib/graph/index.ts`, just needs wiring)
- Graph handles 500+ nodes without freezing (Barnes-Hut approximation via force-graph library option)
- "Draft Intro" opens the approval queue pre-filtered to that contact
- Graph state (zoom, filter) persists on page refresh via URL params

---

#### Story 1.2 Network Coverage Map
**Priority:** P1 | **Effort:** 3 days | **Page:** `/relationship-graph?view=coverage`

**What to build:**
- Hero metric card: "68 of 120 target accounts have ≥1 warm path" with large percentage ring
- Account table with columns: Account | Best warmth score | Path (You → X → Y) | Intro person | Gap type
- Gap types: `no_path` (never worked here) / `cold_path` (path exists but warmth <40) / `stale_path` (last interaction >90 days ago)
- Recommended action per gap type: "Connect with their CTO on LinkedIn" / "Re-engage Mark Chen" / "Send a re-intro request"
- Trend sparkline: coverage % over last 90 days did relationship-building efforts pay off?
- Export to CSV button for leadership reporting

**Acceptance criteria:**
- Coverage % computed from live graph + warm-paths DB data
- Gap classification logic runs server-side (Python service or API route)
- Accounts with no warm path sort to top by default
- Trend chart uses historical `RelationshipEdge.last_interaction_at` data

---

#### Story 1.3 Network Decay Alerts
**Priority:** P2 | **Effort:** 3 days | **Surface:** Dashboard widget + email digest

**What to build:**
- Python scheduled job (runs daily): for every `RelationshipEdge` compute warmth using existing decay formula; if warmth dropped >15 points vs 7 days ago → create `Signal` of type `relationship_decay`
- Signal card: "Your connection to Sarah Chen (bridge to 3 accounts) is going cold last interaction 47 days ago"
- Dashboard warning banner: "🔴 3 relationships going cold" with count link to signal feed
- One-click "Re-engage": opens LinkedIn profile or Gmail compose with a pre-drafted check-in message (not sales, just a genuine ping)
- Weekly email digest: "Your network health this week 2 new warm paths, 3 cooling relationships"
- Per-user setting: opt out of email digest, set decay threshold

**Acceptance criteria:**
- Decay alerts generated automatically without rep action
- Alerts dismissed when `last_interaction_at` updates (new email or LinkedIn activity detected)
- "Re-engage" draft does not reference product or sales keeps it authentic

---

#### Story 1.4 Champion Job Change Tracker
**Priority:** P2 | **Effort:** 4 days | **Surface:** Dashboard alert + signal feed

**What to build:**
- Python weekly job: for all contacts with `warmth_score > 60`, check LinkedIn for title/company change via Proxycurl API
- On change detected: create `Signal` of type `champion_job_change`
- Alert card: "🏆 Priya Patel joined Stripe as VP Product you introduced her to Finpilot 6 months ago"
- One-click: "Reach out to Priya at Stripe" → AI drafts message referencing existing relationship + congratulates on new role + offers value at Stripe
- Auto-creates `BizAccount` for Stripe if not in DB; auto-creates `WarmPath` using existing relationship as the bridge

**Acceptance criteria:**
- Job change detected within 7 days of LinkedIn update
- Only triggers for contacts with `warmth_score > 60` (filters noise)
- Outreach draft explicitly references the prior relationship (not generic congratulations)
- New account + warm path created automatically for the champion's new company

---

### Epic 2 Signal Intelligence Hub
*13 signal types exist in demo data. This epic makes them real-time.*

---

#### Story 2.1 Signal Feed with Priority Scoring
**Priority:** P1 | **Effort:** 4 days | **Page:** `/signals` (rebuild)

**What to build:**
- Feed sorted by composite "act now" score: `urgency_score × account.opportunity_score × warm_path.warmth_score`
- Signal type icons: 💰 Funding / 👔 Leadership change / 🔍 Website visit / 📋 Job posting / 🌟 G2 review / 📈 Intent surge / 🤝 Champion move / ⚡ Competitor hiring
- Each signal card: account logo + name, signal summary, "what this means for you" AI one-liner, recommended action, warmth badge (has warm path / cold / no path)
- One-click "Generate outreach" → creates `Message` using signal as personalization hook → opens approval queue focused on that message
- Filters: signal type multi-select, urgency threshold slider, "warm path only" toggle, account stage
- Empty state with instructions when signal feed is empty (connect integrations to unlock real signals)

**Acceptance criteria:**
- Composite score computed server-side on every page load
- "Generate outreach" pre-fills signal context into AI generation request
- Signals older than 30 days auto-archived (still accessible via "Show archived" toggle)
- Feed auto-refreshes every 5 minutes via TanStack Query polling

---

#### Story 2.2 Signal Ingestion Pipeline
**Priority:** P1 | **Effort:** 6 days | **Service:** Python FastAPI

**Signal sources to implement (in priority order):**

1. **Funding alerts** Crunchbase API or news scrape → company raised Series A+ → `funding` signal; urgency = round size × how relevant to our ICP
2. **Job posting monitor** LinkedIn Jobs API or Indeed scrape → detect roles that signal tool evaluation (Head of RevOps, Sales Ops Manager, VP Sales) → `job_posting` signal
3. **Website visit deanonymization** IP lookup via Clearbit Reveal or 6sense → company identified → `website_visit` signal; mark as high urgency if pricing page visited
4. **LinkedIn post monitor** Proxycurl content API → target contacts posting about relevant pain points → `linkedin_post` signal with extracted quote
5. **G2 activity** G2 Buyer Intent API → account viewing competitor pages → `g2_review` signal

Each ingested signal:
- Normalized to `Signal` schema and saved to DB
- Scored via Python scorer (urgency 0–100 based on recency + relevance + account fit)
- Deduped (same account + type within 24h = one record, `detected_count` incremented)
- Triggers optional auto-draft if `urgency_score > 85` and `account.opportunity_score > 80`

**Acceptance criteria:**
- At least 3 live signal sources operational in Python service
- New signals appear in feed within 15 minutes of real-world event
- Signal scraping respects rate limits and does not get IP blocked (rotating proxies for web sources)
- All raw scraped data stored separately from normalized `Signal` for debugging

---

#### Story 2.3 Intent Topic Monitoring
**Priority:** P2 | **Effort:** 3 days | **Service:** Python + Signal Feed

**What to build:**
- Bombora API integration (or G2 Buyer Intent as fallback)
- Map buyer intent topics to WarmPath value propositions in KB (configured per workspace)
- Accounts with intent surge above threshold → `intent_topic_surge` signal
- Signal card shows: "Acme AI is actively researching 'sales automation' 73% above baseline" with recency bar
- Intent score incorporated into `opportunity_score` recomputation (weighted average with existing scores)
- Filter on warm-leads page: "Currently researching" tag badge on accounts with active intent

**Acceptance criteria:**
- Intent scores refreshed weekly
- Intent topic → product mapping configurable in Settings (not hardcoded)
- Low-intent accounts deprioritized in warm-leads list without being hidden

---

### Epic 3 AI Research Agent
*Clay built a billion-dollar business on this. Specific, verifiable hooks book meetings. Generic AI personalization gets ignored.*

---

#### Story 3.1 Prospect Research Card
**Priority:** P1 | **Effort:** 5 days | **Surface:** Contact profile + approval queue

**What to build:**

When "Generate outreach" is clicked for a contact, Python AI agent first runs a research pipeline (LangGraph multi-step agent):

1. Fetch LinkedIn profile via Proxycurl (recent posts, job history, education, skills)
2. Google News search: `"[contact name]" OR "[company name]"` → last 30 days
3. Check if contact has written G2 reviews for any product in our space
4. Search for podcast appearances, conference talks, published articles
5. Pull company funding/hiring news from Crunchbase

Returns structured research object:
```json
{
  "hooks": [
    { "text": "Priya just posted about struggling with manual CRM updates", "source": "LinkedIn", "date": "3 days ago", "confidence": 0.92 },
    { "text": "Finpilot raised $12M Series A last week expansion budget likely", "source": "TechCrunch", "date": "5 days ago", "confidence": 0.99 }
  ],
  "recent_activities": [...],
  "pain_points": [...],
  "company_events": [...]
}
```

UI shows "Research card" step before message draft:
- "Found 3 personalization hooks for Priya Patel" with hook list
- Each hook has checkbox user selects which ones to include
- AI uses selected hooks in message generation (passed as additional context)
- Research card also shown in approval queue alongside generated message for fact-checking

**Acceptance criteria:**
- Research completes in <10 seconds (parallel async calls in Python)
- At least 2 specific, verifiable hooks per contact (not generic industry observations)
- Research cached for 7 days keyed by `contact_id` (don't re-scrape weekly)
- Approval queue shows research card in right panel so reviewer can verify claims before approving

---

#### Story 3.2 ICP Scoring Engine
**Priority:** P2 | **Effort:** 4 days | **Service:** Python + Account Profile

**What to build:**
Python AI agent runs for each new account (and weekly for existing ones):

Scores fit across 5 dimensions (0–100 each):
1. **Industry fit** company industry vs ICP definition in KB
2. **Size fit** employee count and revenue vs target segment
3. **Tech stack fit** detect tools via BuiltWith API or job postings; match to ICP tech requirements
4. **Growth trajectory** headcount growth rate, funding stage, hiring velocity
5. **Pain indicators** job postings for roles that indicate the pain we solve

Stores as `fit_score` in `BizAccount` (schema already has this field).

Account profile shows radar chart with 5-dimension breakdown.
Low-fit accounts (composite < 40) filtered out of warm-leads by default with "Show all" override.

**Acceptance criteria:**
- All existing accounts auto-scored on first Python service deploy
- Score breakdown visible per dimension (radar chart, not just a single number)
- ICP definition editable in Knowledge Base (KB item type `icp`) changing it triggers re-score
- Re-score job runs weekly via APScheduler

---

### Epic 4 Warm Intro Orchestration
*WarmPath shows warm paths. It cannot yet execute on them. This is the core product loop.*

---

#### Story 4.1 Intro Request Workflow
**Priority:** P1 | **Effort:** 6 days | **Page:** `/warm-leads`, approval queue, email integration

Full intro workflow state machine:

```
draft → intro_requested → intro_sent → intro_accepted → message_sent → replied → meeting_booked
```

**What to build:**

When user approves a `warm_intro` type message:
1. Intro request email sent to the introducing team member via Gmail/Outlook integration
2. `WarmPath.status` → `intro_requested`, intro email logged in `Conversation`
3. Auto-create `Task` of type `follow_up` due in 3 days: "Check if [introducer] sent intro to [prospect]"
4. Task visible in a new `/tasks` queue (simple list: overdue, today, upcoming)
5. If replied-to email from introducer detected (via email webhook): `WarmPath.status` → `intro_sent`
6. If intro forwarded and prospect replies: `WarmPath.status` → `intro_accepted`, rep notified
7. Notification: "Your intro was accepted draft follow-up to Priya?" with one-click generate

**Acceptance criteria:**
- Intro request email actually sends via connected Gmail/Outlook (OAuth token stored in `IntegrationConnection`)
- Status tracked automatically via email parsing, not manual rep updates
- 3-day follow-up task created and visible in tasks queue
- Rep notified via Sonner toast + email when intro is accepted
- Full state history visible on warm path detail view (timeline)

---

#### Story 4.2 Warm Path Pipeline View
**Priority:** P1 | **Effort:** 3 days | **Page:** `/warm-leads?view=pipeline`

**What to build:**
Kanban board with columns mapped to `WarmPath.status`:

`Identified` → `Intro Requested` → `Intro Accepted` → `Message Sent` → `Replied` → `Meeting Booked`

Card contents: contact photo + name, company logo, introducing team member, days in current stage, warmth score badge, urgency signal badge (most recent signal for that account)

Interactions:
- Drag card between columns → updates `WarmPath.status` in DB + logs audit event
- Overdue cards (>7 days in same stage): border turns red
- Click card → right panel opens with full warm path detail (nodes, path explanation, conversation history)
- Filter by team member, account, urgency

Header metrics bar: "14 intros in flight · 5 accepted this week · 3 meetings booked"

**Acceptance criteria:**
- Loads from DB (real `WarmPath` records), not demo data
- Drag-and-drop updates status in DB and logs to `AuditLog`
- Metrics header recalculates on card move
- Pipeline view persisted as the default tab preference per user

---

### Epic 5 Campaign Sequence Builder
*Table-stakes that Apollo, Outreach, and Amplemarket all have. WarmPath's version is warmth-aware it routes step 1 through the warm path automatically.*

---

#### Story 5.1 Visual Sequence Builder
**Priority:** P1 | **Effort:** 6 days | **Page:** `/campaigns/new` (create this page)

**Step 1 Goal selector:**
Cards: Book Meetings / Revive Stalled Deals / Product Launch / Re-engage Champions / Expansion / Event Invitation

**Step 2 Target segment:**
Select individual accounts/contacts OR apply saved ICP filter (industry, size, seniority, intent score)

**Step 3 Warmth routing preview:**
Before building the sequence: "We found warm paths to 8 of your 12 targets. For those 8, step 1 will be a warm intro request. For the remaining 4, step 1 will be a direct email." User can override per-contact.

**Step 4 Sequence builder (visual timeline):**
- Each step card: channel selector, delay picker (0–30 days), template type hint, objective field
- Add step button between any two steps
- Drag to reorder
- Branch conditions: "If replied → stop sequence" / "If email opened but no reply after 3 days → send LinkedIn follow-up"
- AI suggests: "Add a phone call on day 5 accounts in this industry respond best to multi-touch"

**Step 5 Asset generation:**
Generates all channel assets for all contacts in parallel → batch lands in approval queue grouped by campaign

**Acceptance criteria:**
- Wizard saves `Campaign` + `CampaignStep[]` to DB on completion
- Warmth routing suggestion shown and configurable
- Asset generation calls remote AI provider (not mock)
- Generated assets grouped in approval queue with "Campaign: [name]" header
- Campaign status → `draft` until all assets approved, then user can launch

---

#### Story 5.2 Sequence Execution Engine
**Priority:** P1 | **Effort:** 5 days | **Service:** Python FastAPI + APScheduler

**What to build:**
Python hourly job that finds and executes due sequence steps:

```python
# Pseudocode
for campaign in active_campaigns:
    for step in campaign.steps:
        due_messages = messages where:
            status == 'approved'
            AND campaign.launched_at + step.delay_days <= now
            AND not yet sent
        
        for message in due_messages:
            route_to_channel(message)  # Gmail / LinkedIn / Twilio / WhatsApp / Meta
            message.status = 'sent'
            log_pipeline_metric(campaign, message)
```

Channel routing:
- `email` → Resend API or SendGrid
- `linkedin` → LinkedIn API (connection request + message)
- `phone` → Twilio (creates call task for rep, does not autodial)
- `whatsapp` → Twilio WhatsApp API
- `telegram` → Telegram Bot API
- `meta_ads` → Meta Marketing API

Reply detection:
- Gmail/Outlook webhook → parse inbound → match to sent message → update `Conversation` → pause sequence for that contact → notify rep

**Acceptance criteria:**
- Messages execute within 5 minutes of their scheduled time
- Sequence pauses for a contact automatically when they reply (any channel)
- Send failures retry 3× with exponential backoff, then flag to rep
- `PipelineMetric` records created for every send and reply event

---

### Epic 6 Sales Coaching & Email Intelligence
*Amplemarket and Lavender both show reps what's working. WarmPath's version is grounded in its own historical reply data, not generic benchmarks.*

---

#### Story 6.1 Message Quality Scorer
**Priority:** P2 | **Effort:** 4 days | **Surface:** Approval queue right panel

**What to build:**
Quality score panel above the existing confidence ring in the approval queue:

5-dimension radar chart (0–100 each):
1. **Personalization** specific hooks vs generic statements (AI-scored)
2. **Clarity** Flesch reading ease, sentence length, jargon count
3. **CTA Strength** clear ask, specific next step, low-friction response required
4. **Tone Match** matches contact's seniority level and detected communication style
5. **Length** optimal word count for channel (email: 75–125 words, LinkedIn: 50–80 words)

Per-dimension feedback line: "CTA is weak try 'Worth 15 minutes this Thursday?' instead of 'Let me know if interested'"

Subject line grader (email only): predicted open rate vs workspace benchmark
- "Your subject: ~61% open rate | Top performer in your workspace: 74%"

"Improve flagged sections" button → AI rewrites only the low-scoring parts, preserves personalization hooks

Historical benchmarks: "Messages with score >80 got 41% replies on your account" (computed from real workspace `Message` + `Conversation` data)

**Acceptance criteria:**
- Scorer runs during approval queue load (batch call to Python service, non-blocking)
- Radar chart renders without layout shift (skeleton placeholder while loading)
- "Improve flagged sections" preserves all factual claims and hooks from research card
- Personalized benchmarks computed per workspace (not generic industry numbers) after 20+ messages sent

---

#### Story 6.2 Meeting Intelligence Cards
**Priority:** P2 | **Effort:** 4 days | **Surface:** Dashboard + account profile

**Pre-meeting briefing card** (auto-surfaces 30 min before meeting via Slack or email):
- Contact's recent LinkedIn activity + news (from research cache)
- Warm path recap: "You were introduced by Sarah Chen 3 weeks ago via email"
- Recommended talking points based on active signals for their account
- Likely objections + suggested rebuttals (sourced from KB items of type `objection`)
- Competitor mentions: "Their job postings mention Salesforce they are currently on Salesforce"
- "Open briefing" → fullscreen prep mode on `/accounts/[id]?view=briefing`

**Post-meeting follow-up:**
- Rep logs: outcome (meeting booked / not interested / follow-up later), next steps (text), notes
- AI drafts follow-up email from notes within 60 seconds
- Draft lands in approval queue
- Outcome updates `WarmPath.status` and creates `PipelineMetric` record

**Acceptance criteria:**
- Briefing auto-triggered via calendar webhook (Google Calendar OAuth) 30 min before event
- Talking points grounded in real KB items (shows which KB item sourced each point)
- Follow-up draft generated using Claude with notes as user context
- Briefing accessible manually at any time on account profile page

---

### Epic 7 Analytics & Revenue Intelligence
*The most common GTM tool churn reason: reps cannot prove ROI. WarmPath needs a clear, defensible answer to "how many meetings did warm intros book vs cold outreach?"*

---

#### Story 7.1 Warm vs Cold Performance Dashboard
**Priority:** P2 | **Effort:** 4 days | **Page:** `/analytics` (new page)

**What to build:**

Hero metric:
> "Warm outreach books 6.2× more meetings than cold on your team"
> "This month: 14 meetings from warm intros · 2 meetings from cold email"

Charts:
- Time-series (90 days): warm reply rate vs cold reply rate, dual-line with filled area
- Funnel comparison side-by-side: Warm (Sent → Opened → Replied → Meeting) vs Cold
- By team member: table with each rep's warm network strength score, intros sent, intro conversion rate
- By account: warm-path accounts close 34% faster stage velocity chart

ROI calculation card:
> "Your 14 warm intro meetings would have cost $21,000 in cold outreach (industry avg: $1,500/meeting via cold) to produce. Warm intros cost you $0 in acquisition and closed 2× faster."

**Acceptance criteria:**
- All metrics computed from real `Message`, `Conversation`, `PipelineMetric` DB records
- "Warm" defined as: `Message.channel == 'warm_intro'` OR `Message.warm_path_id IS NOT NULL`
- Chart data aggregated server-side (not client-side, too slow for large datasets)
- "Share report" → generates PDF or shareable link for leadership

---

#### Story 7.2 Pipeline Attribution
**Priority:** P2 | **Effort:** 3 days | **Surface:** Analytics page + account profile timeline

**What to build:**
Every `meeting_booked` event carries full attribution chain:
- `signal_id` what signal triggered the outreach
- `warm_path_id` which relationship was used
- `campaign_id` which sequence it came from
- `channel` how it was ultimately delivered
- `introducer_user_id` who made the warm intro (if any)

Attribution dashboard:
- Pie chart: meetings by signal type "Funding signal generates 3× more meetings than job posting"
- Pie chart: meetings by channel "Warm intro outperforms email 6:1 on your team"
- "Intro credit leaderboard": Sarah Chen: 4 intros → 3 accepted → 2 meetings (gamification)
- Table: top-performing signals this month with click-through to the signal record

Account profile timeline: chronological events → intro requested → intro accepted → message sent → replied → meeting booked → closed won

**Acceptance criteria:**
- Attribution chain recorded at message send time (not retroactively)
- Meeting booked event fired via calendar webhook (Google Calendar) or manual rep log
- Attribution visible on each account profile as a timeline
- Leaderboard updates in real-time (invalidate query on new meeting_booked event)

---

### Epic 8 LinkedIn Social Selling Suite
*LinkedIn is where warm relationships are built. Competitors use it as just another send channel. WarmPath uses it as a relationship intelligence source.*

---

#### Story 8.1 LinkedIn Engagement Feed
**Priority:** P2 | **Effort:** 4 days | **Page:** `/signals?tab=linkedin` or sidebar widget

**What to build:**
- Pull recent LinkedIn posts from target contacts (Proxycurl content API, batched weekly)
- Feed: post summary, engagement count, topic tags, posted date
- AI tags each post with detected intent: pain point / product evaluation / competitor mention / expansion signal / positive sentiment
- Actions per post:
  - "Generate thoughtful comment" → AI drafts relevant, non-sales comment (uses KB for context, explicitly avoids selling)
  - "Use as outreach hook" → saves hook text to contact's research card for use in next message
- Alert badge: "Priya Patel posted about frustration with manual CRM updates matches your value prop" (topic match against KB item `value_prop`)

**Acceptance criteria:**
- Posts fetched and stored within 24 hours of publication
- Comment generator explicitly uses non-sales language (system prompt constraint)
- "Use as hook" stores hook in contact record and surfaces it next time outreach is generated for that contact
- Topic matching uses KB items, not hardcoded keywords

---

#### Story 8.2 LinkedIn Connection Mapping
**Priority:** P2 | **Effort:** 3 days | **Surface:** Account profile page

**What to build:**
For each target account, show which team members have LinkedIn connections:
- "3 team members have 1st-degree connections at Finpilot · 12 have 2nd-degree"
- List: Sarah Chen (1st-degree → CTO Priya Patel, connected 2 years ago) · Mark (2nd-degree via David Kim → VP Sales)
- "Request intro" button → auto-drafts LinkedIn intro request message using `warm_intro` channel type
- "Connect" button for uncovered contacts → opens LinkedIn profile in new tab + creates a task to connect
- Sync LinkedIn connections quarterly (OAuth, user grants read access to their connections)

**Acceptance criteria:**
- Connection data stored as `RelationshipEdge` records with `source = 'linkedin_connection'`
- Intro request uses existing `GeneratedMessage` generation pipeline with `channel = 'linkedin'`
- OAuth token stored in `IntegrationConnection` table (not hardcoded)
- Connection map visible on account profile page as a dedicated "Network" tab

---

## Sprint Sequence

| Sprint | Stories | Goal |
|--------|---------|------|
| **1** | B1, B2, B3 | Auth is real, DB is connected, seed data loads |
| **2** | B4, B5 | Python service live, remote AI generation works |
| **3** | 1.1, 4.2 | Best demo moments graph viz + pipeline kanban |
| **4** | 2.1, 5.1 | Signal feed + sequence builder (competitive table-stakes) |
| **5** | 3.1, 6.1 | Research agent + quality scorer (differentiated "wow" features) |
| **6** | 4.1, 5.2 | Intro workflow executes end-to-end, sequences send |
| **7** | 7.1, 7.2 | Warm vs cold analytics + attribution (proves ROI, drives retention) |
| **8** | 1.2, 1.3, 1.4 | Coverage map + decay alerts + champion tracker (relationship moat) |
| **9** | 8.1, 8.2, 2.2, 2.3 | LinkedIn suite + real signal pipeline (full competitive parity) |
| **10** | 6.2, 3.2 | Meeting intelligence + ICP scoring (expansion revenue hooks) |

---

## Competitive Moat Map

| Capability | WarmPath | Clay | Warmly | 11x / Artisan | Apollo | Outreach |
|-----------|----------|------|--------|--------------|--------|----------|
| Relationship graph intelligence | ✅ Core | ❌ | ⚠️ basic | ❌ | ❌ | ❌ |
| Network coverage map | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Intro workflow state machine | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Relationship decay alerts | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Champion job change → warm path | ✅ | ⚠️ alert | ❌ | ❌ | ⚠️ alert | ⚠️ alert |
| Warm vs cold ROI attribution | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Signal → research → message chain | ✅ | ⚠️ partial | ⚠️ partial | ✅ | ❌ | ⚠️ partial |
| Human-in-loop approval | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Warmth-first sequence routing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI prospect research agent | ✅ | ✅ (Claygent) | ❌ | ✅ | ❌ | ⚠️ basic |
| Visual sequence builder | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Omnichannel delivery | ✅ | ❌ | ⚠️ email+LinkedIn | ✅ | ⚠️ email+call | ✅ |

---

## Open Questions

1. **Database**: SQLite (current schema) is fine for MVP and early customers. Switch to Postgres (via Turso's hosted libsql) before 50 concurrent users or when attachment storage is needed.

2. **Python service hosting**: Start with a single Fly.io instance (`fly.io` free tier handles background jobs fine). Add worker queues (Celery + Redis) only when signal ingestion volume exceeds 10K signals/day.

3. **LinkedIn API access**: LinkedIn's official API for messages requires partner program approval (6–8 weeks). Proxycurl handles read access. For sending, use the rep's personal OAuth token via LinkedIn's own API scope not a third-party sender, which preserves deliverability.

4. **Email deliverability**: Add `DeliverabilityProfile` monitoring (schema already exists) in Sprint 6. Domain health check, DKIM/SPF/DMARC status, and daily send limit enforcement before sequences go live.

5. **Compliance**: `ConsentRecord` table already exists in schema. Every WhatsApp and cold email contact needs a consent record before inclusion in any sequence. Build the consent check into the sequence execution engine (Story 5.2) as a hard gate.
