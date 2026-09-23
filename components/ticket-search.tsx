'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BadgeCheck, Lock, Phone, Search, SearchX, X } from 'lucide-react'

function Overlay({ open, onClose, onExited, panelClassName, children }: { open: boolean; onClose?: () => void; onExited?: () => void; panelClassName?: string; children: React.ReactNode }) {
  const [rendered, setRendered] = useState(open)

  useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    const t = setTimeout(() => {
      setRendered(false)
      onExited?.()
    }, 350)
    return () => clearTimeout(t)
  }, [open])

  if (!rendered) return null

  return createPortal(
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#09204a]/15 p-4 backdrop-blur-md transition-opacity duration-300 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!open}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${panelClassName ?? ''} transition-all duration-300 ease-out ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

type Passenger = {
  name: string
  tiket: string
  paket: string
  tanggal: string
  status: string
  kode: string | null
}

const PASSENGERS: Passenger[] = [
  { name: 'Ahmad Fauzi', tiket: 'BTH-2026-1041', paket: 'Open Trip Ancol–Dufan', tanggal: '12 Oktober 2026', status: 'Terkonfirmasi', kode: 'BK1041' },
  { name: 'Siti Rahmawati', tiket: 'BTH-2026-1042', paket: 'Open Trip Ancol–Dufan', tanggal: '12 Oktober 2026', status: 'Terkonfirmasi', kode: 'BK1042' },
  { name: 'Rizal Bahtiar', tiket: 'BTH-2026-1043', paket: 'Open Trip Yogyakarta', tanggal: '20 Oktober 2026', status: 'Terkonfirmasi', kode: 'BK1043' },
  { name: 'Nurhaliza Putri', tiket: 'BTH-2026-1044', paket: 'Open Trip Ancol–Dufan', tanggal: '12 Oktober 2026', status: 'Menunggu Pembayaran', kode: null },
  { name: 'Agus Setiawan', tiket: 'BTH-2026-1045', paket: 'Open Trip Yogyakarta', tanggal: '20 Oktober 2026', status: 'Terkonfirmasi', kode: 'BK1045' },
  { name: 'Dewi Lestari', tiket: 'BTH-2026-1046', paket: 'Open Trip Ancol–Dufan', tanggal: '12 Oktober 2026', status: 'Terkonfirmasi', kode: 'BK1046' },
  { name: 'Bayu Pratama', tiket: 'BTH-2026-1047', paket: 'Open Trip Yogyakarta', tanggal: '20 Oktober 2026', status: 'Menunggu Pembayaran', kode: null },
  { name: 'Intan Permata', tiket: 'BTH-2026-1048', paket: 'Open Trip Ancol–Dufan', tanggal: '12 Oktober 2026', status: 'Terkonfirmasi', kode: 'BK1048' },
  { name: 'Ilham Kurniawan', tiket: 'BTH-2026-1049', paket: 'Study Tour Bandung', tanggal: '5 November 2026', status: 'Terkonfirmasi', kode: 'BK1049' },
  { name: 'Sarah Azzahra', tiket: 'BTH-2026-1050', paket: 'Study Tour Bandung', tanggal: '5 November 2026', status: 'Terkonfirmasi', kode: 'BK1050' },
  { name: 'Doni Saputra', tiket: 'BTH-2026-1051', paket: 'Open Trip Yogyakarta', tanggal: '20 Oktober 2026', status: 'Terkonfirmasi', kode: 'BK1051' },
  { name: 'Farisa Hilmi', tiket: 'BTH-2026-1052', paket: 'Open Trip Ancol–Dufan', tanggal: '12 Oktober 2026', status: 'Terkonfirmasi', kode: 'BK1052' },
]

export function TicketSearch() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Passenger | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [askCode, setAskCode] = useState<Passenger | null>(null)
  const [printTicket, setPrintTicket] = useState<Passenger | null>(null)
  const [askOpen, setAskOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [attended, setAttended] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return PASSENGERS.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6)
  }, [query])

  const findPassenger = (name: string) => {
    const q = name.trim().toLowerCase()
    if (!q) return
    const found = PASSENGERS.find((p) => p.name.toLowerCase() === q)
    setSelected(found ?? null)
    setNotFound(!found)
    setOpen(false)
  }

  const submit = () => {
    if (query.trim()) findPassenger(query)
  }

  const requestPrint = () => {
    if (!selected) return
    setCode('')
    setCodeError(null)
    setAskCode(selected)
    setAskOpen(true)
  }

  const verify = () => {
    const target = askCode
    if (!target) return
    if (!code.trim()) {
      setCodeError('Masukkan kode terlebih dahulu.')
      return
    }
    setPrintTicket(target)
    setAttended(false)
    setAskOpen(false)
    setPrintOpen(true)
    setCode('')
    setCodeError(null)
  }

  return (
    <div ref={boxRef} className="relative w-full">
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
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (matches.length === 1) findPassenger(matches[0].name)
                else submit()
              }
            }}
            placeholder="Ketik nama peserta…"
            className="w-full bg-transparent text-sm text-[#1d2733] outline-none placeholder:text-[#9aa3af]"
            aria-label="Cari nama peserta"
          />
        </label>
        <button
          type="button"
          onClick={submit}
          className="rounded-full bg-[#1b4f9c] px-5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95"
        >
          Cari
        </button>
      </div>

      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white shadow-2xl">
          {matches.map((p) => (
            <li key={p.tiket}>
              <button
                type="button"
                onMouseDown={() => findPassenger(p.name)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-[#edf5ef]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f4ea] text-[#2ca84a]">
                  <BadgeCheck size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#1b3555]">{p.name}</span>
                  <span className="block truncate text-xs text-[#657080]">{p.paket} · {p.tanggal}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="animate-fade-up mt-4 overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white shadow-lg">
          <div className="flex items-center gap-3 border-l-4 border-[#2ca84a] bg-[#e6f4ea] px-5 py-4">
            <BadgeCheck className="shrink-0 text-[#2ca84a]" size={20} />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#1b3555]">{selected.name} · Tiket Ditemukan</p>
              <p className="text-xs text-[#657080]">Nama sudah terdaftar dan dapat membeli tiket.</p>
            </div>
            <button
              type="button"
              onClick={requestPrint}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1b4f9c] px-3 py-1.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95"
            >
              <Lock size={12} /> Cetak Tiket
            </button>
          </div>
          <dl className="grid gap-3 px-5 py-5 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">No. Tiket</dt>
              <dd className="mt-0.5 font-bold text-[#1b4f9c]">{selected.tiket}</dd>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Paket</dt>
              <dd className="mt-0.5 font-semibold text-[#1b3555]">{selected.paket}</dd>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Tanggal</dt>
              <dd className="mt-0.5 font-semibold text-[#1b3555]">{selected.tanggal}</dd>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Status</dt>
              <dd className={`mt-0.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${selected.status === 'Terkonfirmasi' ? 'bg-[#e6f4ea] text-[#2ca84a]' : 'bg-[#fff7e0] text-[#b98a12]'}`}>{selected.status}</dd>
            </div>
          </dl>
        </div>
      )}

      {notFound && (
        <div className="animate-fade-up mt-4 flex flex-col gap-3 rounded-2xl border border-[#dfe4e8] bg-white p-5 text-left shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <SearchX className="mt-0.5 shrink-0 text-[#b98a12]" size={20} />
            <div>
              <p className="text-sm font-bold text-[#1b3555]">Nama &ldquo;{query.trim()}&rdquo; belum ditemukan</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#657080]">Mungkin nama belum didaftarkan. Hubungi admin untuk memastikan tiket Anda.</p>
            </div>
          </div>
          <a
            href="https://wa.me/6285930005544"
            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#2ca84a] px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#219b42]"
          >
            <Phone size={15} /> Tanya Admin
          </a>
        </div>
      )}

      {askCode && (
        <Overlay open={askOpen} onClose={() => setAskOpen(false)} onExited={() => setAskCode(null)} panelClassName="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-[#1b3555]">Cetak Tiket</h4>
            <button type="button" onClick={() => setAskOpen(false)} className="rounded-full p-1 text-[#657080] hover:bg-[#f1f3f5]"><X size={18} /></button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#657080]">
            Masukkan <strong className="text-[#1b3555]">kode dari login pembooking</strong> untuk mencetak tiket atas nama <strong className="text-[#1b4f9c]">{askCode.name}</strong>.
          </p>
          <div className="mt-4">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setCodeError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); verify() } }}
              placeholder="Contoh: BK1041"
              className="w-full rounded-xl border border-[#dfe4e8] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#1b3555] outline-none transition-colors placeholder:text-[#9aa3af] focus:border-[#1b4f9c] focus:bg-white focus:ring-2 focus:ring-[#1b4f9c]/15"
            />
            {codeError && <p className="mt-2 text-xs font-semibold text-red-500">{codeError}</p>}
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Kode contoh sementara (klik untuk mengisi):</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PASSENGERS.filter((p) => p.kode).map((p) => (
                <button
                  key={p.kode}
                  type="button"
                  onClick={() => { setCode(p.kode ?? ''); setCodeError(null) }}
                  className="rounded-full border border-[#dfe4e8] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-bold text-[#1b4f9c] transition-colors duration-200 hover:border-[#1b4f9c] hover:bg-[#eef3fb] active:scale-95"
                >
                  {p.kode}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={verify}
            className="mt-5 w-full rounded-full bg-[#1b4f9c] py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-[0.98]"
          >
            Verifikasi & Cetak
          </button>
        </div>
      </Overlay>
      )}

      {printTicket && (
      <Overlay open={printOpen} onClose={() => setPrintOpen(false)} onExited={() => setPrintTicket(null)} panelClassName="w-full max-w-md">
        <div className="print-ticket overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white shadow-2xl">
          <div className="bg-[#1b4f9c] px-6 py-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Barokah Tour & Travel</p>
            <p className="mt-1 text-lg font-bold">Tiket Wisata</p>
          </div>
          <div className="px-6 py-5">
            <div className="rounded-xl bg-[#f8fafc] p-4">
              <p className="text-xs text-[#657080]">Nama Peserta</p>
              <p className="mt-0.5 text-base font-bold text-[#1b3555]">{printTicket.name}</p>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-[#657080]">No. Tiket</dt>
                <dd className="mt-0.5 font-bold text-[#1b4f9c]">{printTicket.tiket}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#657080]">Status Absensi</dt>
                <dd className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${attended ? 'bg-[#e6f4ea] text-[#2ca84a]' : 'bg-[#fff7e0] text-[#b98a12]'}`}>
                  {attended ? 'Terabsen · Siap Berangkat' : `Terdaftar · ${printTicket.status === 'Terkonfirmasi' ? 'Menunggu Absensi' : printTicket.status}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#657080]">Paket</dt>
                <dd className="mt-0.5 font-semibold text-[#1b3555]">{printTicket.paket}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#657080]">Tanggal Keberangkatan</dt>
                <dd className="mt-0.5 font-semibold text-[#1b3555]">{printTicket.tanggal}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col items-center gap-3 rounded-xl bg-[#f8fafc] p-5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=1&data=${encodeURIComponent(`BTH:${printTicket.tiket}:${printTicket.kode ?? ''}`)}`}
                alt={`QR absensi ${printTicket.name}`}
                className="h-36 w-36 rounded-xl bg-white p-2 shadow-sm"
              />
              <p className="text-xs text-[#657080]">Tunjukkan kode / pindai QR ini saat absensi:</p>
              <p className="rounded-full bg-white px-4 py-1 text-base font-black tracking-[0.2em] text-[#1b4f9c] shadow-sm">{printTicket.kode ?? printTicket.tiket}</p>
            </div>

            {attended && (
              <div className="animate-fade-up mt-4 rounded-xl bg-[#e6f4ea] p-3 text-center">
                <p className="text-xs font-bold text-[#2ca84a]">Sudah terabsen oleh perusahaan — Anda siap berangkat.</p>
              </div>
            )}

            <div className="mt-5 rounded-xl bg-[#edf5ef] p-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-[#657080]">Tunjukkan tiket ini saat keberangkatan</p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPrintOpen(false)}
            className="rounded-full bg-white/90 px-5 py-2.5 text-sm font-bold text-[#657080] shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            Tutup
          </button>
          <a
            href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=1&data=${encodeURIComponent(`BTH:${printTicket.tiket}:${printTicket.kode ?? ''}`)}`}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center gap-2 rounded-full bg-[#f5b915] px-5 py-2.5 text-sm font-bold text-[#1d2733] transition-colors duration-200 hover:bg-[#e4aa09] active:scale-95"
          >
            Unduh QR
          </a>
          {attended ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full bg-[#2ca84a] px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#219b42] active:scale-95"
            >
              Download Tiket
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAttended(true)}
              className="flex items-center gap-2 rounded-full bg-[#1b4f9c] px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95"
            >
              Tandai Absen
            </button>
          )}
        </div>
        {!attended && (
          <p className="mt-2 text-right text-[11px] text-white/70">Tiket dapat diunduh setelah tanda absensi berhasil.</p>
        )}
      </Overlay>
      )}
    </div>
  )
}
