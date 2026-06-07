#!/usr/bin/env bash
# Deploy Twenty CRM (self-hosted) to Azure Container Apps
#
# Twenty.com is an open-source CRM. Hosting it yourself means your contacts
# and accounts stay in your own Azure environment, and WarmPath can pull from
# it via the Twenty GraphQL API.
#
# Prerequisites:
#   - az CLI logged in (az login)
#   - Docker running (for the Twenty images)
#   - jq installed
#
# Usage:
#   ./scripts/deploy-twenty-azure.sh
#
# After running, copy TWENTY_API_URL and TWENTY_API_KEY into GitHub secrets
# so the WarmPath deploy workflow can connect to it.

set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-warmpath-rg}"
LOCATION="${LOCATION:-centralindia}"
CONTAINER_ENV="${CONTAINER_ENV:-warmpath-env}"
APP_NAME="twenty-crm"
SERVER_IMAGE="twentycrm/twenty:latest"

echo "=== Deploying Twenty CRM to Azure Container Apps ==="
echo "Resource group : $RESOURCE_GROUP"
echo "Location       : $LOCATION"
echo "Container env  : $CONTAINER_ENV"
echo ""

# ─── 1. Ensure container app environment exists ────────────────────────────────
if ! az containerapp env show --name "$CONTAINER_ENV" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  echo "[1/5] Creating Container App environment..."
  az containerapp env create \
    --name "$CONTAINER_ENV" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --only-show-errors
else
  echo "[1/5] Container App environment already exists — skipping."
fi

# ─── 2. Generate secrets ───────────────────────────────────────────────────────
echo "[2/5] Generating secrets..."
APP_SECRET=$(openssl rand -hex 32)
# Twenty uses a Postgres DB — reuse Neon or prompt for a separate URL
if [ -z "${TWENTY_DB_URL:-}" ]; then
  echo ""
  echo "⚠️  TWENTY_DB_URL is not set."
  echo "   Twenty needs its own PostgreSQL database (separate from WarmPath's)."
  echo "   Options:"
  echo "     a) Create a free Neon project at https://neon.tech and paste the connection string"
  echo "     b) Use an existing Azure PostgreSQL instance"
  echo ""
  read -r -p "Paste your PostgreSQL connection string for Twenty: " TWENTY_DB_URL
fi

# ─── 3. Deploy Twenty server ───────────────────────────────────────────────────
echo "[3/5] Deploying Twenty server container..."
az containerapp up \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --environment "$CONTAINER_ENV" \
  --image "$SERVER_IMAGE" \
  --target-port 3000 \
  --ingress external

# Get FQDN before update so SERVER_URL is correct
TWENTY_FQDN_EARLY=$(az containerapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" \
  -o tsv)

az containerapp update \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --min-replicas 0 \
  --set-env-vars \
    "NODE_ENV=production" \
    "SERVER_URL=https://${TWENTY_FQDN_EARLY}" \
    "PG_DATABASE_URL=${TWENTY_DB_URL}" \
    "APP_SECRET=${APP_SECRET}" \
    "SIGN_IN_PREFILLED=false" \
    "STORAGE_TYPE=local" \
  --only-show-errors

# ─── 4. Get the deployed URL ───────────────────────────────────────────────────
echo "[4/5] Fetching deployed URL..."
TWENTY_FQDN=$(az containerapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" \
  -o tsv)

TWENTY_API_URL="https://${TWENTY_FQDN}/api"

echo ""
echo "=== Twenty CRM deployed! ==="
echo ""
echo "Twenty URL  : https://${TWENTY_FQDN}"
echo "Twenty API  : ${TWENTY_API_URL}"
echo ""

# ─── 5. Create an API key ──────────────────────────────────────────────────────
echo "[5/5] Next steps:"
echo ""
echo "  1. Open https://${TWENTY_FQDN} in your browser"
echo "  2. Create your admin account"
echo "  3. Go to Settings → API & Webhooks → Generate API Key"
echo "  4. Copy the key and add these two secrets to your GitHub repo:"
echo ""
echo "     TWENTY_API_URL = ${TWENTY_API_URL}"
echo "     TWENTY_API_KEY = <your-api-key-from-step-3>"
echo ""
echo "  5. Push to develop — WarmPath will auto-connect on next deploy."
echo ""
echo "  The WarmPath Integrations page will show 'Connected' once the"
echo "  env vars are set. Click 'Sync now' to pull your CRM data."
