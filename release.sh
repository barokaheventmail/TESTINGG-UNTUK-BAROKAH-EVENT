#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

log "1/4 Git pull (ambil perubahan terbaru)"
if ! git pull --rebase -q; then
  printf '\033[1;31mGagal pull. Ada konflik/ubah lokal? Periksa dulu dengan "git status".\033[0m\n'
  exit 1
fi

log "2/4 Build ulang (.next)"
if ! pnpm build; then
  printf '\033[1;33mBuild gagal. Mencoba regenerate Prisma client dulu...\033[0m\n'
  pnpm prisma generate
  pnpm build
fi

log "3/4 Restart server (port 3000)"
PID="$(ss -ltnp 2>/dev/null | grep ':3000 ' | grep -oP 'pid=\K[0-9]+' | head -1)"
if [ -n "${PID:-}" ]; then
  kill "$PID" 2>/dev/null || true
  sleep 2
fi
nohup pnpm start > /tmp/barokah-server.log 2>&1 &
echo "$!" > /tmp/barokah-server.pid

log "4/4 Cek kesehatan server"
for _ in $(seq 1 15); do
  if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    printf '\033[1;32mWebsite aktif: http://localhost:3000\033[0m\n'
    exit 0
  fi
  sleep 1
done

printf '\033[1;31mServer belum merespon. Cek log: tail -f /tmp/barokah-server.log\033[0m\n'
exit 1