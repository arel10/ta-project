#!/usr/bin/env bash
# ==============================================================================
# Sirkula — Continuous Deployment / Update Script
# ==============================================================================
set -e

APP_DIR="/opt/sirkula"
cd "$APP_DIR"

echo "🔄 [1/5] Pulling latest source code..."
git pull origin main

echo "🐍 [2/5] Deploying Backend API..."
cd "$APP_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
mkdir -p uploads/ktp uploads/rewards
flask db upgrade
deactivate

echo "🤖 [3/5] Deploying ML Service..."
cd "$APP_DIR/ml-service"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate

echo "🖥️ [4/5] Building Admin Dashboard..."
cd "$APP_DIR/admin"
npm ci
npm run build

echo "♻️ [5/5] Restarting Systemd Services..."
sudo systemctl restart sirkula-backend sirkula-ml sirkula-admin

echo "🔍 Running Health Verification..."
sleep 2
if curl -s http://127.0.0.1:5000/api/health | grep -q '"status":"healthy"'; then
    echo "✅ Sirkula Deployment Successful & Verified Healthy!"
else
    echo "⚠️ Backend health status check returned non-healthy response. Check logs:"
    echo "   sudo journalctl -u sirkula-backend -n 50 --no-pager"
fi
