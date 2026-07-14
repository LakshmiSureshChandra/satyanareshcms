# Going Live on Hostinger — Deploy Runbook

## PART 1 — What to get from the client (NKG Online)

Send them this list. Nothing here is optional except where marked.

### 1. Hostinger VPS access  ⚠️ MUST be a VPS, not shared hosting
This stack is Node.js (Next.js + Express). **Hostinger's shared / "Web Hosting" / "Cloud Hosting"
plans run PHP only and cannot run this app.** The client must have a **VPS plan** (KVM 1 or higher).
- If they have a VPS: **server IP address**, **SSH username** (usually `root`), and the **root
  password** (or an SSH key you add).
- If they only have shared/PHP hosting: they need to buy/upgrade to a Hostinger **VPS** first.
  Flag this immediately — it blocks everything.
- Alternatively: their **Hostinger hPanel login** for the VPS, so you can read/reset the root
  password and manage it yourself.

### 2. Domain / DNS control (to point a name at the server)
- Access to wherever **akganesh.com**'s DNS is managed (Hostinger hPanel, or the registrar —
  GoDaddy/Namecheap/etc. if registered elsewhere).
- You'll add one **A record** → the VPS IP.
- For a **demo that doesn't disturb their current site**, use a subdomain like
  **demo.akganesh.com** (add an A record for `demo`). Recommended for the client preview.

### 3. Email / SMTP  (for the contact form + admin password-reset emails)
- One mailbox on their domain, e.g. **noreply@akganesh.com** or **contact@akganesh.com**,
  created in Hostinger Email (hPanel → Emails).
- From it you need: **SMTP host** (usually `smtp.hostinger.com`), **port** (`465`),
  **username** (the full email), **password**.
- Not blocking — the site runs without it; the contact form and password reset just won't
  send mail until these are filled in.

### 4. Optional / can be added later in the admin panel
- **Google Analytics** GA4 snippet (if they want traffic stats) — paste later in Settings.
- **Logo / favicon** image files — upload later in Settings.
- Real content — not needed; the site ships with sample Telugu posts you can delete.

