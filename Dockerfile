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
ENV DATABASE_PATH=/app/data/church.db

# Install production dependencies only (includes tsx, express, better-sqlite3)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# App code: built frontend, server, and the source files the server imports
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY src ./src
COPY tsconfig.json ./

# SQLite database lives on a mounted volume so data persists across restarts
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3001
CMD ["npx", "tsx", "server/index.ts"]
