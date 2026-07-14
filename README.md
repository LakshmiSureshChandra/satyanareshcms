# AK Ganesh — Telugu News CMS

Next.js (public site + admin panel) · Express.js API · MySQL. Monorepo with npm workspaces.

```
apps/api   Express + Prisma  (port 4000) — REST API, auth, image uploads
apps/web   Next.js           (port 3000) — public site (ISR/SSR) + /admin panel
```

## Local development

Requirements: Node 20+, MySQL 8+.

```bash
# 1. database
mysql -uroot -e "CREATE DATABASE akganesh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 2. install
npm install

# 3. env — copy and edit
cp apps/api/.env.example apps/api/.env     # DATABASE_URL, JWT_SECRET, SMTP…
# apps/web/.env: API_URL, NEXT_PUBLIC_API_URL, JWT_SECRET (same), REVALIDATE_TOKEN (same)

# 4. schema + sample data
cd apps/api && npx prisma migrate dev && npm run seed && cd ../..

# 5. run both
npm run dev --workspace=apps/api    # :4000
npm run dev --workspace=apps/web    # :3000
```

Admin: `http://localhost:3000/admin` — `admin@akganesh.com` / `Admin@123` (change immediately).

## Deploying to Hostinger VPS (Ubuntu 22/24)

```bash
# once: system deps
apt update && apt install -y mysql-server debian-keyring debian-archive-keyring
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs
npm i -g pm2
# caddy (auto-SSL): https://caddyserver.com/docs/install#debian-ubuntu-raspbian

# database
mysql -e "CREATE DATABASE akganesh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
          CREATE USER 'akganesh'@'localhost' IDENTIFIED BY '<strong-pw>';
          GRANT ALL ON akganesh.* TO 'akganesh'@'localhost';"

# app
git clone <repo> /var/www/akganesh && cd /var/www/akganesh
npm install
# apps/api/.env  → DATABASE_URL, strong JWT_SECRET + REVALIDATE_TOKEN,
#                  WEB_URL=https://akganesh.com, SMTP_* (Hostinger email)
# apps/web/.env  → API_URL=http://127.0.0.1:4000 (server-side fetch),
#                  NEXT_PUBLIC_API_URL=https://akganesh.com (browser, same origin via Caddy),
#                  NEXT_PUBLIC_SITE_URL=https://akganesh.com, same JWT_SECRET/REVALIDATE_TOKEN
cd apps/api && npx prisma migrate deploy && npm run seed && cd ../..

# start the API first — the web build pre-renders pages by fetching from it
pm2 start ecosystem.config.js --only akganesh-api
npm run build --workspace=apps/web

# processes + proxy
pm2 start ecosystem.config.js && pm2 save && pm2 startup
cp Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy

# nightly DB backup (03:00)
echo '0 3 * * * root mysqldump akganesh | gzip > /backups/akganesh-$(date +\%F).sql.gz' > /etc/cron.d/akganesh-backup
```

Redeploy after changes: `git pull && npm install && npm run build --workspace=apps/web && pm2 restart all`.
Uploaded images live in `apps/api/uploads/` — excluded from git, survives redeploys; include in backups.

## Architecture notes

- **One `posts` table** holds posts and pages (`type` column), mirroring the original CMS.
- **Slugs** auto-generate from Telugu titles via transliteration (`any-ascii`), deduped `-2`, `-3`…
- **ISR**: public pages cache (home 5 min, articles 1 h) and the API pings
  `POST /api/revalidate` on the web app after every admin change for instant updates.
- **Auth**: bcrypt + JWT (7d) in an httpOnly cookie; Next middleware guards `/admin`,
  Express enforces roles (`admin` = everything; `manager` = content only).
- **Roles**: admin → users/menus/settings/recycle-bin; manager → posts/pages/categories/banners.
- **Images**: uploaded via admin, resized to WebP (sharp), served from `/uploads`.
- **Settings** (key/value): site identity, social links, GA snippet (cookie-consent-gated),
  robots.txt, homepage hero/featured category pickers.

## Not included (by scope)

Comments, automated test suite, image CDN, multi-language UI, data migration from the old site.
