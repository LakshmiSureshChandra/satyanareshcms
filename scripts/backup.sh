#!/usr/bin/env bash
# Nightly backup for the AK Ganesh CMS.
# Backs up BOTH the database and the uploaded images, keeps a rolling window,
# and (optionally) pushes an off-site copy so the data survives losing the VPS.
#
# Install:  see DEPLOY.md "Backups". Run as root via cron.
set -euo pipefail

# ---- config (edit these) ----
DB_NAME="akganesh"
UPLOADS_DIR="/var/www/akganesh/apps/api/uploads"
BACKUP_DIR="/backups"
RETENTION_DAYS=14
# Off-site: set to an rclone remote:path to enable (e.g. "b2:akganesh-backups").
# Leave empty to keep backups only on this server (layer 1 only — see DEPLOY.md).
RCLONE_REMOTE=""

# ---- run ----
STAMP="$(date +%F_%H%M)"
mkdir -p "$BACKUP_DIR"

# 1. database
mysqldump --single-transaction --quick "$DB_NAME" | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

# 2. uploaded images (not in the DB — restoring without these = broken images)
if [ -d "$UPLOADS_DIR" ]; then
  tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
fi

# 3. retention: delete local backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name 'db-*.sql.gz'      -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime "+$RETENTION_DAYS" -delete

# 4. off-site copy (the layer that survives losing the whole VPS)
if [ -n "$RCLONE_REMOTE" ] && command -v rclone >/dev/null; then
  rclone copy "$BACKUP_DIR/db-$STAMP.sql.gz"      "$RCLONE_REMOTE" --quiet
  rclone copy "$BACKUP_DIR/uploads-$STAMP.tar.gz" "$RCLONE_REMOTE" --quiet 2>/dev/null || true
fi

echo "backup ok: $STAMP"
