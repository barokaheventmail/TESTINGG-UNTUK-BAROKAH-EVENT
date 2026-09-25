'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'

export function BusChip({
  eventId,
  bus,
  count,
}: {
  eventId: string
  bus: { id: string; name: string }
  count: number
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(bus.name)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function rename() {
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
      if (!res.ok) throw new Error(data.error ?? 'Gagal mengubah nama bus.')
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah nama bus.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bus/${bus.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menghapus bus.')
      setConfirming(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus bus.')
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-[#1b4f9c]/40 bg-[#eef3fb] px-2 py-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && rename()}
          autoFocus
          className="w-24 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#1b3555] outline-none focus:ring-2 focus:ring-[#1b4f9c]/30"
        />
        <button type="button" onClick={rename} disabled={busy || !name.trim()} className="rounded-full p-1 text-[#1b4f9c] hover:bg-white disabled:opacity-50">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button type="button" onClick={() => { setEditing(false); setName(bus.name) }} className="rounded-full p-1 text-[#657080] hover:bg-white">
          <X size={12} />
        </button>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 py-1 pr-2 pl-3">
        <span className="text-xs font-bold text-[#1b3555]">
          Hapus <span className="text-red-600">{bus.name}</span>?{count > 0 && <span> {count} peserta ikut terhapus.</span>}
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={11} className="animate-spin" /> : 'Ya'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded-full px-2 py-1 text-xs font-bold text-[#657080] hover:bg-white">
          Batal
        </button>
      </div>
    )
  }

  return (
    <span className="flex items-center gap-1 rounded-full bg-[#eef3fb] py-1 pr-1 pl-3">
      <span className="text-xs font-bold text-[#1b4f9c]">
        {bus.name} · {count} peserta
      </span>
      <button
        type="button"
        onClick={() => { setName(bus.name); setEditing(true) }}
        title="Ubah nama bus"
        className="rounded-full p-1 text-[#9aa3af] hover:bg-white hover:text-[#1b4f9c]"
      >
        <Pencil size={12} />
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Hapus bus"
        className="rounded-full p-1 text-[#9aa3af] hover:bg-white hover:text-red-600"
      >
        <Trash2 size={12} />
      </button>
    </span>
  )
}