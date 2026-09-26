import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArrowLeft, History, ScanBarcode, Search } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { requireCrewSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatWaktuLengkap } from '@/lib/dates'
import { SessionGuard } from '@/components/crew/session-guard'
import { LogoutButton } from '@/components/admin/logout-button'

export const metadata: Metadata = { title: 'Riwayat Scan – Barokah Tour', robots: { index: false } }
export const dynamic = 'force-dynamic'

const PER_PAGE = 50
type SearchParams = Promise<{ page?: string; q?: string }>

export default async function CrewRiwayatPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireCrewSession()
  if (!session) redirect('/login?scope=CREW&next=/crew/riwayat')

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) : ''
  const userId = session.sub

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const logWhere: Prisma.ScanLogWhereInput = q
    ? { userId, participant: { name: { contains: q, mode: 'insensitive' } } }
    : { userId }

  const [logs, total, todayCount] = await Promise.all([
    prisma.scanLog.findMany({
      where: logWhere,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        participant: {
          select: {
            name: true,
            order: true,
            seat: true,
            room: true,
            bus: { select: { name: true } },
            event: { select: { title: true } },
          },
        },
      },
    }),
    prisma.scanLog.count({ where: logWhere }),
    prisma.scanLog.count({ where: { userId, createdAt: { gte: startOfToday } } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const qs = (patch: Record<string, string>): string => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    p.set('page', String(page))
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v)
    }
    return `?${p.toString()}`
  }

  return (
    <main className="min-h-screen bg-[#0f2a52] pb-16">
      <SessionGuard scope="CREW" />
      <header className="border-b border-white/10 px-4 py-5">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/crew"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Kembali ke scan"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <p className="text-left text-[11px] font-bold uppercase tracking-widest text-white/50">
                Barokah Tour and Travel
              </p>
              <h1 className="mt-0.5 flex items-center gap-1.5 text-left text-lg font-bold text-white">
                <History size={17} /> Riwayat Scan Saya
              </h1>
            </div>
          </div>
          <LogoutButton variant="dark" scope="CREW" />
        </div>
        <p className="mx-auto mt-1 max-w-md text-left text-xs text-white/60">Crew: {session.username}</p>
      </header>

      <div className="mx-auto mt-5 w-full max-w-md px-4">
        <form className="flex items-center gap-2" method="get">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white px-3 py-2.5">
            <Search size={15} className="shrink-0 text-[#9aa3af]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama peserta…"
              className="w-full bg-transparent text-sm font-semibold text-[#1b3555] outline-none placeholder:text-[#9aa3af]"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[#f5b915] px-4 py-2.5 text-sm font-bold text-[#1d2733] transition-colors duration-200 hover:bg-[#e4aa09]"
          >
            Cari
          </button>
          {q && (
            <Link
              href="/crew/riwayat"
              className="rounded-xl border border-white/20 px-3 py-2.5 text-sm font-bold text-white hover:bg-white/10"
            >
              Reset
            </Link>
          )}
        </form>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-2xl font-black text-white">{total.toLocaleString('id-ID')}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Total scan</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-2xl font-black text-[#8fe3a5]">{todayCount.toLocaleString('id-ID')}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Scan hari ini</p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
            <ScanBarcode className="mx-auto text-white/30" size={32} />
            <p className="mt-3 text-sm font-bold text-white">{q ? 'Tidak ada scan yang cocok' : 'Belum ada scan'}</p>
            <p className="mt-1 text-xs text-white/50">
              {q
                ? `Tidak ditemukan peserta bernama "${q}".`
                : 'Scan pertama yang kamu lakukan akan tercatat di sini.'}
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {logs.map((log) => {
              const attended = log.status === 'attended'
              const p = log.participant
              return (
                <li
                  key={log.id}
                  className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      attended ? 'bg-[#e6f4ea] text-[#2ca84a]' : 'bg-[#fff7e0] text-[#b98a12]'
                    }`}
                  >
                    {attended ? 'Hadir' : 'Sudah hadir'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1b3555]">{p.name}</p>
                    <p className="mt-0.5 text-xs text-[#657080]">
                      {p.bus.name}
                      {p.seat ? ` · Kursi ${p.seat}` : ` · No. ${p.order}`}
                      {p.room ? ` · ${p.room}` : ''}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#9aa3af]">{p.event.title}</p>
                  </div>
                  <p className="shrink-0 text-right text-[11px] font-semibold text-[#657080]">
                    {formatWaktuLengkap(new Date(log.createdAt))}
                  </p>
                </li>
              )
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="font-semibold text-white/70">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/crew/riwayat${qs({ page: String(page - 1) })}`}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
                >
                  ‹ Sebelumnya
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/crew/riwayat${qs({ page: String(page + 1) })}`}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
                >
                  Berikutnya ›
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}