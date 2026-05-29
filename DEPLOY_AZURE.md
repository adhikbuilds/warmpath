# WarmPath — Azure deployment guide

Target: **free-tier only**, on the sponsored subscription. Frontend + backend as
Azure Container Apps (free monthly grant, scale-to-zero), Postgres on Neon (free),
AI via the existing `droid-llm` Azure OpenAI resource or Anthropic.

> ⚠️ **Money safety.** This subscription is **Azure Sponsorship with the spending
> limit OFF** (billing owner: Aayush Agarwal). A budget alert is **notification
> only — it does NOT stop charges.** Stay on the resources below (all free) and do
> NOT add Azure Container Registry, Postgres Flexible Server, paid App Service, or
> Front Door. Credit balance is visible only at
> <https://www.microsoftazuresponsorships.com/>.

## Architecture

```
Frontend (Next.js)  → Azure Container App  warmpath-frontend   (port 3000)
Backend  (FastAPI)  → Azure Container App  warmpath-intelligence (port 8001)
Database            → Neon Postgres (free, existing)   ← Prisma = system of record
AI                  → droid-llm (Azure OpenAI) OR Anthropic (env-driven)
Registry            → GitHub Container Registry (free, via Actions GITHUB_TOKEN)
All resources in resource group:  warmpath-rg  (Central India)
```

Images are built and pushed by GitHub Actions (`.github/workflows/`) — this avoids
a billable Azure Container Registry. Make each GHCR package **public** so Container
Apps can pull without credentials.

## One-time setup

```bash
SUB=2bc54b19-0eb7-433f-bf87-cdada927fdc9
az account set --subscription $SUB

# 1. Isolated resource group (one-command teardown later)
az group create -n warmpath-rg -l centralindia

# 2. Container Apps environment (shared by both apps)
az extension add --name containerapp --upgrade
az containerapp env create -n warmpath-env -g warmpath-rg -l centralindia

# 3. Service principal for GitHub Actions (scoped to the RG only)
az ad sp create-for-rbac --name warmpath-deploy --role contributor \
  --scopes /subscriptions/$SUB/resourceGroups/warmpath-rg --json-auth
# → paste the JSON into BOTH repos as the AZURE_CREDENTIALS secret
#   (adhikbuilds/warmpath and adhikbuilds/warmpath-intelligence)
```

## App settings / secrets (set once, never in git)

Backend (`warmpath-intelligence`):
```bash
az containerapp secret set -n warmpath-intelligence -g warmpath-rg --secrets \
  database-url="<NEON_POOLED_URL>" \
  service-secret="<SHARED_SECRET>" \
  azure-openai-key="$(az cognitiveservices account keys list -g droid -n droid-llm --query key1 -o tsv)"
az containerapp update -n warmpath-intelligence -g warmpath-rg --set-env-vars \
  DATABASE_URL=secretref:database-url \
  SERVICE_SECRET=secretref:service-secret \
  AI_PROVIDER=azure_openai \
  AZURE_OPENAI_ENDPOINT=https://droid-llm.cognitiveservices.azure.com/ \
  AZURE_OPENAI_API_KEY=secretref:azure-openai-key \
  AZURE_OPENAI_DEPLOYMENT=gpt-4.1-nano
```

Frontend (`warmpath`):
```bash
az containerapp secret set -n warmpath-frontend -g warmpath-rg --secrets \
  database-url="<NEON_POOLED_URL>" \
  nextauth-secret="<openssl rand -base64 32>" \
  service-secret="<SHARED_SECRET>"   # MUST equal backend service-secret
az containerapp update -n warmpath-frontend -g warmpath-rg --set-env-vars \
  DATABASE_URL=secretref:database-url \
  DIRECT_URL=secretref:database-url \
  NEXTAUTH_SECRET=secretref:nextauth-secret \
  NEXTAUTH_URL=https://<frontend-fqdn> \
  INTELLIGENCE_SERVICE_URL=https://<backend-fqdn> \
  INTELLIGENCE_SERVICE_SECRET=secretref:service-secret
```

> `INTELLIGENCE_SERVICE_SECRET` (frontend) **must equal** `SERVICE_SECRET`
> (backend) or every proxied call returns 401.

## Deploy

Push to `develop` on either repo → its workflow builds, pushes to GHCR, and
deploys. Or run **Actions → Deploy → Run workflow** manually.

## Seed the database (Prisma = system of record)

```bash
DATABASE_URL="<NEON_URL>" npx prisma migrate deploy
DATABASE_URL="<NEON_URL>" npm run db:seed
```

## Teardown (removes everything, no leftover billing)

```bash
az group delete -n warmpath-rg --yes --no-wait
```

## Known gaps (decisions for review — see handoff)

- **501 mutation routes.** Collection POSTs (create account/campaign/signal…)
  return 501. Prisma (`"BizAccount"`) and the Python service (`biz_accounts`) use
  **different tables**, so wiring POSTs to Python would write to tables the reads
  never see. Decision deferred: pick one system of record before wiring writes.
- **Python DB-backed endpoints** (dashboard proxy, scoring, sequences) read the
  Python `biz_accounts`-style tables, which are separate from the Prisma data the
  UI renders — they will be sparse until the data layer is unified.
- **Rotate the Neon credential** — it was exposed in a tool transcript.
