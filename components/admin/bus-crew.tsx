'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bus, Check, ChevronDown, KeyRound, Loader2, Pencil, Phone, Plus, Search, Trash2, User as UserIcon, X } from 'lucide-react'

export type BusWorkerData = {
  id: string
  order: number
  user: { id: string; username: string; name: string | null; phone: string | null }
}

export type BusWithWorkersData = {
  id: string
  name: string
  order: number
  count: number
  attended: number
  workers: BusWorkerData[]
}

function generatePassword(len = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  let out = ''
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length]
  return out
}

function usernameFromName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 20)
  return base || 'crew'
}

const inputCls =
  'w-full rounded-xl border border-[#dfe4e8] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#1b3555] outline-none placeholder:text-[#9aa3af] focus:border-[#1b4f9c] focus:bg-white focus:ring-2 focus:ring-[#1b4f9c]/15'

// Armandanya bisa dozens bus, jadi strip chip horizontal memaksa pengguna
// menggulir ribuan piksel. Satu dropdown + pencarian lebih ringkas dan bus mana
// pun bisa ditemukan tanpa scroll.
function ArmadaPicker({
  buses,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
}: {
  buses: BusWithWorkersData[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const needle = q.trim().toLowerCase()
  const filtered = useMemo(
    () => (needle ? buses.filter((b) => b.name.toLowerCase().includes(needle)) : buses),
    [buses, needle],
  )
  const allIds = useMemo(() => filtered.map((b) => b.id), [filtered])
  const pickedInView = allIds.filter((id) => selectedIds.includes(id)).length
  const allPicked = allIds.length > 0 && pickedInView === allIds.length
  const totalCrew = buses.filter((b) => selectedIds.includes(b.id)).reduce((s, b) => s + b.workers.length, 0)

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="group flex w-full items-center gap-3 rounded-2xl bg-[linear-gradient(100deg,#071e3d_0%,#163d78_100%)] px-4 py-3 text-left text-white shadow-[0_14px_32px_-14px_rgba(9,32,74,0.95)] transition-shadow duration-300 hover:shadow-[0_18px_38px_-14px_rgba(9,32,74,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Bus size={17} />
        </span>
        {/* `pr-20` hanya dipakai saat ada pilihan, untuk memberi ruang tombol X.
            Kalau tidak, trigger cukup `px-4` supaya panah tetap menempel di
            tepi kanan dan tidak melayang jauh dari ujung. */}
        <span className={`min-w-0 flex-1 ${selectedIds.length > 0 ? 'pr-20' : ''}`}>
          <span className="block truncate text-sm font-bold">
            {selectedIds.length === 0
              ? 'Pilih Armada'
              : selectedIds.length === 1
                ? buses.find((b) => b.id === selectedIds[0])?.name
                : `${selectedIds.length} bus dipilih`}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/70">
            {selectedIds.length === 0
              ? `${buses.length} bus tersedia · bisa pilih beberapa`
              : `${totalCrew} crew di ${selectedIds.length} bus terpilih`}
          </span>
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/90 ring-1 ring-inset ring-white/20 transition-all duration-300 ease-out group-hover:bg-white/25 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown size={15} />
        </span>
      </button>

      {/* Tombol X ini sengaja jadi saudara trigger, bukan anaknya: elemen
          interaktif di dalam <button> itu HTML tidak valid. */}
      {selectedIds.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          title="Batalkan semua pilihan"
          aria-label="Batalkan semua pilihan"
          className="absolute right-12 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/20 transition-colors duration-200 hover:bg-[#e05a4d]"
        >
          <X size={13} />
        </button>
      )}

      {/* Tanpa `transform`/`filter` agar tidak menjadi blok penampung posisi
          untuk elemen `fixed` di dalam panel. */}
      <div
        role="listbox"
        aria-hidden={!open}
        className={`absolute inset-x-0 top-full z-40 mt-2 rounded-2xl border border-[#ece3cd] bg-white p-2 transition-[opacity,visibility,box-shadow] duration-200 ease-out ${
          open
            ? 'visible opacity-100 shadow-[0_28px_70px_-22px_rgba(9,32,74,0.6)]'
            : 'pointer-events-none invisible opacity-0 shadow-[0_12px_28px_-20px_rgba(9,32,74,0.4)]'
        }`}
      >
        <div className="mb-1.5 h-px bg-gradient-to-r from-transparent via-[#e8d9ab] to-transparent" />

        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa3af]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => inputRef.current?.select()}
            placeholder="Cari bus, mis. bus 12"
            className="w-full rounded-xl border border-[#dfe4e8] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs font-semibold text-[#1b3555] outline-none placeholder:text-[#9aa3af] focus:border-[#1b4f9c] focus:bg-white focus:ring-2 focus:ring-[#1b4f9c]/15"
          />
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={allPicked ? onClear : onSelectAll}
            className="flex items-center gap-1.5 rounded-full border border-[#e8d9ab] bg-[#fbf7ec] px-3 py-1.5 text-[11px] font-bold text-[#b8860b] transition-colors duration-200 hover:bg-[#f5e7bd]"
          >
            {allPicked ? <X size={11} /> : <Check size={11} />}
            {allPicked ? 'Batalkan semua' : `Pilih semua${needle ? ` (${filtered.length})` : ''}`}
          </button>
          <span className="text-[11px] font-semibold text-[#8a93a3]">
            {pickedInView} dari {filtered.length} tampil dipilih
          </span>
        </div>

        <div className="mt-1.5 max-h-72 overflow-y-auto overscroll-contain">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs font-semibold text-[#9aa3af]">
              Tidak ada bus yang cocok dengan &ldquo;{q.trim()}&rdquo;.
            </p>
          ) : (
            filtered.map((bus) => {
              const isSelected = selectedIds.includes(bus.id)
              return (
                <button
                  key={bus.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onToggle(bus.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-200 ${
                    isSelected ? 'bg-[#fbf7ec]' : 'hover:bg-[#f4f7fa]'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                      isSelected ? 'bg-[#f5e7bd] text-[#b8860b]' : 'bg-[#eef3fb] text-[#163d78]'
                    }`}
                  >
                    {isSelected ? <Check size={15} /> : <Bus size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-[#1b3555]">{bus.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#f1f3f5] px-2 py-0.5 text-[10px] font-bold text-[#657080]">
                        {bus.count} peserta
                      </span>
                      {bus.attended > 0 && (
                        <span className="rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[10px] font-bold text-[#2ca84a]">
                          {bus.attended} hadir
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          bus.workers.length > 0
                            ? 'bg-[#eef3fb] text-[#1b4f9c]'
                            : 'bg-[#f8fafc] text-[#9aa3af]'
                        }`}
                      >
                        {bus.workers.length > 0 ? `${bus.workers.length} crew` : 'belum ada crew'}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div className="mt-1.5 h-px bg-[#f1f3f5]" />
        <p className="px-2.5 py-1.5 text-[11px] font-semibold text-[#8a93a3]">
          {filtered.length === buses.length
            ? `Menampilkan semua ${buses.length} bus.`
            : `${filtered.length} bus cocok dari ${buses.length}.`}
        </p>
      </div>
    </div>
  )
}

// Mode gabungan: satu daftar untuk semua bus terpilih. Bus tanpa crew tetap
// ikut ditampilkan sebagai baris "belum ada crew" supaya tidak ada yang terasa
// hilang -- terutama saat "Pilih Semua" dipakai di event dengan 78 bus.
function CombinedCrewPanel({ eventId, buses }: { eventId: string; buses: BusWithWorkersData[] }) {
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const totalCrew = buses.reduce((s, b) => s + b.workers.length, 0)
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">
        {buses.length} bus dipilih · {totalCrew} crew
      </p>
      <div className="mt-2 divide-y divide-[#f1f3f5]">
        {buses.map((bus) => (
          <div key={bus.id} className="py-2 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eef3fb] text-[#163d78]">
                <Bus size={14} />
              </span>
              <span className="text-[13px] font-bold text-[#1b3555]">{bus.name}</span>
              <span className="rounded-full bg-[#f1f3f5] px-2 py-0.5 text-[10px] font-bold text-[#657080]">
                {bus.count} peserta
              </span>
              {bus.attended > 0 && (
                <span className="rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[10px] font-bold text-[#2ca84a]">
                  {bus.attended} hadir
                </span>
              )}
              <span className="ml-auto flex items-center gap-0.5">
                <span className="mr-1 text-[11px] font-semibold text-[#8a93a3]">
                  {bus.workers.length > 0 ? `${bus.workers.length} crew` : 'belum ada crew'}
                </span>
                <button
                  type="button"
                  onClick={() => setAddingTo((cur) => (cur === bus.id ? null : bus.id))}
                  title={`Tambah crew di ${bus.name}`}
                  className="rounded-full p-1.5 text-[#1b4f9c] transition-colors hover:bg-[#eef3fb]"
                >
                  <Plus size={14} />
                </button>
                <RenameArmada eventId={eventId} bus={bus} compact />
                <DeleteArmada eventId={eventId} bus={bus} compact />
              </span>
            </div>
            {bus.workers.length > 0 && (
              <div className="mt-1.5 pl-9">
                {bus.workers.map((w) => (
                  <WorkerRow key={w.id} eventId={eventId} busId={bus.id} worker={w} />
                ))}
              </div>
            )}
            {addingTo === bus.id && (
              <AddCrewForm eventId={eventId} bus={bus} onClose={() => setAddingTo(null)} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function BusArmadaSection({ eventId, buses }: { eventId: string; buses: BusWithWorkersData[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectedBuses = useMemo(
    // Urut ikut `buses` (bukan urutan klik) supaya daftar gabungan selalu rapi.
    () => buses.filter((b) => selectedIds.includes(b.id)),
    [buses, selectedIds],
  )
  const single = selectedBuses.length === 1 ? selectedBuses[0] : null

  return (
    <>
      <ArmadaPicker
        buses={buses}
        selectedIds={selectedIds}
        onToggle={(id) =>
          setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
        }
        onSelectAll={() => setSelectedIds(buses.map((b) => b.id))}
        onClear={() => setSelectedIds([])}
      />

      {selectedBuses.length > 0 && (
        <div className="animate-fade-up mt-2 rounded-2xl border border-[#1b4f9c]/30 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#1b3555]">
              Crew Armada{' '}
              <span className="text-[#1b4f9c]">
                {single ? single.name : `${selectedBuses.length} bus dipilih`}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              {/* Aksi armada ini per-bus, jadi hanya saat tepat satu bus dipilih. */}
              {single && (
                <>
                  <span className="text-[11px] font-semibold text-[#657080]">
                    {single.count} peserta
                    {single.attended > 0 ? ` · ${single.attended} hadir` : ''}
                  </span>
                  <RenameArmada eventId={eventId} bus={single} />
                  <DeleteArmada eventId={eventId} bus={single} />
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-full p-1 text-[#657080] hover:bg-[#f1f3f5]"
                title="Tutup"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {single ? (
            <BusCrewPanel eventId={eventId} bus={single} />
          ) : (
            <CombinedCrewPanel eventId={eventId} buses={selectedBuses} />
          )}
        </div>
      )}
    </>
  )
}

function RenameArmada({ eventId, bus, compact = false }: { eventId: string; bus: BusWithWorkersData; compact?: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(bus.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const clean = name.trim()
    if (!clean || clean === bus.name) {
      setEditing(false)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bus/${bus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal mengubah nama armada.')
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah nama armada.')
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
          className="w-32 rounded-full border border-[#1b4f9c]/40 bg-[#eef3fb] px-3 py-1 text-xs font-bold text-[#1b3555] outline-none focus:ring-2 focus:ring-[#1b4f9c]/30"
        />
        <button type="button" onClick={save} disabled={busy || !name.trim()} className="rounded-full p-1 text-[#1b4f9c] hover:bg-[#eef3fb] disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        </button>
        <button type="button" onClick={() => { setEditing(false); setName(bus.name) }} className="rounded-full p-1 text-[#657080] hover:bg-[#f1f3f5]">
          <X size={13} />
        </button>
        {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setName(bus.name); setError(null); setEditing(true) }}
      title="Ubah nama armada"
      className={
        compact
          ? 'rounded-full p-1.5 text-[#657080] transition-colors hover:bg-[#f1f3f5]'
          : 'flex items-center gap-1 rounded-full border border-[#dfe4e8] px-2.5 py-1 text-[11px] font-bold text-[#657080] hover:bg-[#f1f3f5]'
      }
    >
      {compact ? <Pencil size={13} /> : <><Pencil size={11} /> Ubah nama</>}
    </button>
  )
}

function DeleteArmada({ eventId, bus, compact = false }: { eventId: string; bus: BusWithWorkersData; compact?: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bus/${bus.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menghapus armada.')
      setConfirming(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus armada.')
    } finally {
      setBusy(false)
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 py-1 pr-2 pl-3">
        <span className="text-[11px] font-bold text-[#1b3555]">
          Hapus <span className="text-red-600">{bus.name}</span>?{bus.count > 0 && <span> {bus.count} peserta ikut terhapus.</span>}
        </span>
        <button type="button" onClick={remove} disabled={busy} className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-60">
          {busy ? <Loader2 size={11} className="animate-spin" /> : 'Ya'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded-full px-2 py-1 text-[11px] font-bold text-[#657080] hover:bg-white">
          Batal
        </button>
        {error && <span className="text-[11px] font-semibold text-red-600">{error}</span>}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title="Hapus armada"
      className={
        compact
          ? 'rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-50'
          : 'flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50'
      }
    >
      {compact ? <Trash2 size={13} /> : <><Trash2 size={11} /> Hapus armada</>}
    </button>
  )
}

function WorkerRow({
  eventId,
  busId,
  worker,
}: {
  eventId: string
  busId: string
  worker: BusWorkerData
}) {
  const router = useRouter()
  const [editingPhone, setEditingPhone] = useState(false)
  const [phone, setPhone] = useState(worker.user.phone ?? '')
  const [resetOpen, setResetOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function savePhone() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bus/${busId}/workers/${worker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Gagal mengubah nomor WA.')
      }
      setEditingPhone(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah nomor WA.')
    } finally {
      setBusy(false)
    }
  }

  async function removeWorker() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bus/${busId}/workers/${worker.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Gagal melepas crew.')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal melepas crew.')
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bus/${busId}/workers/${worker.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Gagal reset password.')
      }
      setResetOpen(false)
      setPassword('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal reset password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-b border-[#eef0f3] py-2 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef3fb] text-[#1b4f9c]">
          <UserIcon size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[#1b3555]">{worker.user.name || worker.user.username}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-[11px] font-semibold text-[#657080]">
            <span className="flex items-center gap-1">
              <UserIcon size={10} /> @{worker.user.username}
            </span>
            <span className="flex items-center gap-1">
              <Phone size={10} /> {worker.user.phone || '—'}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingPhone(true); setPhone(worker.user.phone ?? '') }}
          className="rounded-full border border-[#dfe4e8] px-2.5 py-1 text-[11px] font-bold text-[#657080] hover:bg-[#f1f3f5]"
        >
          <Phone size={11} className="inline" /> WA
        </button>
        <button
          type="button"
          onClick={() => setResetOpen((v) => !v)}
          className="rounded-full border border-[#dfe4e8] px-2.5 py-1 text-[11px] font-bold text-[#1b4f9c] hover:bg-[#eef3fb]"
        >
          <KeyRound size={11} className="inline" /> Reset PW
        </button>
        {confirmRemove ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={removeWorker}
              disabled={busy}
              className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? <Loader2 size={11} className="animate-spin" /> : 'Ya, lepas'}
            </button>
            <button type="button" onClick={() => setConfirmRemove(false)} className="rounded-full px-2 py-1 text-[11px] font-bold text-[#657080] hover:bg-[#f1f3f5]">
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="rounded-full border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={11} className="inline" /> Lepas
          </button>
        )}
      </div>

      {editingPhone && (
        <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl bg-[#f8fafc] p-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="No WA" className="w-44 rounded-full border border-[#dfe4e8] bg-white px-3 py-1.5 text-xs font-semibold outline-none placeholder:text-[#9aa3af]" />
          <button type="button" onClick={savePhone} disabled={busy} className="rounded-full bg-[#1b4f9c] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#143d79] disabled:opacity-60">
            {busy ? <Loader2 size={11} className="animate-spin" /> : 'Simpan'}
          </button>
          <button type="button" onClick={() => setEditingPhone(false)} className="rounded-full border border-[#dfe4e8] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#657080] hover:bg-[#f1f3f5]">Batal</button>
        </div>
      )}

      {resetOpen && (
        <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl bg-[#f8fafc] p-2">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password baru (min 6)"
            className="w-44 rounded-full border border-[#dfe4e8] bg-white px-3 py-1.5 text-xs font-semibold outline-none placeholder:text-[#9aa3af]"
          />
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="rounded-full border border-[#dfe4e8] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#657080] hover:bg-[#f1f3f5]"
          >
            Generate
          </button>
          <button
            type="button"
            onClick={resetPassword}
            disabled={busy || password.length < 6}
            className="rounded-full bg-[#1b4f9c] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#143d79] disabled:opacity-60"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : 'Simpan'}
          </button>
        </div>
      )}

      {error && <p className="mt-1 w-full text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  )
}

// Form tambah crew dipisah dari trigger-nya supaya bisa dipakai ulang: di mode
// satu bus jadi tombol dashed penuh, di mode gabungan jadi ikon "+" per baris
// dengan form yang terbuka tepat di bawah baris yang dipilih.
function AddCrewForm({ eventId, bus, onClose }: { eventId: string; bus: BusWithWorkersData; onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bus/${bus.id}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menambah crew.')
      setForm({ name: '', phone: '', username: '', password: '' })
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah crew.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2 rounded-xl bg-[#f8fafc] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-1 text-xs font-bold text-[#1b3555]">
          <Plus size={13} /> Tambah Crew Manual di <span className="text-[#1b4f9c]">{bus.name}</span>
        </p>
        <button
          type="button"
          onClick={() => { onClose(); setError(null) }}
          className="rounded-full p-1 text-[#657080] hover:bg-[#e8eef6]"
          title="Tutup form"
        >
          <X size={13} />
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={form.name}
          onChange={(e) => {
            const name = e.target.value
            setForm((f) => ({ ...f, name, username: f.username || usernameFromName(name) }))
          }}
          required
          placeholder="Nama lengkap crew"
          className={inputCls}
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="No WA (08xx)"
          className={inputCls}
        />
        <input
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          required
          placeholder="Username login"
          className={inputCls}
        />
        <div className="flex gap-1.5">
          <input
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            placeholder="Password"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
            className="shrink-0 rounded-xl border border-[#dfe4e8] bg-white px-3 text-[11px] font-bold text-[#657080] hover:bg-[#f1f3f5]"
          >
            Generate
          </button>
        </div>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !form.name.trim() || !form.username.trim() || form.password.length < 6}
          className="flex items-center gap-1.5 rounded-full bg-[#1b4f9c] px-4 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Simpan Crew
        </button>
      </div>
    </form>
  )
}

function BusCrewPanel({ eventId, bus }: { eventId: string; bus: BusWithWorkersData }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">
        {bus.workers.length} crew bertugas di armada ini
      </p>
      {bus.workers.length === 0 ? (
        <p className="mt-1 text-xs text-[#657080]">Belum ada crew. Tambah manual atau pakai tombol Generate Akun Crew.</p>
      ) : (
        <div className="mt-1">
          {bus.workers.map((w) => (
            <WorkerRow key={w.id} eventId={eventId} busId={bus.id} worker={w} />
          ))}
        </div>
      )}

      {showForm ? (
        <AddCrewForm eventId={eventId} bus={bus} onClose={() => setShowForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#bfcbdc] bg-white py-2.5 text-xs font-bold text-[#657080] transition-colors hover:bg-[#f8fafc]"
        >
          <Plus size={13} /> Tambah Crew Manual
        </button>
      )}
    </div>
  )
}
