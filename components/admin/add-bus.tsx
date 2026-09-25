'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

export function AddBus({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menambah bus.')
      setName('')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah bus.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-[#dfe4e8] bg-white px-4 py-2 text-xs font-bold text-[#1b3555] transition-colors duration-200 hover:bg-[#f1f3f5] active:scale-95"
      >
        <Plus size={13} /> Tambah Bus
      </button>
    )
  }

  return (
    <form onSubmit={add} className="flex flex-wrap items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama bus (mis. Bus 3)"
        autoFocus
        className="w-44 rounded-full border border-[#dfe4e8] bg-[#f8fafc] px-4 py-2 text-xs font-semibold text-[#1b3555] outline-none placeholder:text-[#9aa3af] focus:border-[#1b4f9c] focus:bg-white focus:ring-2 focus:ring-[#1b4f9c]/15"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="flex items-center gap-1.5 rounded-full bg-[#1b4f9c] px-4 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95 disabled:opacity-60"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Simpan
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-[#657080] hover:text-[#1b4f9c]">
        Batal
      </button>
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </form>
  )
}