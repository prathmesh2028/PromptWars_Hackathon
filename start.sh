#!/bin/sh
# ================================================================
# SmartVenue AI — Production Startup Script
# ================================================================

set -e

echo "🚀 Launching SmartVenue AI Service Layer..."

# 1. Start Next.js internal core (internal port 3000)
# Express will proxy requests to this process
echo "▶  Starting Frontend Framework (Standalone mode)..."
HOSTNAME=0.0.0.0 PORT=3000 node /app/frontend/server.js &
FRONTEND_PID=$!

# 2. Start Express Gateway (Cloud Run PORT)
# exec ensures the node process receives system signals directly
echo "▶  Starting Express Gateway (port ${PORT:-8080})..."
exec node /app/backend/server.js
