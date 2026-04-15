# ================================================================
# SmartVenue AI — Hardened Standalone Dockerfile
# ----------------------------------------------------------------
# Optimized for Next.js Standalone + Express Sidebar Proxy.
# ================================================================

# ── Stage 1: Build Next.js ───────────────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ── Stage 2: Backend Dependencies ───────────────────────────────
FROM node:20-slim AS backend-deps
WORKDIR /build/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm install --omit=dev

# ── Stage 3: Runner ──────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# Non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy Backend logic
COPY --chown=appuser:appgroup backend/ ./backend/
COPY --from=backend-deps /build/backend/node_modules ./backend/node_modules

# Copy Next.js Standalone artifacts
# 1. The main server bundle
COPY --from=frontend-builder --chown=appuser:appgroup /build/frontend/.next/standalone ./frontend/
# 2. Static assets (required by standalone server.js)
COPY --from=frontend-builder --chown=appuser:appgroup /build/frontend/.next/static    ./frontend/.next/static
COPY --from=frontend-builder --chown=appuser:appgroup /build/frontend/public          ./frontend/public

# Application Entry Point
COPY --chown=appuser:appgroup start.sh ./start.sh
RUN chmod +x ./start.sh

USER appuser

# Standard Port for Cloud Run
EXPOSE 8080

CMD ["sh", "/app/start.sh"]
