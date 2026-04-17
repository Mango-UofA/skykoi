#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/skykoi/app"

sudo apt-get update
sudo apt-get install -y nginx git curl

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

sudo mkdir -p /var/www/skykoi
sudo chown -R "$USER:$USER" /var/www/skykoi
mkdir -p "$APP_DIR"

sudo systemctl enable nginx
sudo systemctl start nginx

echo "Bootstrap complete."
