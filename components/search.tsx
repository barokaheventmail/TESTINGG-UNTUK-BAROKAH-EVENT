'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, MapPin, Minus, Plus, Search, Users } from 'lucide-react'

type PackageOption = { title: string; href: string; keywords: string[] }

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatTanggalPendek(d: Date): string {
  return `${d.getDate()} ${months[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

function startOfDay(d: Date) {
  const c = new Date(d); c.setHours(0, 0, 0, 0); return c
}

function CalendarDropdown({ value, onChange, min }: { value: Date | null; onChange: (d: Date) => void; min: Date }) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [view, setView] = useState(() => value ? new Date(value.getFullYear(), value.getMonth(), 1) : new Date(min.getFullYear(), min.getMonth(), 1))
  const ref = useRef<HTMLDivElement>(null)
  const minDay = startOfDay(min)

  const toggleOpen = () => {
    if (!open) {
      const rect = ref.current?.getBoundingClientRect()
      const spaceBelow = window.innerHeight - (rect ? rect.bottom : 0)
      setOpenUp(spaceBelow < 360)
    }
    setOpen(!open)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = Array.from({ length: firstDay }, () => null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const isDisabled = (d: number) => {
    const cell = new Date(year, month, d)
    cell.setHours(0, 0, 0, 0)
    return cell < minDay
  }

  const isSelected = (d: number) => {
    if (!value) return false
    return value.getFullYear() === year && value.getMonth() === month && value.getDate() === d
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex w-full items-center justify-center gap-2 pr-6 text-sm text-left"
        aria-label="Pilih tanggal"
      >
        {value ? (
          <span className="min-w-0 truncate">{formatTanggalPendek(value)}</span>
        ) : (
          <span className="truncate text-[#657080]">Pilih tanggal</span>
        )}
        <ChevronDown size={14} className={`absolute right-0 shrink-0 text-[#657080] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{ backgroundColor: '#ffffff' }}
          className={`absolute left-0 z-[120] w-[280px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-xl border border-[#dfe4e8] bg-white p-3 shadow-2xl ring-1 ring-black/5 md:right-0 md:left-auto ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="rounded-lg p-1 text-[#657080] hover:bg-[#f1f3f5]"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-[#1b3555]">{months[month]} {year}</span>
            <button
              type="button"
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="rounded-lg p-1 text-[#657080] hover:bg-[#f1f3f5]"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-[#657080]">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d, i) =>
              d === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  disabled={isDisabled(d)}
                  onClick={() => {
                    onChange(new Date(year, month, d))
                    setOpen(false)
                  }}
                  className={`flex h-8 items-center justify-center rounded-lg text-xs font-medium transition
                    ${isSelected(d)
                      ? 'bg-[#1b4f9c] text-white'
                      : isDisabled(d)
                        ? 'cursor-not-allowed text-[#dfe4e8]'
                        : 'text-[#1b3555] hover:bg-[#edf5ef]'
                    }`}
                >
                  {d}
                </button>
              ),
            )}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(null as any); setOpen(false) }}
              className="mt-2 w-full rounded-lg bg-[#f1f3f5] py-1.5 text-xs font-semibold text-[#657080] hover:bg-[#dfe4e8]"
            >
              Hapus pilihan
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function SearchWidget({ packages }: { packages: PackageOption[] }) {
  const router = useRouter()
  const [destination, setDestination] = useState('')
  const [tanggal, setTanggal] = useState<Date | null>(null)
  const [pesertaText, setPesertaText] = useState('2')
  const [message, setMessage] = useState<string | null>(null)

  const peserta = Math.max(1, Math.floor(Number(pesertaText) || 1))

  const commitPeserta = () => {
    const v = Math.floor(Number(pesertaText))
    setPesertaText(Number.isNaN(v) || v < 1 ? '1' : String(v))
  }

  const minDate = new Date()
  minDate.setHours(0, 0, 0, 0)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const query = destination.trim().toLowerCase()

    if (!query) {
      setMessage(null)
      document.getElementById('paket')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    const match = packages.find((p) =>
      `${p.title} ${p.keywords.join(' ')}`.toLowerCase().includes(query),
    )

    if (match) {
      router.push(match.href)
      return
    }

    setMessage(query)
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Cari paket wisata">
      <div className="flex flex-col gap-1.5 rounded-2xl border border-[#dfe4e8] bg-white p-1.5 shadow-xl text-[#1d2733] min-[480px]:flex-row min-[480px]:items-stretch min-[480px]:rounded-full">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#f8fafc] px-4 py-2 min-[480px]:rounded-full has-[:focus]:bg-white">
          <MapPin className="shrink-0 text-[#2ca84a]" size={16} />
          <input
            className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-[#9aa3af]"
            placeholder="Mau ke mana?"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value)
              if (message) setMessage(null)
            }}
            aria-label="Tujuan perjalanan"
          />
        </label>

        <div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#f8fafc] px-4 py-2 min-[480px]:rounded-full has-[:focus]:bg-white">
          <CalendarDays className="shrink-0 text-[#2ca84a]" size={16} />
          <span className="w-full">
            <CalendarDropdown value={tanggal} onChange={setTanggal} min={minDate} />
          </span>
        </div>

        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#f8fafc] px-4 py-2 min-[480px]:rounded-full">
          <Users className="shrink-0 text-[#2ca84a]" size={16} />
          <span className="flex w-full items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setPesertaText(String(Math.max(1, peserta - 1)))}
              aria-label="Kurangi jumlah peserta"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f5] text-[#1b4f9c] transition hover:bg-[#e6edf5] active:scale-95"
            >
              <Minus size={12} />
            </button>
            <input
              type="number"
              min={1}
              value={pesertaText}
              onChange={(e) => setPesertaText(e.target.value)}
              onBlur={commitPeserta}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitPeserta()
                }
              }}
              aria-label="Jumlah peserta"
              className="w-8 rounded-md bg-transparent text-center text-sm font-bold text-[#1b3555] outline-none"
            />
            <button
              type="button"
              onClick={() => setPesertaText(String(peserta + 1))}
              aria-label="Tambah jumlah peserta"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f3f5] text-[#1b4f9c] transition hover:bg-[#e6edf5] active:scale-95"
            >
              <Plus size={12} />
            </button>
          </span>
        </label>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#f5b915] px-5 py-2.5 text-sm font-bold text-[#1d2733] transition-colors duration-200 hover:bg-[#e4aa09] active:scale-95 min-[480px]:rounded-full"
        >
          <Search size={15} /> Cari Paket
        </button>
      </div>
      {message && (
        <p className="mt-3 rounded-lg bg-[#fffaf0] px-4 py-3 text-sm text-[#1b3555]" role="status" aria-live="polite">
          Belum ada paket cocok untuk &ldquo;{message}&rdquo;.{' '}
          <a href="https://wa.me/6285930005544" className="font-bold underline">
            Tanya via WhatsApp
          </a>{' '}
          atau{' '}
          <button
            type="button"
            onClick={() => document.getElementById('paket')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="font-bold text-[#1b4f9c] underline"
          >
            lihat semua paket
          </button>
          .
        </p>
      )}
    </form>
  )
}