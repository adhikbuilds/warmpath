# WarmPath Product Backlog

Features that require backend infrastructure or external integrations beyond the current prototype.
Ordered by competitive urgency based on the Warmly / Clay / Affinity gap analysis.

---

## P0 Required before any real customer can use the product

### 1. Backend + database
**What's needed:** Prisma + PostgreSQL, Next.js API routes, server actions  
**Why blocked:** All data is in-memory Zustand; reloading the page loses everything.  
**Effort:** L (foundation for everything else)

### 2. Real authentication
**What's needed:** NextAuth or Clerk with Google/GitHub/email, session management  
**Why blocked:** `useAuthStore.login()` is a fake 800ms timeout writing to localStorage  
**Effort:** M

---

## P1 Core moat features (what makes WarmPath unique)

### 3. AI-powered natural language audience parsing (Claude API)
**What:** `/api/ai/parse-audience` route that sends the raw query to Claude and returns structured criteria  
**Why:** The current keyword regex parser misses nuance. Claude can handle "bootstrapped SaaS companies worried about churn" with full semantic understanding.  
**Competitor parity:** Clay's Claygent  
**What's missing:** API route, streaming response, follow-up clarifying questions  
**Effort:** S

### 4. Passive email/calendar relationship graph ingestion (Affinity parity)
**What:** OAuth for Gmail + Outlook + Google Calendar. Background job that parses sent/received emails and calendar attendees to build `RelationshipEdge` records automatically.  
**Why:** The current graph is hand-crafted demo data. Real value comes from zero-touch ingestion no one will manually enter relationships.  
**Competitor parity:** Affinity's core differentiator  
**What's missing:** OAuth flows, email metadata parsing, calendar API, background queue, edge deduplication  
**Effort:** XL

### 5. Real-time website visitor intelligence (Warmly parity)
**What:** JavaScript tracking pixel for customer websites. When a known prospect visits, fire a WebSocket/SSE push to the app showing the visitor, company, and warm path to reach them.  
**Why:** The "live alert" moment seeing a high-intent visitor with a warm path to reach them in real time is Warmly's core product magic and the highest-urgency signal type.  
**What's missing:** Tracking pixel script, server-side visitor deanonymization (clearbit/6sense API), WebSocket push, real-time UI notification  
**Effort:** XL

### 6. Waterfall data enrichment (Clay parity)
**What:** For each new account/contact added, run a waterfall enrichment: Apollo → Hunter → Clearbit → LinkedIn → ZoomInfo → manual. Auto-fill missing email, title, LinkedIn URL, company funding stage.  
**Why:** Without enrichment, the audience builder only filters what's already in the CRM. Clay's value is finding 10k new prospects and enriching them.  
**What's missing:** Integration with enrichment APIs, credit management, queue system, enrichment status tracking  
**Effort:** L

---

## P2 Growth-phase features (after first 50 customers)

### 7. LinkedIn compliance-safe enrichment
**What:** Use LinkedIn's official API (not scraping) to verify connection degree, pull recent posts, and check job changes.  
**Why:** LinkedIn 1st/2nd degree is the most reliable warm path indicator, but scraping violates ToS.  
**What's missing:** LinkedIn Developer Program approval, OAuth, rate-limit management  
**Effort:** M (mostly compliance/process, not code)

### 8. CRM bidirectional sync
**What:** Salesforce + HubSpot two-way sync: push account stage changes, messages sent, meetings booked; pull deal history, contact ownership, existing email threads.  
**Why:** AEs won't use a new tool that's disconnected from their CRM. WarmPath needs to enrich the existing workflow, not replace it.  
**What's missing:** Salesforce/HubSpot OAuth, field mapping config UI, conflict resolution, webhook receivers  
**Effort:** L

### 9. Chrome extension in-context warm path discovery
**What:** Extension that overlays LinkedIn profiles and email threads with: warm path to this person, recent signals from their company, one-click draft button.  
**Why:** Reduces friction to zero the warm path reveal is surfaced where the user already is, not in a separate app.  
**Competitor parity:** Apollo's Chrome extension, LinkedIn Sales Navigator  
**What's missing:** Separate extension codebase, content script, background service worker, secure token sharing with web app  
**Effort:** L

### 10. AI SDR persona + autonomous follow-up
**What:** Named AI agent (configurable persona, tone, messaging rules) that can autonomously send approved sequences, schedule follow-ups, and pause when a reply comes in.  
**Why:** The "autonomous SDR" pitch is the highest-ticket positioning. Even if full autonomy is overhyped (see Artisan backlash), a human-in-the-loop AI that handles 80% of the work is defensible.  
**What's missing:** Sending infrastructure (transactional email, LinkedIn API), sequence state machine, reply detection + auto-pause, audit log hookup, send quota enforcement  
**Effort:** XL

### 11. Real-time push notifications (mobile + desktop)
**What:** Push notifications for: new high-urgency signal on a watched account, warm path intro accepted, prospect replied.  
**Why:** The signal feed is only valuable if it interrupts at the right moment polling every 5 minutes means missing the 30-minute window on pricing page visits.  
**What's missing:** FCM/APNs for mobile, Web Push API for desktop, notification preference center, server-side trigger hooks  
**Effort:** M

### 12. Multi-workspace + role-based access
**What:** Team admin can invite members, assign roles (admin / member / viewer), control which warm paths are shared vs private, set per-member send quotas.  
**Why:** B2B SaaS seat expansion requires enterprise-grade permissioning.  
**What's missing:** Workspace data model, invitation flow, RBAC middleware, per-user quota enforcement  
**Effort:** L

---

## P3 Analytics & platform

### 13. Revenue attribution dashboard
**What:** Track the full funnel: warm intro sent → meeting booked → deal closed → ARR. Attribution model: which relationship node generated the most revenue.  
**Why:** Proves ROI to the economic buyer. "Sarah Chen's network generated $340k in closed deals" is a compelling renewal argument.  
**What's missing:** Deal outcome tracking, ARR capture (CRM sync required), cohort analysis, attribution model  
**Effort:** M (depends on CRM sync P2#8)

### 14. A/B message testing
**What:** For a given audience segment, generate 2-3 message variants (different angles, tones, CTAs) and track open/reply rate per variant.  
**Why:** Systematic improvement loop. Clay and Outreach both have this.  
**What's missing:** Variant generation in AI layer, per-message tracking pixels, statistical significance calculator, UI to view winner  
**Effort:** M

---

*Legend: S = days, M = 1–2 weeks, L = 3–6 weeks, XL = 6+ weeks or team effort*
