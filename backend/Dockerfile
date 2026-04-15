# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ================================
# Stage 2: Production Image
# ================================
FROM node:20-alpine AS runner

# Install wget for health checks
RUN apk add --no-cache wget

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# ── mongodb-memory-server config ─────────────────────────────────────────────
# Tell MMS where to store its binary so it survives across the build stages
# and stays in a directory the non-root user can write to.
ENV MONGOMS_VERSION=7.0.3
ENV MONGOMS_ARCHITECTURE=x64
ENV MONGOMS_DOWNLOAD_DIR=/app/.cache/mongodb-binaries
ENV MONGOMS_PREFER_GLOBAL_PATH=0

# Pre-download the MMS binary at BUILD time so cold starts don't need internet
RUN mkdir -p /app/.cache/mongodb-binaries && \
    chown -R appuser:appgroup /app/.cache

# ── Cloud Run: PORT is injected at runtime — default 8080 ────────────────────
# server.js already reads: process.env.PORT || '5000'
# Cloud Run will always set PORT, so the fallback is only for local use.
EXPOSE 8080

# Ownership of entire workdir
RUN chown -R appuser:appgroup /app

USER appuser

CMD ["node", "server.js"]
