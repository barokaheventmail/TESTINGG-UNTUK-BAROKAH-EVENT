'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { notifyParticipantsChanged } from '@/lib/events'

export function DeleteParticipant({ eventId, participant }: { eventId: string; participant: { id: string; name: string } }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/participants/${participant.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menghapus peserta.')
      setConfirming(false)
      notifyParticipantsChanged()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus peserta.')
    } finally {
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Hapus peserta"
        className="rounded-full p-2 text-[#657080] transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={14} />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setConfirming(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-sm rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-xl"
      >
        <h3 className="text-sm font-bold text-[#1b3555]">Hapus peserta?</h3>
        <p className="mt-1 text-xs text-[#657080]">
          <span className="font-bold text-[#1b3555]">{participant.name}</span> akan dihapus beserta riwayat scan-nya. Nomor urut di bus
          otomatis dirapikan.
        </p>
        {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-full border border-[#dfe4e8] px-4 py-2 text-xs font-bold text-[#657080] hover:bg-[#f1f3f5]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-red-700 active:scale-95 disabled:opacity-60"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Ya, hapus
          </button>
        </div>
      </div>
    </div>
  )
}