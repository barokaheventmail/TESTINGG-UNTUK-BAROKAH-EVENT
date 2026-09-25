'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, KeyRound, Loader2, Pencil, Phone, Plus, Trash2, User as UserIcon, X } from 'lucide-react'
import { BusChip } from './bus-chip'

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

export function BusArmadaSection({ eventId, buses }: { eventId: string; buses: BusWithWorkersData[] }) {
  const [openBusId, setOpenBusId] = useState<string | null>(null)
  const selected = buses.find((b) => b.id === openBusId) ?? null

  return (
    <>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
        {buses.map((bus) => (
          <BusChip
            key={bus.id}
            name={bus.name}
            count={bus.count}
            attended={bus.attended}
            selected={bus.id === openBusId}
            onSelect={() => setOpenBusId((cur) => (cur === bus.id ? null : bus.id))}
          />
        ))}
      </div>
      {selected && (
        <div className="animate-fade-up mt-2 rounded-2xl border border-[#1b4f9c]/30 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#1b3555]">
              Crew Armada <span className="text-[#1b4f9c]">{selected.name}</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#657080]">
                {selected.count} peserta{selected.attended > 0 ? ` · ${selected.attended} hadir` : ''}
              </span>
              <RenameArmada eventId={eventId} bus={selected} />
              <DeleteArmada eventId={eventId} bus={selected} />
              <button
                type="button"
                onClick={() => setOpenBusId(null)}
                className="rounded-full p-1 text-[#657080] hover:bg-[#f1f3f5]"
                title="Tutup"
              >
                <X size={15} />
              </button>
            </div>
          </div>
          <BusCrewPanel eventId={eventId} bus={selected} />
        </div>
      )}
    </>
  )
}

function RenameArmada({ eventId, bus }: { eventId: string; bus: BusWithWorkersData }) {
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
      className="flex items-center gap-1 rounded-full border border-[#dfe4e8] px-2.5 py-1 text-[11px] font-bold text-[#657080] hover:bg-[#f1f3f5]"
    >
      <Pencil size={11} /> Ubah nama
    </button>
  )
}

function DeleteArmada({ eventId, bus }: { eventId: string; bus: BusWithWorkersData }) {
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
      className="flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50"
    >
      <Trash2 size={11} /> Hapus armada
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

function BusCrewPanel({ eventId, bus }: { eventId: string; bus: BusWithWorkersData }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
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
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah crew.')
    } finally {
      setLoading(false)
    }
  }

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
        <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl bg-[#f8fafc] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1 text-xs font-bold text-[#1b3555]">
              <Plus size={13} /> Tambah Crew Manual
            </p>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
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