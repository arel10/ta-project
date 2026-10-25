#!/usr/bin/env bash
# ==============================================================================
# Sirkula — 1-Click Docker Production Deployment & Update Script
# ==============================================================================
set -e

APP_DIR="/opt/sirkula"
cd "$APP_DIR"

echo "🔄 [1/4] Pulling latest git changes..."
git pull origin main

echo "🐳 [2/4] Building & starting Docker services in background..."
docker compose up -d --build

echo "🧹 [3/4] Cleaning unused dangling images..."
docker image prune -f

echo "⏳ [4/4] Verifying services health..."
sleep 5

if curl -s http://127.0.0.1:5000/api/health | grep -q '"status":"healthy"'; then
    echo "🎉 Sirkula Docker Deployment Successful & Healthy!"
else
    echo "⚠️ Warning: backend health check pending. Check logs with:"
    echo "   docker compose logs -f backend-api"
fi
