#!/usr/bin/env bash
set -euo pipefail

# Restore database PostgreSQL Barokah
# Usage: bash scripts/restore-pg.sh <file.sql.gz>

if [ $# -ne 1 ]; then
  echo "Usage: $0 <file.sql.gz>"
  exit 1
fi
FILE="$1"
if [ ! -f "$FILE" ]; then
  echo "File tidak ditemukan: $FILE"
  exit 1
fi

DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5433}"
DB_USER="${PGUSER:-barokah}"
DB_NAME="${PGNAME:-barokah}"
PGPASSWORD="${PGPASSWORD:-barokah}"

echo "Restore $FILE -> $DB_NAME@$DB_HOST:$DB_PORT"
# Reset koneksi aktif lalu isi ulang
PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c "$FILE" | PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
echo "Restore selesai."
echo "Sinkronkan Prisma client bila versi berubah: pnpm db:deploy"