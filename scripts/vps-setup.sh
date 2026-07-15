#!/usr/bin/env bash
# One-shot VPS deploy for the AK Ganesh CMS (Ubuntu 22/24, run as root).
# Installs Node + MySQL + Caddy + PM2, sets up the database, clones the repo,
# builds, starts both apps, and puts them behind HTTPS.
#
# Run like this (fill in your two values):
#   DOMAIN=akganesh.com DB_PASSWORD=YourStrongPass123 bash vps-setup.sh
#
# DB_PASSWORD: letters + numbers only (no symbols/spaces).
set -euo pipefail

REPO="${REPO:-https://github.com/LakshmiSureshChandra/satyanareshcms.git}"
APP_DIR="${APP_DIR:-/var/www/akganesh}"
# DOMAIN defaults to this server's public IP (serves over HTTP). Pass a real
# domain later (DOMAIN=akganesh.com) to serve over HTTPS.
DOMAIN="${DOMAIN:-$(curl -s4 ifconfig.me 2>/dev/null || curl -s4 https://api.ipify.org 2>/dev/null || hostname -I | tr ' ' '\n' | grep -E '^[0-9]+\.' | head -1)}"
DB_NAME="${DB_NAME:-akganesh}"
DB_USER="${DB_USER:-akganesh}"
DB_PASSWORD="${DB_PASSWORD:?Set DB_PASSWORD (letters+numbers only)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
REVALIDATE_TOKEN="${REVALIDATE_TOKEN:-$(openssl rand -hex 24)}"
export DEBIAN_FRONTEND=noninteractive

# HTTPS for a real domain (cert covers apex + www); plain HTTP for a bare IP.
if echo "$DOMAIN" | grep -qE '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; then
  PUBLIC_URL="http://${DOMAIN}"; CADDY_SITE=":80"
else
  PUBLIC_URL="https://${DOMAIN}"; CADDY_SITE="${DOMAIN}, www.${DOMAIN}"
fi
echo "==> Deploying for: ${PUBLIC_URL}"

echo "==> [1/8] System packages"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git mysql-server ufw

echo "==> [2/8] Node.js 20 + PM2"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//;s/\..*//')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

echo "==> [3/8] Caddy (reverse proxy + auto HTTPS)"
if ! command -v caddy >/dev/null 2>&1; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y && apt-get install -y caddy
fi

echo "==> [4/8] MySQL database + user"
systemctl enable --now mysql
mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

echo "==> [5/8] Get the code"
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then git -C "$APP_DIR" pull --ff-only; else git clone "$REPO" "$APP_DIR"; fi
cd "$APP_DIR"
npm install

echo "==> [6/8] Environment files"
cat > apps/api/.env <<EOF
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/${DB_NAME}"
JWT_SECRET="${JWT_SECRET}"
REVALIDATE_TOKEN="${REVALIDATE_TOKEN}"
WEB_URL="${PUBLIC_URL}"
PORT=4000
EOF
cat > apps/web/.env <<EOF
API_URL=http://127.0.0.1:4000
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=${PUBLIC_URL}
JWT_SECRET=${JWT_SECRET}
REVALIDATE_TOKEN=${REVALIDATE_TOKEN}
EOF

echo "==> [7/8] Start API (auto-migrates + seeds), build + start web"
pm2 delete akganesh-api akganesh-web >/dev/null 2>&1 || true
pm2 start ecosystem.config.js --only akganesh-api
sleep 8   # let it create tables + seed before the build reads from it
npm run build --workspace=apps/web
pm2 start ecosystem.config.js --only akganesh-web
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "==> [8/8] Caddy reverse proxy + firewall"
cat > /etc/caddy/Caddyfile <<EOF
${CADDY_SITE} {
	handle /api/* {
		reverse_proxy 127.0.0.1:4000
	}
	handle /uploads/* {
		reverse_proxy 127.0.0.1:4000
	}
	handle {
		reverse_proxy 127.0.0.1:3000
	}
	encode gzip
}
EOF
systemctl reload caddy || systemctl restart caddy
ufw allow 22/tcp >/dev/null 2>&1 || true
ufw allow 80,443/tcp >/dev/null 2>&1 || true

echo ""
echo "=================================================="
echo " DONE.  Site:  ${PUBLIC_URL}"
echo " Admin:  ${PUBLIC_URL}/admin/login"
echo "         admin@akganesh.com / Admin@123  (change it!)"
echo "=================================================="
