FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /app

# ── Install dependencies ─────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/db/package.json lib/db/
COPY lib/api-spec/package.json lib/api-spec/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-zod/package.json lib/api-zod/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/packet-path/package.json artifacts/packet-path/
COPY scripts/package.json scripts/
# Copy any other workspace packages that may exist
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/
RUN pnpm install --frozen-lockfile

# ── Build frontend ────────────────────────────────────────────────────────────
FROM deps AS build-frontend
COPY . .
RUN pnpm --filter @workspace/packet-path run build

# ── Build backend ─────────────────────────────────────────────────────────────
FROM deps AS build-backend
COPY . .
RUN pnpm --filter @workspace/api-server run build

# ── Production image ──────────────────────────────────────────────────────────
FROM base AS production
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/db/package.json lib/db/
COPY lib/api-spec/package.json lib/api-spec/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-zod/package.json lib/api-zod/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/packet-path/package.json artifacts/packet-path/
COPY scripts/package.json scripts/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/
RUN pnpm install --frozen-lockfile --prod

# Copy built backend
COPY --from=build-backend /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Copy built frontend into backend's dist/public so Express serves it
COPY --from=build-frontend /app/artifacts/packet-path/dist/public ./artifacts/api-server/dist/public

# Copy lib sources (needed at runtime by drizzle/db)
COPY lib/ ./lib/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
