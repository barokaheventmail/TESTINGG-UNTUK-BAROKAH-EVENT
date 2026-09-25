#!/usr/bin/env bash
set -euo pipefail

# Backup database PostgreSQL Barokah (dev: Docker port 5433)
# Output: backups/barokah-YYYYMMDD-HHMMSS.sql.gz

DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5433}"
DB_USER="${PGUSER:-barokah}"
DB_NAME="${PGNAME:-barokah}"
PGPASSWORD="${PGPASSWORD:-barokah}"

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/barokah-$STAMP.sql.gz"

echo "Mengambil backup $DB_NAME@$DB_HOST:$DB_PORT -> $OUT"
PGPASSWORD="$PGPASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --no-owner | gzip > "$OUT"

echo "Selesai. Backup terbaru:"
ls -lh "$OUT"

# Simpan daftar tugas: pras_delete terlama >14 hari
find "$BACKUP_DIR" -name 'barokah-*.sql.gz' -mtime +14 -delete
echo "Backup lebih dari 14 hari dibersihkan otomatis."