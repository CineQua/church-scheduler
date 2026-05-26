# ─── Stage 1: build the React frontend ──────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: runtime (Express API + static frontend + SQLite) ───────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
# SQLite lives on the mounted /data volume so it persists across deploys.
ENV DATABASE_PATH=/data/church-scheduler.sqlite

# Install production dependencies only (includes tsx, express, better-sqlite3)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# App code: built frontend, server, and the source files the server imports
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY src ./src
COPY tsconfig.json ./

# Persistent data directory — mount a named volume or host path here so the
# database survives container restarts and redeploys.
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3001
CMD ["npx", "tsx", "server/index.ts"]
