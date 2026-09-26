import Link from 'next/link'
import { History, ScanBarcode, Search } from 'lucide-react'
import { formatWaktuLengkap } from '@/lib/dates'

export type RiwayatLog = {
  id: string
  status: string
  createdAt: Date
  participant: {
    name: string
    order: number
    seat: string | null
    room: string | null
    bus: { name: string }
    event: { title: string }
  }
}

type Props = {
  basePath: string
  tab?: string
  q: string
  page: number
  total: number
  todayCount: number
  totalPages: number
  logs: RiwayatLog[]
}

export function CrewRiwayatList({ basePath, tab, q, page, total, todayCount, totalPages, logs }: Props) {
  const qs = (patch: Record<string, string>): string => {
    const p = new URLSearchParams()
    if (tab) p.set('tab', tab)
    if (q) p.set('q', q)
    p.set('page', String(page))
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v)
    }
    return `${basePath}?${p.toString()}`
  }

  return (
    <>
      <form className="flex items-center gap-2" method="get" action={basePath}>
        {tab && <input type="hidden" name="tab" value={tab} />}
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
            href={qs({ q: '' })}
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
            {q ? `Tidak ditemukan peserta bernama "${q}".` : 'Scan pertama yang kamu lakukan akan tercatat di sini.'}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {logs.map((log) => {
            const attended = log.status === 'attended'
            const p = log.participant
            return (
              <li key={log.id} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl">
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
                href={qs({ page: String(page - 1) })}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                ‹ Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={qs({ page: String(page + 1) })}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                Berikutnya ›
              </Link>
            )}
          </div>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
        <History size={12} /> Riwayat semua scan yang kamu lakukan.
      </p>
    </>
  )
}