### You do NOT need from them
- Database credentials — MySQL is installed on the VPS and you create the DB + user.
- An SSL certificate — Caddy issues one automatically (free, Let's Encrypt).

---

## PART 2 — Deploy steps (run on the VPS over SSH)

Assumes Ubuntu 22/24 on a Hostinger VPS. Replace `DEMO_DOMAIN` with your chosen hostname
(e.g. `demo.akganesh.com`) and the DB password.

```bash
# --- 0. DNS (do this first, in the DNS panel) ---
#   Add an A record:  demo  ->  <VPS_IP>     (wait a few min for it to propagate)

# --- 1. SSH in ---
ssh root@<VPS_IP>

# --- 2. System dependencies ---
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs git mysql-server
npm i -g pm2
# Caddy (auto-HTTPS reverse proxy):
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

# --- 3. Database ---
mysql -e "CREATE DATABASE akganesh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
          CREATE USER 'akganesh'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PW';
          GRANT ALL ON akganesh.* TO 'akganesh'@'localhost'; FLUSH PRIVILEGES;"

# --- 4. Get the code ---
mkdir -p /var/www && cd /var/www
git clone <YOUR_REPO_URL> akganesh   # or scp/rsync the project folder up
cd akganesh
npm install

# --- 5. Environment ---
# apps/api/.env
cat > apps/api/.env <<'EOF'
DATABASE_URL="mysql://akganesh:CHANGE_ME_STRONG_PW@localhost:3306/akganesh"
JWT_SECRET="<paste a long random string>"
REVALIDATE_TOKEN="<paste another random string>"
WEB_URL="https://DEMO_DOMAIN"
PORT=4000
# SMTP (fill when the client sends mailbox creds)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@akganesh.com
SMTP_PASS=<mailbox password>
SMTP_FROM=noreply@akganesh.com
EOF

# apps/web/.env  (NEXT_PUBLIC_* are baked at build time — set before building)
cat > apps/web/.env <<'EOF'
API_URL=http://127.0.0.1:4000
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=https://DEMO_DOMAIN
JWT_SECRET=<same as apps/api JWT_SECRET>
REVALIDATE_TOKEN=<same as apps/api REVALIDATE_TOKEN>
EOF

# --- 6. Database schema + sample content ---
cd apps/api && npx prisma migrate deploy && npm run seed && cd ../..

# --- 7. Build the site (API must be up first — the build pre-renders from it) ---
pm2 start ecosystem.config.js --only akganesh-api
npm run build --workspace=apps/web

# --- 8. Start everything + survive reboot ---
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # run the line it prints

# --- 9. Reverse proxy + SSL ---
#   Edit the Caddyfile in the repo: replace akganesh.com/www.akganesh.com with DEMO_DOMAIN
cp Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy      # Caddy fetches a Let's Encrypt cert automatically

# --- 10. Backups (see the dedicated section below for the full strategy) ---
chmod +x scripts/backup.sh
mkdir -p /backups
echo '0 3 * * * root /var/www/akganesh/scripts/backup.sh >> /var/log/akganesh-backup.log 2>&1' \
  > /etc/cron.d/akganesh-backup
```

Open **https://DEMO_DOMAIN** — the site is live. Admin at **https://DEMO_DOMAIN/admin/login**
(`admin@akganesh.com` / `Admin@123` — **change this password immediately** in the admin, and
delete the sample posts before showing the client if you want a clean slate).

### Redeploy after code changes
```bash
cd /var/www/akganesh && git pull && npm install
npm run build --workspace=apps/web && pm2 restart all
```

### Firewall
Make sure ports **80** and **443** are open (Hostinger hPanel → VPS → Firewall, or `ufw allow 80,443/tcp`).
Ports 3000/4000 stay internal — never expose them; Caddy is the only public entry.

---

## PART 3 — Backups (do all three layers)

The database and images live on the VPS. A backup on the *same* server protects against
mistakes but not against losing the server itself. Use all three layers:

**Layer 1 — nightly dump on the VPS** (`scripts/backup.sh`, wired in step 10).
Backs up the **database AND `apps/api/uploads/`** (images are on disk, not in the DB — a
DB-only backup restores with broken images). Keeps the last 14 days, auto-prunes older ones.
Protects against: bad deploys, accidental deletes, data corruption.

**Layer 2 — Hostinger server snapshots.** In hPanel → VPS → **Backups/Snapshots**, enable
automatic backups (weekly full-server image, one-click restore). Usually included on VPS
plans or a small add-on. Protects against: full disk/server failure.

**Layer 3 — off-site copy** (the one that survives losing the whole Hostinger account).
Install rclone, point it at cheap object storage (Backblaze B2 ~₹0.5/GB/mo, or Google Drive),
and set `RCLONE_REMOTE` in `scripts/backup.sh`:
```bash
apt install -y rclone
rclone config          # add a remote named e.g. "b2", create a bucket
# then edit scripts/backup.sh:  RCLONE_REMOTE="b2:akganesh-backups"
```
Now every nightly run also pushes the DB + uploads off-site automatically.

### Restore procedure (test this once before the client relies on it)
```bash
# database
gunzip < /backups/db-YYYY-MM-DD_HHMM.sql.gz | mysql akganesh
# images
tar -xzf /backups/uploads-YYYY-MM-DD_HHMM.tar.gz -C /var/www/akganesh/apps/api/
pm2 restart all
```

**Recommendation for this project:** Layers 1 + 2 are the minimum; add Layer 3 (off-site)
since the client's entire site lives on this one server — it's a few rupees a month for real
disaster recovery. Run `scripts/backup.sh` manually once after deploy to confirm it works,
then verify the restore steps on a throwaway copy.
