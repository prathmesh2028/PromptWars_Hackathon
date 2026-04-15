# ================================
# Stage 1: Install dependencies
# ================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ================================
# Stage 2: Build the Next.js app
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# ── Build-time env vars ───────────────────────────────────────────────────────
# NEXT_PUBLIC_* vars MUST be set at build time — they get baked into the JS bundle.
# Pass the real backend Cloud Run URL as a build arg when deploying to GCP.
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ================================
# Stage 3: Production runner
# ================================
FROM node:20-alpine AS runner

# Install wget for health checks
RUN apk add --no-cache wget

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only what is needed to run the app (standalone bundle)
COPY --from=builder --chown=appuser:appgroup /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static

USER appuser

# ── Cloud Run: PORT is injected at runtime — default 8080 ────────────────────
# Next.js standalone server.js reads process.env.PORT and process.env.HOSTNAME
EXPOSE 8080

# Shell form so $PORT is expanded from the environment at container start
CMD ["sh", "-c", "PORT=${PORT:-3000} HOSTNAME=0.0.0.0 node server.js"]
