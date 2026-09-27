'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, type KeyboardEvent } from 'react'
import { CalendarDays, Check, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { parseItinerary, serializeItinerary, groupItineraryByDay, type ItineraryRow } from '@/lib/itinerary'

type DayRows = Pick<ItineraryRow, 'time' | 'agenda' | 'keterangan'>[]

export function PanduanEditor({
  eventId,
  initialItinerary,
  initialCrewName,
  initialCrewPhone,
  initialCrewPhotoUrl,
}: {
  eventId: string
  initialItinerary: string
  initialCrewName: string
  initialCrewPhone: string
  initialCrewPhotoUrl: string | null
}) {
  const router = useRouter()
  const [dayBlocks, setDayBlocks] = useState<DayRows[]>(() =>
    groupItineraryByDay(parseItinerary(initialItinerary)).map((g) =>
      g.rows.map((r) => ({ time: r.time, agenda: r.agenda, keterangan: r.keterangan })),
    ),
  )
  const [crew, setCrew] = useState({ name: initialCrewName, phone: initialCrewPhone, photoUrl: initialCrewPhotoUrl })
  const [crewEditing, setCrewEditing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [crewBusy, setCrewBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const rowRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function setDayRow(b: number, r: number, patch: Partial<DayRows[number]>) {
    setDayBlocks((blocks) =>
      blocks.map((rows, i) => (i === b ? rows.map((row, j) => (j === r ? { ...row, ...patch } : row)) : rows)),
    )
  }

  function addDayRow(b: number) {
    setDayBlocks((blocks) => blocks.map((rows, i) => (i === b ? [...rows, { time: '', agenda: '', keterangan: '' }] : rows)))
  }

  function removeDayRow(b: number, r: number) {
    setDayBlocks((blocks) => blocks.map((rows, i) => (i === b ? rows.filter((_, j) => j !== r) : rows)))
  }

  function addDay() {
    setDayBlocks((blocks) => [...blocks, []])
  }

  function removeDay(b: number) {
    setDayBlocks((blocks) => blocks.filter((_, i) => i !== b))
  }

  function dayRowEnter(b: number, r: number, col: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const next = rowRefs.current[`${b}:${r}:${col + 1}`]
    if (next) {
      next.focus()
      return
    }
    const rowCount = dayBlocks[b]?.length
    const nextRow = rowRefs.current[`${b}:${r + 1}:0`]
    if (rowCount && r + 1 < rowCount && nextRow) {
      nextRow.focus()
      return
    }
    addDayRow(b)
    requestAnimationFrame(() => rowRefs.current[`${b}:${r + 1}:0`]?.focus())
  }

  function parseWaktu(value: string): { start: string; end: string } {
    const range = /^(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})/.exec(value.trim())
    const single = /^(\d{1,2})[.:](\d{2})/.exec(value.trim())
    const toInput = (h: string, m: string) => `${h.padStart(2, '0')}:${m}`
    if (range) return { start: toInput(range[1], range[2]), end: toInput(range[3], range[4]) }
    if (single) return { start: toInput(single[1], single[2]), end: '' }
    return { start: '', end: '' }
  }

  function serializeWaktu(start: string, end: string): string {
    const s = start.replace(':', '.')
    const e = end.replace(':', '.')
    if (s && e) return `${s} - ${e}`
    return s
  }

  async function save() {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panduanItinerary: serializeItinerary(dayBlocks.flatMap((rows, b) => rows.map((row) => ({ ...row, day: b + 1 })))),
          crewName: crew.name.trim() || null,
          crewPhone: crew.phone.trim() || null,
          crewPhotoUrl: crew.photoUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan.')
      setStatus({ kind: 'ok', msg: 'Panduan tersimpan.' })
      router.refresh()
    } catch (err) {
      setStatus({ kind: 'err', msg: err instanceof Error ? err.message : 'Gagal menyimpan.' })
    } finally {
      setLoading(false)
    }
  }

  async function uploadCrewPhoto(file: File) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setStatus({ kind: 'err', msg: 'Hanya mendukung gambar JPG, PNG, atau WebP.' })
      return
    }
    setUploadingPhoto(true)
    setStatus(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/events/${eventId}/crew-photo`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal mengunggah foto.')
      setCrew((c) => ({ ...c, photoUrl: data.url }))
      setStatus({ kind: 'ok', msg: 'Foto crew diperbarui.' })
      router.refresh()
    } catch (err) {
      setStatus({ kind: 'err', msg: err instanceof Error ? err.message : 'Gagal mengunggah foto.' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function removeCrewPhoto() {
    setCrewBusy(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/crew-photo`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menghapus foto.')
      setCrew((c) => ({ ...c, photoUrl: null }))
      setStatus({ kind: 'ok', msg: 'Foto crew dihapus.' })
      router.refresh()
    } catch (err) {
      setStatus({ kind: 'err', msg: err instanceof Error ? err.message : 'Gagal menghapus foto.' })
    } finally {
      setCrewBusy(false)
    }
  }

  async function saveCrew() {
    setCrewBusy(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crewName: crew.name.trim() || null,
          crewPhone: crew.phone.trim() || null,
          crewPhotoUrl: crew.photoUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan crew.')
      setCrewEditing(false)
      setStatus({ kind: 'ok', msg: 'Crew on duty tersimpan.' })
      router.refresh()
    } catch (err) {
      setStatus({ kind: 'err', msg: err instanceof Error ? err.message : 'Gagal menyimpan crew.' })
    } finally {
      setCrewBusy(false)
    }
  }

  async function clearCrew() {
    setCrewBusy(true)
    setStatus(null)
    try {
      if (crew.photoUrl) {
        const res = await fetch(`/api/admin/events/${eventId}/crew-photo`, { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Gagal menghapus foto.')
      }
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crewName: null, crewPhone: null, crewPhotoUrl: null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menghapus crew.')
      setCrew({ name: '', phone: '', photoUrl: null })
      setCrewEditing(false)
      setStatus({ kind: 'ok', msg: 'Crew on duty dihapus.' })
      router.refresh()
    } catch (err) {
      setStatus({ kind: 'err', msg: err instanceof Error ? err.message : 'Gagal menghapus crew.' })
    } finally {
      setCrewBusy(false)
    }
  }

  const rowCls =
    'rounded-lg border border-[#dfe4e8] bg-white px-3 py-2 text-sm font-semibold text-[#1b3555] outline-none transition-colors placeholder:text-[#9aa3af] focus:border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/15'
  const addBtnCls =
    'flex items-center gap-1 rounded-full bg-[#eef4fb] px-3 py-1.5 text-[11px] font-bold text-[#1b4f9c] transition-colors hover:bg-[#e2ecf8]'

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#1b3555]">Panduan Peserta</h2>
            <p className="mt-0.5 text-xs text-[#657080]">
              Itinerary khusus event ini, ditampilkan di panduan publik dan untuk crew.
            </p>
          </div>
          <Link
            href={`/event/${eventId}/panduan`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-full border border-[#dfe4e8] px-3 py-1.5 text-[11px] font-bold text-[#1b4f9c] transition-colors hover:bg-[#eef4fb]"
          >
            <ExternalLink size={12} /> Lihat Halaman Publik
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-[#1b3555]">Itinerary Perjalanan</h2>
          <p className="mt-0.5 text-xs text-[#657080]">
            {dayBlocks.length} hari · {dayBlocks.reduce((n, rows) => n + rows.length, 0)} agenda
          </p>
        </div>
        {dayBlocks.length === 0 ? (
          <p className="mt-2 text-xs text-[#9aa3af]">Belum ada hari. Tambah hari baru untuk menyusun itinerary.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {dayBlocks.map((rows, b) => (
              <div key={b} className="rounded-xl border border-[#e8ecf1] bg-[#fbfcfe] p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-bold text-[#1b4f9c]">
                    <CalendarDays size={13} /> Day {b + 1}
                  </span>
                  <span className="text-[11px] text-[#9aa3af]">{rows.length} agenda</span>
                  <button
                    type="button"
                    onClick={() => removeDay(b)}
                    aria-label={`Hapus hari ${b + 1}`}
                    className="ml-auto rounded-lg p-2 text-[#657080] transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {rows.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-[#dfe4e8] px-4 py-3 text-xs text-[#9aa3af]">
                    Belum ada agenda — susun jadwal hari ini.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 hidden items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#657080] sm:flex">
                      <span className="w-full sm:w-60 sm:shrink-0 sm:pl-1">Waktu</span>
                      <span className="w-full sm:min-w-0 sm:flex-1 sm:pl-1">Agenda</span>
                      <span className="w-full sm:min-w-0 sm:flex-1 sm:pl-1">Keterangan</span>
                    </div>
                    <div className="mt-2 space-y-2 sm:mt-3">
                      {rows.map((row, r) => (
                        <div key={r} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                          <div className="flex items-center gap-1 sm:w-60 sm:shrink-0">
                            <input
                              ref={(el) => {
                                rowRefs.current[`${b}:${r}:0`] = el
                              }}
                              type="time"
                              value={parseWaktu(row.time).start}
                              onChange={(e) => setDayRow(b, r, { time: serializeWaktu(e.target.value, parseWaktu(row.time).end) })}
                              onKeyDown={(e) => dayRowEnter(b, r, 0, e)}
                              aria-label="Jam mulai"
                              className={`${rowCls} min-w-0 w-full`}
                            />
                            <span className="shrink-0 text-[#9aa3af]">–</span>
                            <input
                              ref={(el) => {
                                rowRefs.current[`${b}:${r}:1`] = el
                              }}
                              type="time"
                              value={parseWaktu(row.time).end}
                              onChange={(e) => setDayRow(b, r, { time: serializeWaktu(parseWaktu(row.time).start, e.target.value) })}
                              onKeyDown={(e) => dayRowEnter(b, r, 1, e)}
                              aria-label="Jam selesai (opsional)"
                              className={`${rowCls} min-w-0 w-full`}
                            />
                          </div>
                          <input
                            ref={(el) => {
                              rowRefs.current[`${b}:${r}:2`] = el
                            }}
                            value={row.agenda}
                            onChange={(e) => setDayRow(b, r, { agenda: e.target.value })}
                            onKeyDown={(e) => dayRowEnter(b, r, 2, e)}
                            placeholder="Agenda kegiatan"
                            className={`${rowCls} w-full sm:min-w-0 sm:flex-1`}
                          />
                          <div className="flex items-center gap-2 sm:min-w-0 sm:flex-1">
                            <input
                              ref={(el) => {
                                rowRefs.current[`${b}:${r}:3`] = el
                              }}
                              value={row.keterangan}
                              onChange={(e) => setDayRow(b, r, { keterangan: e.target.value })}
                              onKeyDown={(e) => dayRowEnter(b, r, 3, e)}
                              placeholder="Keterangan (opsional)"
                              className={`${rowCls} min-w-0 flex-1`}
                            />
                            <button type="button" onClick={() => removeDayRow(b, r)} aria-label="Hapus agenda" className="shrink-0 rounded-lg p-2 text-[#657080] transition-colors hover:bg-red-50 hover:text-red-600">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <button type="button" onClick={() => addDayRow(b)} className={`${addBtnCls} mt-3`}>
                  <Plus size={12} /> Tambahkan Agenda
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addDay}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#c6d2df] py-3 text-xs font-bold text-[#1b4f9c] transition-colors hover:border-[#1b4f9c] hover:bg-[#eef4fb]"
        >
          <Plus size={14} /> Tambah Hari Baru
        </button>
      </div>

      <div className="rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#1b3555]">Crew on Duty</h2>
          {!crew.name && !crewEditing && (
            <button type="button" onClick={() => setCrewEditing(true)} className={addBtnCls}>
              <Plus size={12} /> Tambah Crew
            </button>
          )}
        </div>

        {crew.name ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dcebe0] text-base font-bold text-[#2ca84a]">
              {crew.photoUrl ? (
                <img src={crew.photoUrl} alt={crew.name} className="h-full w-full object-cover" />
              ) : (
                crew.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <strong className="block text-sm text-[#1b3555]">{crew.name}</strong>
              {crew.phone && <span className="text-xs text-[#657080]">{crew.phone}</span>}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => setCrewEditing(true)} className="inline-flex items-center gap-1 rounded-full border border-[#dfe4e8] px-3 py-1.5 text-[11px] font-bold text-[#1b4f9c] transition-colors hover:bg-[#eef4fb]">
                <Pencil size={11} /> Edit
              </button>
              <button type="button" onClick={clearCrew} disabled={crewBusy} className="inline-flex items-center gap-1 rounded-full border border-[#dfe4e8] px-3 py-1.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60">
                <Trash2 size={11} /> Hapus
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-[#9aa3af]">Belum ada crew on duty untuk event ini.</p>
        )}

        {crewEditing && (
          <div className="mt-4 space-y-3 border-t border-[#eef1f4] pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dcebe0] text-xl font-bold text-[#2ca84a]">
                {crew.photoUrl ? (
                  <img src={crew.photoUrl} alt={crew.name || 'Foto crew'} className="h-full w-full object-cover" />
                ) : (
                  crew.name.slice(0, 2).toUpperCase() || 'CR'
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#dfe4e8] px-3 py-1.5 text-[11px] font-bold text-[#1b4f9c] transition-colors hover:bg-[#eef4fb] disabled:opacity-60">
                {uploadingPhoto ? <Loader2 size={11} className="animate-spin" /> : null}
                {uploadingPhoto ? 'Mengunggah…' : 'Unggah Foto'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingPhoto || crewBusy} onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadCrewPhoto(file)
                  e.target.value = ''
                }} />
              </label>
              {crew.photoUrl && (
                <button type="button" onClick={removeCrewPhoto} disabled={uploadingPhoto || crewBusy} className="text-[11px] font-bold text-red-600 hover:underline disabled:opacity-60">
                  Hapus Foto
                </button>
              )}
            </div>

            <input
              value={crew.name}
              onChange={(e) => setCrew((c) => ({ ...c, name: e.target.value }))}
              placeholder="Nama crew"
              className={`${rowCls} w-full`}
            />
            <input
              value={crew.phone}
              onChange={(e) => setCrew((c) => ({ ...c, phone: e.target.value }))}
              placeholder="No. WhatsApp"
              className={`${rowCls} w-full`}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCrewEditing(false)
                  setCrew({ name: initialCrewName, phone: initialCrewPhone, photoUrl: initialCrewPhotoUrl })
                }}
                disabled={crewBusy}
                className="rounded-full border border-[#dfe4e8] px-4 py-2 text-xs font-bold text-[#657080] transition-colors hover:bg-[#eef1f4] disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveCrew}
                disabled={crewBusy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1b4f9c] px-5 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95 disabled:opacity-60"
              >
                {crewBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Simpan Crew
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#1b3555]">Tata Tertib</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#657080]">
          Tata tertib sudah ditetapkan dan tidak dapat diedit. Aturan tetap tampil di halaman panduan publik.
        </p>
      </div>

      {status && (
        <p className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${status.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {status.kind === 'ok' && <Check size={13} className="mr-1 inline" />}
          {status.msg}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full bg-[#1b4f9c] px-6 py-2.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Simpan Panduan
        </button>
      </div>
    </div>
  )
}