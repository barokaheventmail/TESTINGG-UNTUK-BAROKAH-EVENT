'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, QrCode, Search, SearchX, Ticket } from 'lucide-react'
import { formatTanggalPendek } from '@/lib/dates'

export type SearchMatch = {
  token: string
  name: string
  order: number
  seat: string | null
  room: string | null
  vw: string | null
  attended: boolean
  busName: string
  eventTitle: string
  eventDate: string
  eventStatus: 'DRAFT' | 'ACTIVE' | 'CLOSED'
}

export function TicketSearch({ eventId, disabled }: { eventId?: string; disabled?: boolean } = {}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SearchMatch | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [open, setOpen] = useState(false)
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (disabled) {
      setMatches([])
      setLoading(false)
      return
    }
    const q = query.trim()
    if (!q) {
      setMatches([])
      setLoading(false)
      return
    }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const url = `/api/public/search?q=${encodeURIComponent(q)}${eventId ? `&eventId=${encodeURIComponent(eventId)}` : ''}`
        const res = await fetch(url, { signal: ctrl.signal })
        const data = await res.json()
        setMatches(data.matches ?? [])
      } catch {
        // ignore aborted / network errors
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      ctrl.abort()
      clearTimeout(t)
    }
  }, [query, eventId, disabled])

  const display = useMemo(() => matches.slice(0, 6), [matches])

  function select(match: SearchMatch) {
    setSelected(match)
    setNotFound(false)
    setOpen(false)
  }

  function submit() {
    const q = query.trim()
    if (!q) return
    if (matches.length === 1) select(matches[0])
    else if (matches.length > 0) select(matches[0])
    else {
      setSelected(null)
      setNotFound(true)
      setOpen(false)
    }
  }

  return (
    <div className="relative w-full" id="cari-nama">
      <div className="flex items-stretch gap-2 rounded-full border border-[#dfe4e8] bg-white p-1.5 shadow-xl">
        <label className="flex flex-1 items-center gap-3 rounded-full bg-[#f8fafc] px-4 py-2.5">
          <Search size={18} className="shrink-0 text-[#2ca84a]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              setNotFound(false)
              setSelected(null)
            }}
            onFocus={() => {
              setOpen(true)
              setNotFound(false)
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Ketik nama peserta…"
            className="w-full bg-transparent text-sm text-[#1d2733] outline-none placeholder:text-[#9aa3af] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Cari nama peserta"
            disabled={disabled}
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className="rounded-full bg-[#1b4f9c] px-5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cari
        </button>
      </div>

      {disabled && (
        <p className="mt-3 text-center text-xs font-semibold text-white/85">
          Cari nama peserta kini tersedia di halaman tiap event.
        </p>
      )}

      {open && (display.length > 0 || loading) && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white shadow-2xl">
          {loading && (
            <li className="px-4 py-3 text-xs font-semibold text-[#657080]">Mencari…</li>
          )}
          {!loading &&
            display.map((m) => (
              <li key={m.token}>
                <button
                  type="button"
                  onMouseDown={() => select(m)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[#edf5ef]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f4ea] text-[#2ca84a]">
                    <BadgeCheck size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#1b3555]">{m.name}</span>
                    <span className="block truncate text-xs text-[#657080]">
                      {eventId ? m.busName : `${m.eventTitle} · ${m.busName}`}
                    </span>
                  </span>
                  {m.attended && (
                    <span className="shrink-0 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[10px] font-bold text-[#2ca84a]">
                      Hadir
                    </span>
                  )}
                </button>
              </li>
            ))}
        </ul>
      )}

      {selected && (
        <div className="animate-fade-up mt-4 overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white shadow-lg">
          <div
            className={`flex flex-wrap items-center gap-3 border-l-4 px-5 py-4 ${
              selected.attended ? 'border-[#2ca84a] bg-[#e6f4ea]' : 'border-[#2ca84a] bg-[#e6f4ea]'
            }`}
          >
            <BadgeCheck className="shrink-0 text-[#2ca84a]" size={20} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#1b3555]">{selected.name} · Tiket Ditemukan</p>
              <p className="text-xs text-[#657080]">
                {selected.eventTitle} · {formatTanggalPendek(new Date(selected.eventDate))}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/tiket/${selected.token}`)}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1b4f9c] px-3 py-1.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95"
            >
              <QrCode size={12} /> Lihat Tiket & QR
            </button>
          </div>
          <dl className="grid gap-3 px-5 py-5 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Bus / Armada</dt>
              <dd className="mt-0.5 font-bold text-[#1b4f9c]">{selected.busName}</dd>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Kursi</dt>
              <dd className="mt-0.5 font-semibold text-[#1b3555]">{selected.seat ?? selected.order}</dd>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Tanggal</dt>
              <dd className="mt-0.5 font-semibold text-[#1b3555]">{formatTanggalPendek(new Date(selected.eventDate))}</dd>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Status</dt>
              <dd
                className={`mt-0.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  selected.attended ? 'bg-[#e6f4ea] text-[#2ca84a]' : 'bg-[#fff7e0] text-[#b98a12]'
                }`}
              >
                {selected.attended ? 'Sudah Hadir' : 'Belum Hadir'}
              </dd>
            </div>
          </dl>
          <div className="border-t border-[#edf0f3] px-5 py-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#657080]">
              <Ticket size={12} /> Klik &ldquo;Lihat Tiket &amp; QR&rdquo;, lalu tunjukkan QR ke crew saat absensi.
            </p>
          </div>
        </div>
      )}

      {notFound && (
        <div className="animate-fade-up mt-4 flex flex-col gap-3 rounded-2xl border border-[#dfe4e8] bg-white p-5 text-left shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <SearchX className="mt-0.5 shrink-0 text-[#b98a12]" size={20} />
            <div>
              <p className="text-sm font-bold text-[#1b3555]">Nama &ldquo;{query.trim()}&rdquo; belum ditemukan</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#657080]">
                Mungkin nama belum didaftarkan atau event belum dibuat. Hubungi admin untuk memastikan tiket Anda.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/6285930005544"
            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#2ca84a] px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#219b42]"
          >
            Tanya Admin
          </a>
        </div>
      )}
    </div>
  )
}