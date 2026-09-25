'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BadgeCheck, Bus, Loader2, RefreshCcw, Search, SearchX } from 'lucide-react'
import { formatTanggalPendek } from '@/lib/dates'
import { PARTICIPANTS_CHANGED_EVENT } from '@/lib/events'
import { EditParticipant } from './edit-participant'
import { DeleteParticipant } from './delete-participant'

export type RowParticipant = {
  id: string
  busId: string
  order: number
  name: string
  birthPlace: string | null
  birthDate: string | null
  phone: string | null
  seat: string | null
  room: string | null
  vw: string | null
  scannedAt: string | null
  scannedBy: { username: string; name: string | null } | null
}

export type RowBus = {
  id: string
  name: string
  order: number
  count: number
  attended: number
}

type StatusFilter = 'all' | 'attended' | 'pending'

const PAGE_SIZE = 200

export function ParticipantTable({
  eventId,
  buses,
  totalParticipants,
  totalAttended,
}: {
  eventId: string
  buses: RowBus[]
  totalParticipants: number
  totalAttended: number
}) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [busFilter, setBusFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [items, setItems] = useState<RowParticipant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seqRef = useRef(0)

  const loadPage = useCallback(
    async (skip: number, append: boolean) => {
      const seq = ++seqRef.current
      try {
        const params = new URLSearchParams()
        if (debouncedQuery) params.set('q', debouncedQuery)
        if (busFilter !== 'all') params.set('busId', busFilter)
        if (statusFilter !== 'all') params.set('status', statusFilter)
        params.set('take', String(PAGE_SIZE))
        params.set('skip', String(skip))

        const res = await fetch(`/api/admin/events/${eventId}/participants?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Gagal memuat peserta.')
        if (seq !== seqRef.current) return
        setItems((prev) => (append ? [...prev, ...data.items] : data.items))
        setTotal(data.total)
        setError(null)
      } catch (err) {
        if (seq !== seqRef.current) return
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan.')
      } finally {
        if (seq === seqRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [debouncedQuery, busFilter, statusFilter, eventId],
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    setLoading(true)
    loadPage(0, false)
  }, [loadPage])

  useEffect(() => {
    const onChanged = () => loadPage(0, false)
    window.addEventListener(PARTICIPANTS_CHANGED_EVENT, onChanged)
    return () => window.removeEventListener(PARTICIPANTS_CHANGED_EVENT, onChanged)
  }, [loadPage])

  useEffect(() => {
    if (busFilter !== 'all' && !buses.some((bus) => bus.id === busFilter)) {
      setBusFilter('all')
    }
  }, [buses, busFilter])

  const attendedRef = useRef(totalAttended)

  useEffect(() => {
    if (attendedRef.current !== totalAttended) {
      attendedRef.current = totalAttended
      loadPage(0, false)
    }
  }, [totalAttended, loadPage])

  const groups = useMemo(() => {
    const byBus = new Map<string, RowParticipant[]>()
    for (const p of items) {
      const arr = byBus.get(p.busId)
      if (arr) arr.push(p)
      else byBus.set(p.busId, [p])
    }
    return buses
      .filter((bus) => busFilter === 'all' || bus.id === busFilter)
      .map((bus) => ({ bus, items: (byBus.get(bus.id) ?? []).sort((a, b) => a.order - b.order) }))
      .filter((g) => g.items.length > 0)
  }, [items, buses, busFilter])

  const hasAny = useMemo(
    () => ({
      ttl: items.some((p) => p.birthDate || p.birthPlace),
      phone: items.some((p) => p.phone),
      seat: items.some((p) => p.seat),
      room: items.some((p) => p.room),
      vw: items.some((p) => p.vw),
    }),
    [items],
  )

  const statusBtn = (value: StatusFilter, label: string) => (
    <button
      type="button"
      key={value}
      onClick={() => setStatusFilter(value)}
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
        statusFilter === value ? 'bg-[#1b4f9c] text-white' : 'border border-[#dfe4e8] text-[#657080] hover:bg-[#f1f3f5]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="rounded-2xl border border-[#dfe4e8] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe4e8] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-[#1b3555]">Daftar Peserta</h2>
          <p className="text-xs text-[#657080]">
            {totalParticipants} peserta · <span className="font-bold text-[#2ca84a]">{totalAttended} hadir</span>
            {total !== null && total !== totalParticipants && (
              <span className="text-[#9aa3af]"> · {total} cocok dengan filter</span>
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-[#dfe4e8] bg-[#f8fafc] px-3 py-2">
          <Search size={14} className="shrink-0 text-[#9aa3af]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama / HP / kamar / VW…"
            className="w-full min-w-[160px] bg-transparent text-xs font-semibold text-[#1b3555] outline-none placeholder:text-[#9aa3af]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#dfe4e8] px-5 py-3">
        <label className="flex items-center gap-2 rounded-full border border-[#dfe4e8] bg-[#f8fafc] px-3 py-2">
          <Bus size={14} className="shrink-0 text-[#9aa3af]" />
          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            aria-label="Filter bus peserta"
            className="max-w-[220px] bg-transparent text-xs font-bold text-[#1b3555] outline-none"
          >
            <option value="all">Semua Bus ({totalParticipants})</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.name} ({bus.count})
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-1.5">{statusBtn('all', 'Semua')}{statusBtn('attended', 'Hadir')}{statusBtn('pending', 'Belum')}</div>
      </div>

      {error ? (
        <div className="p-10 text-center">
          <p className="text-sm font-bold text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              loadPage(0, false)
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#dfe4e8] px-4 py-2 text-xs font-bold text-[#657080] hover:bg-[#f1f3f5]"
          >
            <RefreshCcw size={13} /> Coba lagi
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <Loader2 size={24} className="animate-spin text-[#1b4f9c]" />
          <p className="text-xs font-semibold text-[#657080]">Memuat peserta…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center">
          <SearchX className="mx-auto text-[#9aa3af]" size={28} />
          <p className="mt-2 text-sm font-bold text-[#1b3555]">Tidak ada peserta</p>
          <p className="text-xs text-[#657080]">Import file Excel, ubah kata kunci, atau longgarkan filter.</p>
        </div>
      ) : (
        <div className="space-y-6 p-5">
          {groups.map(({ bus, items: rows }) => (
            <div key={bus.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="flex h-7 items-center rounded-full bg-[#eef3fb] px-3 text-xs font-black text-[#1b4f9c]">
                  {bus.name}
                </span>
                <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#657080]">
                  {bus.count} peserta
                </span>
                {bus.attended > 0 && (
                  <span className="rounded-full bg-[#e6f4ea] px-2.5 py-1 text-[11px] font-bold text-[#2ca84a]">
                    {bus.attended} hadir
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#dfe4e8]">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wide text-[#9aa3af]">
                      <th className="px-3 py-2.5">No</th>
                      <th className="px-3 py-2.5">Nama Lengkap</th>
                      {hasAny.ttl && <th className="px-3 py-2.5">TTL</th>}
                      {hasAny.phone && <th className="px-3 py-2.5">Telp/HP</th>}
                      {hasAny.seat && <th className="px-3 py-2.5">Kursi</th>}
                      {hasAny.room && <th className="px-3 py-2.5">Kamar</th>}
                      {hasAny.vw && <th className="px-3 py-2.5">VW</th>}
                      <th className="px-3 py-2.5">Kehadiran</th>
                      <th className="px-3 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef0f3]">
                    {rows.map((p) => (
                      <tr key={p.id} className={p.scannedAt ? 'bg-[#f6fbf8]' : 'bg-white'}>
                        <td className="px-3 py-2.5 font-bold text-[#9aa3af]">{p.order}</td>
                        <td className="px-3 py-2.5 font-bold text-[#1b3555]">{p.name}</td>
                        {hasAny.ttl && (
                          <td className="px-3 py-2.5 text-[#657080]">
                            {p.birthDate
                              ? `${formatTanggalPendek(new Date(p.birthDate))}${p.birthPlace ? ` · ${p.birthPlace}` : ''}`
                              : p.birthPlace || '—'}
                          </td>
                        )}
                        {hasAny.phone && <td className="px-3 py-2.5 text-[#657080]">{p.phone || '—'}</td>}
                        {hasAny.seat && <td className="px-3 py-2.5 text-[#657080]">{p.seat || '—'}</td>}
                        {hasAny.room && <td className="px-3 py-2.5 text-[#657080]">{p.room || '—'}</td>}
                        {hasAny.vw && <td className="px-3 py-2.5 text-[#657080]">{p.vw || '—'}</td>}
                        <td className="px-3 py-2.5">
                          {p.scannedAt ? (
                            <div className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-[11px] font-bold text-[#2ca84a]">
                              <BadgeCheck size={12} />
                              Hadir {p.scannedBy ? ` · ${p.scannedBy.name ?? p.scannedBy.username}` : ''}
                            </div>
                          ) : (
                            <span className="rounded-full bg-[#fff7e0] px-2.5 py-1 text-[11px] font-bold text-[#b98a12]">
                              Belum
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end">
                            <EditParticipant eventId={eventId} participant={p} buses={buses} />
                            <DeleteParticipant eventId={eventId} participant={p} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {items.length < total && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setLoadingMore(true)
                  loadPage(items.length, true)
                }}
                disabled={loadingMore}
                className="flex items-center gap-1.5 rounded-full border border-[#1b4f9c] px-6 py-2.5 text-xs font-bold text-[#1b4f9c] transition-colors duration-200 hover:bg-[#eef3fb] active:scale-95 disabled:opacity-60"
              >
                {loadingMore && <Loader2 size={13} className="animate-spin" />} Muat lebih banyak ({total - items.length} lagi)
              </button>
              <p className="text-[11px] font-semibold text-[#9aa3af]">
                Menampilkan {items.length} dari {total} peserta
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}