'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BadgeCheck,
  Bus,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ListChecks,
  MapPin,
  Users,
} from 'lucide-react'
import { TicketSearch, type TicketSearchHandle } from '@/components/ticket-search'
import { formatTanggalPendek } from '@/lib/dates'

export type EventTicketsParticipant = { id: string; order: number; name: string; token: string }

export type EventTicketsSection = {
  busId: string
  busName: string
  participants: EventTicketsParticipant[]
  busTotal: number
  busAttended: number
}

function SlideRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const slide = (dir: number) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.6, 140), behavior: 'smooth' })
  }
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Geser daftar bus ke kiri"
        onClick={() => slide(-1)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dfe4e8] bg-white p-0 text-[#1b4f9c] shadow-sm transition-colors duration-150 hover:bg-[#eef3fb]"
      >
        <ChevronLeft size={16} />
      </button>
      <div ref={ref} className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain py-1">
        {children}
      </div>
      <button
        type="button"
        aria-label="Geser daftar bus ke kanan"
        onClick={() => slide(1)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dfe4e8] bg-white p-0 text-[#1b4f9c] shadow-sm transition-colors duration-150 hover:bg-[#eef3fb]"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

type EventTicketsProps = {
  eventId: string
  eventTitle: string
  eventDate: string
  eventLocation: string | null
  note: string | null
  imageUrl?: string | null
  busCount: number
  total: number
  attended: number
  sections: EventTicketsSection[]
  limit: number
  initialQuery?: string
}

export function EventTickets({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  note,
  imageUrl,
  busCount,
  total,
  attended,
  sections,
  limit,
  initialQuery,
}: EventTicketsProps) {
  const searchRef = useRef<TicketSearchHandle>(null)
  const [busSelection, setBusSelection] = useState<string[]>([])
  const [expandedBusIds, setExpandedBusIds] = useState<Set<string>>(new Set())
  const [rosterCache, setRosterCache] = useState<Record<string, EventTicketsParticipant[]>>({})
  const [rosterLoadingIds, setRosterLoadingIds] = useState<Record<string, boolean>>({})
  const [busDropdownOpen, setBusDropdownOpen] = useState(false)
  const [multiOpen, setMultiOpen] = useState(false)

  const busOptions = sections.filter((s) => s.busTotal > 0)
  const allBusIds = busOptions.map((s) => s.busId)
  const isFiltered = busSelection.length > 0
  const visibleSections = isFiltered ? sections.filter((s) => busSelection.includes(s.busId)) : sections

  const filterLabel =
    busSelection.length === 0
      ? 'Semua Bus'
      : busSelection.length === 1
        ? sections.find((s) => s.busId === busSelection[0])?.busName ?? 'Semua Bus'
        : `${busSelection.length} Bus Dipilih`

  const loadRosters = async (ids: string[]) => {
    const missing = ids.filter((id) => !rosterCache[id])
    if (missing.length === 0) return
    setRosterLoadingIds((prev) => ({ ...prev, ...Object.fromEntries(missing.map((id) => [id, true])) }))
    try {
      const res = await fetch(
        `/api/public/roster?eventId=${encodeURIComponent(eventId)}&busIds=${encodeURIComponent(missing.join(','))}`,
      )
      const data = await res.json()
      const map: Record<string, EventTicketsParticipant[]> = {}
      for (const bus of data.buses ?? []) map[bus.busId] = bus.participants
      setRosterCache((prev) => ({ ...prev, ...map }))
    } catch {
      // abaikan galat jaringan
    } finally {
      setRosterLoadingIds((prev) => {
        const next = { ...prev }
        for (const id of missing) delete next[id]
        return next
      })
    }
  }

  useEffect(() => {
    if (busSelection.length > 0) loadRosters(busSelection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busSelection])

  const setFilter = (ids: string[]) => {
    setBusSelection(ids)
    setMultiOpen(false)
    if (ids.length === 0) setExpandedBusIds(new Set())
  }

  const toggleBus = (id: string) => {
    setBusSelection((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      if (next.length === 0) setExpandedBusIds(new Set())
      return next
    })
  }

  const selectAllBuses = () => setFilter(allBusIds)
  const clearBuses = () => setFilter([])

  const toggleExpand = (busId: string) => {
    const willExpand = !expandedBusIds.has(busId)
    setExpandedBusIds((prev) => {
      const next = new Set(prev)
      if (willExpand) next.add(busId)
      else next.delete(busId)
      return next
    })
    if (willExpand) loadRosters([busId])
  }

  return (
    <>
      <div className="mt-4 rounded-2xl border border-[#dfe4e8] bg-white p-6 shadow-lg">
        <h2 className="text-sm font-bold text-[#1b3555]">Cari Nama Peserta</h2>
        <p className="mt-0.5 mb-4 text-xs text-[#657080]">Ketik nama Anda untuk melihat tiket &amp; QR di event ini.</p>
        <TicketSearch ref={searchRef} eventId={eventId} busIds={busSelection} initialQuery={initialQuery} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white shadow-lg">
        <div
          className={`relative ${imageUrl ? 'bg-cover bg-center' : 'bg-gradient-to-br from-[#1b4f9c] to-[#163d78]'}`}
          style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
        >
          {imageUrl && (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#1b4f9c]/20 via-[#123575]/60 to-[#0d2850]/95"
            />
          )}
          <div className="relative px-6 py-8 text-white md:py-10">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">
              Event Wisata · Barokah Tour &amp; Travel
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{eventTitle}</h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} /> {formatTanggalPendek(new Date(eventDate))}
              </span>
              {eventLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {eventLocation}
                </span>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-bold text-[#2ca84a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2ca84a]" /> Aktif
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {note && <p className="mb-5 rounded-xl bg-[#f8fafc] p-4 text-sm leading-relaxed text-[#44576d]">{note}</p>}

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#dfe4e8] p-4 text-center">
              <Bus className="mx-auto text-[#1b4f9c]" size={18} />
              <p className="mt-1.5 text-xl font-black text-[#1b3555]">{busCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Bus</p>
            </div>
            <div className="rounded-xl border border-[#dfe4e8] p-4 text-center">
              <Users className="mx-auto text-[#1b4f9c]" size={18} />
              <p className="mt-1.5 text-xl font-black text-[#1b3555]">{total}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Peserta</p>
            </div>
            <div className="rounded-xl border border-[#dfe4e8] p-4 text-center">
              <BadgeCheck className="mx-auto text-[#2ca84a]" size={18} />
              <p className="mt-1.5 text-xl font-black text-[#2ca84a]">{attended}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Hadir</p>
            </div>
          </div>

          {busOptions.length > 0 && (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBusDropdownOpen((o) => !o)}
                  aria-expanded={busDropdownOpen}
                  className="flex items-center gap-2 rounded-full border border-[#dfe4e8] bg-[#f8fafc] px-4 py-2 text-sm font-bold text-[#1b3555] transition-colors duration-150 hover:bg-[#eef3fb]"
                >
                  <Bus size={14} className="text-[#1b4f9c]" />
                  <span className="max-w-40 truncate">{filterLabel}</span>
                  {busDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMultiOpen((o) => !o)
                    setBusDropdownOpen(false)
                  }}
                  aria-expanded={multiOpen}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-150 ${
                    busSelection.length > 1
                      ? 'border-[#2ca84a] bg-[#e6f4ea] text-[#247039]'
                      : 'border-[#dfe4e8] bg-[#f8fafc] text-[#1b3555] hover:bg-[#eef3fb]'
                  }`}
                >
                  <ListChecks size={14} />
                  Pilih Banyak Bus
                  {multiOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {busDropdownOpen && (
                <div className="mt-3 rounded-2xl border border-[#dfe4e8] bg-white p-3 shadow-sm">
                  <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[#9aa3af]">Pilih Bus</p>
                  <SlideRow>
                    <button
                      type="button"
                      aria-pressed={busSelection.length === 0}
                      onClick={() => setFilter([])}
                      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
                        busSelection.length === 0
                          ? 'border-[#1b4f9c] bg-[#eef3fb] text-[#1b4f9c]'
                          : 'border-[#dfe4e8] bg-white text-[#1b3555] hover:bg-[#f1f6fd]'
                      }`}
                    >
                      Semua Bus
                      {busSelection.length === 0 && <Check size={14} />}
                    </button>
                    {busOptions.map((b) => {
                      const selected = busSelection.length === 1 && busSelection[0] === b.busId
                      return (
                        <button
                          key={b.busId}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setFilter([b.busId])}
                          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
                            selected
                              ? 'border-[#1b4f9c] bg-[#eef3fb] text-[#1b4f9c]'
                              : 'border-[#dfe4e8] bg-white text-[#1b3555] hover:bg-[#f1f6fd]'
                          }`}
                        >
                          {b.busName}
                          <span className="text-[11px] font-semibold text-[#9aa3af]">{b.busTotal}</span>
                          {selected && <Check size={14} />}
                        </button>
                      )
                    })}
                  </SlideRow>
                </div>
              )}

              {multiOpen && (
                <div className="mt-3 rounded-2xl border border-[#dfe4e8] bg-[#fbfcfd] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1b3555]">{busSelection.length} Bus Dipilih</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={selectAllBuses}
                        className="rounded-full bg-[#e6f4ea] px-3 py-1.5 text-xs font-bold text-[#247039] transition-colors duration-150 hover:bg-[#d6ecdc]"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={clearBuses}
                        className="rounded-full bg-[#fdecec] px-3 py-1.5 text-xs font-bold text-[#c0392b] transition-colors duration-150 hover:bg-[#fadbd8]"
                      >
                        Hapus Semua Pilihan
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <SlideRow>
                      {busOptions.map((b) => {
                        const checked = busSelection.includes(b.busId)
                        return (
                          <label
                            key={b.busId}
                            className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
                              checked
                                ? 'border-[#2ca84a] bg-[#e6f4ea] text-[#1b3555]'
                                : 'border-[#dfe4e8] bg-white text-[#657080] hover:bg-[#f1f6fd]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBus(b.busId)}
                              className="h-4 w-4 shrink-0 accent-[#2ca84a]"
                            />
                            {b.busName}
                            <span className="text-[11px] text-[#9aa3af]">{b.busTotal}</span>
                          </label>
                        )
                      })}
                    </SlideRow>
                  </div>
                </div>
              )}
            </>
          )}

          {visibleSections.length > 0 ? (
            <div className="mt-6 space-y-5">
              {visibleSections.map((section) => {
                const cache = rosterCache[section.busId]
                const forceAll = isFiltered && busSelection.includes(section.busId)
                const isExpanded = forceAll || expandedBusIds.has(section.busId)
                const loading = !!rosterLoadingIds[section.busId]
                const list = cache ?? section.participants
                const shown = isExpanded ? list : list.slice(0, limit)
                const hidden = section.busTotal - shown.length

                return (
                  <div key={section.busId} className="overflow-hidden rounded-2xl border border-[#dfe4e8]">
                    <div className="flex items-center justify-between bg-[#eef3fb] px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-bold text-[#1b4f9c]">
                        <Bus size={15} /> {section.busName}
                      </p>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#657080]">
                        {section.busAttended}/{section.busTotal} hadir
                      </span>
                    </div>
                    <div className="divide-y divide-[#edf0f3]">
                      {shown.map((p) => (
                        <div key={p.id} className="flex items-center gap-x-4 px-4 py-2.5 text-sm">
                          <span className="w-8 shrink-0 font-bold text-[#9aa3af]">{p.order}</span>
                          <button
                            type="button"
                            onClick={() => searchRef.current?.search(p.name, p.token)}
                            title={`Cari ${p.name}`}
                            className="min-w-0 flex-1 cursor-pointer truncate text-left font-semibold text-[#1b3555] underline-offset-2 transition-colors duration-150 hover:text-[#1b4f9c] hover:underline"
                          >
                            {p.name}
                          </button>
                        </div>
                      ))}

                      {loading && isExpanded && !cache && (
                        <p className="bg-[#fbfcfd] px-4 py-2.5 text-xs font-semibold text-[#657080]">Memuat peserta…</p>
                      )}

                      {!isExpanded && section.busTotal > limit && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(section.busId)}
                          className="flex w-full items-start gap-2 bg-[#fbfcfd] px-4 py-2.5 text-left text-xs font-semibold text-[#1b4f9c] transition-colors duration-150 hover:bg-[#f1f6fd]"
                        >
                          <ChevronDown size={14} className="mt-0.5 shrink-0" />
                          <span>
                            Dan {hidden} peserta lainnya — klik untuk menampilkan semua peserta, atau ketik nama Anda pada
                            kolom &quot;Cari Nama Peserta&quot; di atas untuk melihat tiket &amp; QR.
                          </span>
                        </button>
                      )}

                      {isExpanded && section.busTotal > limit && cache && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(section.busId)}
                          className="flex w-full items-center gap-2 bg-[#fbfcfd] px-4 py-2.5 text-left text-xs font-semibold text-[#1b4f9c] transition-colors duration-150 hover:bg-[#f1f6fd]"
                        >
                          <ChevronUp size={14} className="shrink-0" />
                          <span>Sembunyikan peserta lainnya</span>
                        </button>
                      )}

                      {section.busTotal === 0 && (
                        <p className="px-4 py-3 text-xs text-[#657080]">Belum ada peserta di bus ini.</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-[#dfe4e8] p-6 text-center text-sm text-[#657080]">
              Belum ada bus/peserta untuk event ini.
            </p>
          )}
        </div>
      </div>
    </>
  )
}