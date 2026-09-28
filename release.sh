#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

log "1/5 Git pull (ambil perubahan terbaru)"
if ! git pull --rebase -q; then
  printf '\033[1;31mGagal pull. Ada konflik/ubah lokal? Periksa dulu dengan "git status".\033[0m\n'
  exit 1
fi

if [ ! -f .env.production ]; then
  printf '\033[1;31m.env.production tidak ada. Server butuh DATABASE_URL & JWT_SECRET untuk boot.\033[0m\n'
  exit 1
fi

log "2/5 Build ulang (.next)"
if ! pnpm build; then
  printf '\033[1;33mBuild gagal. Mencoba regenerate Prisma client dulu...\033[0m\n'
  pnpm prisma generate
  pnpm build
fi

# .next/standalone/server.js melakukan process.chdir(__dirname) di baris 6, jadi
# cwd server SELALU .next/standalone - bukan root project. Akibatnya asset & file
# runtime harus disalin/sambungkan ke dalam folder itu, kalau tidak:
#   - semua CSS/JS 404          (.next/static tidak ikut di-output standalone)
#   - semua gambar /uploads 404 (public/ & uploads/ tidak ikut di-output)
log "3/5 Siapkan runtime standalone (static, public, uploads)"
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static
rm -rf .next/standalone/public
cp -r public .next/standalone/public
mkdir -p uploads
rm -rf .next/standalone/uploads
ln -s ../../uploads .next/standalone/uploads

log "4/5 Restart server standalone (port 3000)"
PID="$(ss -ltnp 2>/dev/null | grep ':3000 ' | grep -oP 'pid=\K[0-9]+' | head -1)"
if [ -n "${PID:-}" ]; then
  kill "$PID" 2>/dev/null || true
  sleep 2
fi
# --env-file dipakai karena server standalone TIDAK memuat .env* sendiri.
# HOSTNAME dipaksa 0.0.0.0 karena shell biasanya mengisi HOSTNAME dengan nama
# mesin; kalau dibiarkan, server hanya bind ke IP itu dan cek localhost gagal.
PORT=3000 HOSTNAME=0.0.0.0 nohup node --env-file=.env.production .next/standalone/server.js > /tmp/barokah-server.log 2>&1 &
echo "$!" > /tmp/barokah-server.pid

log "5/5 Cek kesehatan server"
for _ in $(seq 1 15); do
  if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    printf '\033[1;32mWebsite aktif: http://localhost:3000\033[0m\n'
    exit 0
  fi
  sleep 1
done

printf '\033[1;31mServer belum merespon. Cek log: tail -f /tmp/barokah-server.log\033[0m\n'
exit 1