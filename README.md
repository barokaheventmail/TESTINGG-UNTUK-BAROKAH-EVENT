# Barokah Tour and Travel — Website + Sistem Event QR Absensi

Next.js (App Router) 16 + Prisma + PostgreSQL. URL utama: `http://localhost:3000`.

## Alur utama
- **Publik**: halaman event → kotak **Cari Nama Peserta** → ketik nama → **Lihat Tiket & QR** → tunjukkan QR ke crew. (Pencarian di hero beranda sengaja non-aktif.)
- **Crew**: buka `/crew` (login) → scan QR kamera → kehadiran **otomatis tercatat**.
- **Admin**: buka `/admin` (login) → kelola event, **import Excel** (1 sheet = 1 bus), lihat daftar/hadir, **Cetak QR**.

Akun awal (dari `.env`): admin / `admin123` dan crew / `crew123`.

## Persyaratan
- Node 20+, pnpm, Docker (untuk Postgres lokal).

## Menjalankan di laptop (development)

```bash
pnpm install

# 1. Siapkan environment
cp .env.example .env      # lalu isi DATABASE_URL & JWT_SECRET

# 2. Nyalakan Postgres (Docker, port host 5433)
pnpm db:up

# 3. Buat tabel database + seed 2 user
pnpm db:migrate          # prisma migrate dev
pnpm db:seed             # membuat admin & crew

# 4. Jalankan aplikasi
pnpm dev                 # localhost:3000
```

Cek kesehatan: `GET /api/health` → `{ "status": "ok", "db": "ok" }`.

## Format file Excel import
- **1 sheet = 1 bus** (nama sheet menjadi nama bus, mis. `Bus 1`, `Bus 2`).
- Kolom (baris pertama header, urutan bebas):
  `No`, `Nama Lengkap`, `Tempat Lahir`, `Tanggal Lahir`, `No Telp/Hp`, `No Kursi`, `No Kamar`, `No VW`.
- Tanggal Lahir: `dd/mm/yyyy`, `dd-mm-yyyy`, atau `yyyy-mm-dd`.
- Baris tanpa Nama dibuang. Import ulang **tidak menggandakan** (dicocokkan via No + bus).
- Template: `/api/admin/template` (atau tombol **Unduh template Excel** di panel admin).

## Deploy (Hostinger / VPS)
1. Siapkan Postgres (mis. Hostinger Database), set `DATABASE_URL` dan `JWT_SECRET` yang kuat.
2. `pnpm install && pnpm build`
3. Terapkan migration: `pnpm db:deploy` (`prisma migrate deploy`)
4. Jalankan production: `pnpm start` (atau PM2/systemd).

Untuk Vercel: cukup set env yang sama, pakai Postgres managed (bukan Docker).

## Backup & restore Postgres
Skrip disediakan di `scripts/`:

```bash
# Backup ke file (default: backups/barokah-YYYYMMDD-HHMMSS.sql.gz)
bash scripts/backup-pg.sh

# Restore dari file backup
bash scripts/restore-pg.sh backups/barokah-20260925-120000.sql.gz
```

Saran: jadwalkan `backup-pg.sh` via cron/systemd timer setiap hari.

## Operasional & monitoring
- **Log terstruktur** (JSON di production) untuk: login, import Excel, scan, dan error — lihat log proses (PM2/log systemd).
- **Health check**: `/api/health` (cek DB + uptime) — cocok untuk uptime monitor.
- **Audit**: semua aksi admin & scan tersimpan di tabel `ActivityLog` / `ScanLog`.
- **Dashboard admin** = ops panel: rekap hadir per bus & daftar peserta waktu nyata.

## Struktur penting
```
app/
  api/admin/...       # panel admin (CRUD event, import, peserta, template)
  api/crew/scan       # API scan (valid → otomatis centang, anti-ganda)
  api/public/search   # pencarian nama publik
  api/auth/*          # login/logout/sesi
  admin/...           # halaman panel admin (+ cetak QR)
  crew/               # halaman scanner crew
  tiket/[token]       # tiket publik ber-QR
  login/              # halaman login admin & crew
lib/                  # db, auth (JWT), excel, logger, scan/Qr, dates
prisma/schema.prisma  # data model
middleware.ts         # proteksi /admin (ADMIN) & /crew (CREW)
```

## Perintah umum
| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | dev server |
| `pnpm build` / `pnpm start` | build & run production |
| `pnpm db:up` / `pnpm db:migrate` / `pnpm db:seed` | database |
| `pnpm db:studio` | Prisma Studio (navigate DB) |

## Catatan keamanan
- Session JWT httpOnly cookie, 7 hari. Ganti `JWT_SECRET` di production.
- Rol ADMIN hanya bisa akses `/admin`; CREW + ADMIN bisa `/crew`.
- QR memuat token unik per peserta (`BTHT:<token>`); token tak bisa ditebak.
- Rate-limit publik bisa ditambahkan di depan `/api/public/search` saat trafik besar.