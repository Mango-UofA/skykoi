#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/skykoi/app}"
REPO_URL="${REPO_URL:-https://github.com/Mango-UofA/skykoi.git}"

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin main
  git -C "$APP_DIR" reset --hard origin/main
fi

cd "$APP_DIR"

if [ -n "${BACKEND_ENV:-}" ]; then
  printf '%s\n' "$BACKEND_ENV" > backend/.env
fi

if [ -n "${FRONTEND_ENV_PRODUCTION:-}" ]; then
  printf '%s\n' "$FRONTEND_ENV_PRODUCTION" > frontend/.env.production
fi

cd backend
npm ci

cd ../frontend
npm ci
npm run build

cd ..
pm2 startOrReload backend/ecosystem.config.cjs --update-env
pm2 save

sudo cp deploy/nginx/skykoi.conf /etc/nginx/sites-available/skykoi
sudo ln -sfn /etc/nginx/sites-available/skykoi /etc/nginx/sites-enabled/skykoi
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "Deploy complete."
