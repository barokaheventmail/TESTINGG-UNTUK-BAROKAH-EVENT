'use client'

import { useMemo, useState } from 'react'
import { BadgeCheck, Search, SearchX } from 'lucide-react'
import { formatTanggalPendek } from '@/lib/dates'
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
  scannedBy: { username: string } | null
}

export type RowBus = {
  id: string
  name: string
  order: number
}

type StatusFilter = 'all' | 'attended' | 'pending'

export function ParticipantTable({ eventId, buses, participants }: { eventId: string; buses: RowBus[]; participants: RowParticipant[] }) {
  const [query, setQuery] = useState('')
  const [busFilter, setBusFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return participants.filter((p) => {
      if (busFilter !== 'all' && p.busId !== busFilter) return false
      if (statusFilter === 'attended' && !p.scannedAt) return false
      if (statusFilter === 'pending' && p.scannedAt) return false
      if (q) {
        const hit = [p.name, p.phone, p.room, p.vw, p.seat, p.birthPlace].some((v) => v?.toLowerCase().includes(q))
        if (!hit) return false
      }
      return true
    })
  }, [query, busFilter, statusFilter, participants])

  const attended = useMemo(() => participants.filter((p) => p.scannedAt).length, [participants])

  const groups = useMemo(() => {
    return buses
      .filter((bus) => busFilter === 'all' || bus.id === busFilter)
      .map((bus) => ({
        bus,
        items: filtered.filter((p) => p.busId === bus.id).sort((a, b) => a.order - b.order),
      }))
      .filter((g) => g.items.length > 0)
  }, [buses, filtered, busFilter])

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
            {participants.length} peserta · <span className="font-bold text-[#2ca84a]">{attended} hadir</span>
            {filtered.length !== participants.length && (
              <span className="text-[#9aa3af]"> · menampilkan {filtered.length}</span>
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
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setBusFilter('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
              busFilter === 'all' ? 'bg-[#1b3555] text-white' : 'border border-[#dfe4e8] text-[#657080] hover:bg-[#f1f3f5]'
            }`}
          >
            Semua Bus
          </button>
          {buses.map((bus) => {
            const total = participants.filter((p) => p.busId === bus.id).length
            return (
              <button
                type="button"
                key={bus.id}
                onClick={() => setBusFilter(bus.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
                  busFilter === bus.id ? 'bg-[#1b4f9c] text-white' : 'border border-[#dfe4e8] text-[#657080] hover:bg-[#f1f3f5]'
                }`}
              >
                {bus.name}
                <span className={busFilter === bus.id ? 'text-[#cfe0ff]' : 'text-[#9aa3af]'}>{total}</span>
              </button>
            )
          })}
        </div>
        <div className="ml-auto flex items-center gap-1.5">{statusBtn('all', 'Semua')}{statusBtn('attended', 'Hadir')}{statusBtn('pending', 'Belum')}</div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center">
          <SearchX className="mx-auto text-[#9aa3af]" size={28} />
          <p className="mt-2 text-sm font-bold text-[#1b3555]">Tidak ada peserta</p>
          <p className="text-xs text-[#657080]">Import file Excel, ubah kata kunci, atau longgarkan filter.</p>
        </div>
      ) : (
        <div className="space-y-6 p-5">
          {groups.map(({ bus, items }) => {
            const busAttended = items.filter((p) => p.scannedAt).length
            return (
              <div key={bus.id}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="flex h-7 items-center rounded-full bg-[#eef3fb] px-3 text-xs font-black text-[#1b4f9c]">
                    {bus.name}
                  </span>
                  <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#657080]">
                    {items.length} peserta
                  </span>
                  {busAttended > 0 && (
                    <span className="rounded-full bg-[#e6f4ea] px-2.5 py-1 text-[11px] font-bold text-[#2ca84a]">
                      {busAttended} hadir
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#dfe4e8]">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wide text-[#9aa3af]">
                        <th className="px-3 py-2.5">No</th>
                        <th className="px-3 py-2.5">Nama Lengkap</th>
                        <th className="px-3 py-2.5">TTL</th>
                        <th className="px-3 py-2.5">Telp/HP</th>
                        <th className="px-3 py-2.5">Kursi</th>
                        <th className="px-3 py-2.5">Kamar</th>
                        <th className="px-3 py-2.5">VW</th>
                        <th className="px-3 py-2.5">Kehadiran</th>
                        <th className="px-3 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef0f3]">
                      {items.map((p) => (
                        <tr key={p.id} className={p.scannedAt ? 'bg-[#f6fbf8]' : 'bg-white'}>
                          <td className="px-3 py-2.5 font-bold text-[#9aa3af]">{p.order}</td>
                          <td className="px-3 py-2.5 font-bold text-[#1b3555]">{p.name}</td>
                          <td className="px-3 py-2.5 text-[#657080]">
                            {p.birthDate
                              ? `${formatTanggalPendek(new Date(p.birthDate))}${p.birthPlace ? ` · ${p.birthPlace}` : ''}`
                              : p.birthPlace || '—'}
                          </td>
                          <td className="px-3 py-2.5 text-[#657080]">{p.phone || '—'}</td>
                          <td className="px-3 py-2.5 text-[#657080]">{p.seat || '—'}</td>
                          <td className="px-3 py-2.5 text-[#657080]">{p.room || '—'}</td>
                          <td className="px-3 py-2.5 text-[#657080]">{p.vw || '—'}</td>
                          <td className="px-3 py-2.5">
                            {p.scannedAt ? (
                              <div className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-[11px] font-bold text-[#2ca84a]">
                                <BadgeCheck size={12} />
                                Hadir {p.scannedBy ? ` · ${p.scannedBy.username}` : ''}
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
            )
          })}
        </div>
      )}
    </div>
  )
}