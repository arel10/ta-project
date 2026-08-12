#!/usr/bin/env bash
# ==============================================================================
# Sirkula — One-Time Server Initial Setup Script for Ubuntu 24.04 LTS
# ==============================================================================
set -e

echo "🚀 Starting Sirkula Server Setup on Ubuntu 24.04 LTS..."

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install base dependencies
echo "🛠️ Installing Python, PostgreSQL, Nginx, Git, Certbot..."
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx certbot python3-certbot-nginx git curl build-essential

# 3. Install Node.js 20 LTS
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Installed versions:"
python3 --version
node -v
npm -v
psql --version
nginx -v

# 4. Prepare application directory
APP_DIR="/opt/sirkula"
echo "📁 Setting up application directory at ${APP_DIR}..."
if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
fi

echo "🎉 Server setup complete! Next steps:"
echo " 1. Clone repository to ${APP_DIR}"
echo " 2. Configure PostgreSQL database"
echo " 3. Run deploy/update.sh to build and start services"
