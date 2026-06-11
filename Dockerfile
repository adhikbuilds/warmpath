# syntax=docker/dockerfile:1
# Next.js 15 (standalone output) production image for Azure Container Apps / any
# container host. next.config.ts already sets output: "standalone".

# ── deps ────────────────────────────────────────────────────────────────────
# This project is bun-native (bun.lock is the source of truth). Building with bun
# avoids npm lockfile drift and React 19 / Tailwind v4 peer-dep conflicts.
FROM oven/bun:1 AS deps
WORKDIR /app
# better-sqlite3 (local-dev SQLite adapter) compiles native bindings via node-gyp.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock* ./
COPY prisma ./prisma
RUN bun install

# ── build ───────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* are inlined into the client bundle at build time — they must be
# passed as build ARGs here, not set as runtime env vars. Defaults match prod.
ARG NEXT_PUBLIC_AI_MODE=azure
ARG NEXT_PUBLIC_DEMO_MODE=false
ENV NEXT_PUBLIC_AI_MODE=$NEXT_PUBLIC_AI_MODE
ENV NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE
# Generate the Prisma client, then build.
RUN bunx prisma generate && bun run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server + static assets + public dir
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma engine + schema + migration files + CLI needed at runtime
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
