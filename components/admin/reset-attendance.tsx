'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { notifyParticipantsChanged } from '@/lib/events'

export function ResetAttendance({ eventId, attendedCount }: { eventId: string; attendedCount: number }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reset() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/reset-attendance`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Gagal mereset kehadiran.')
      setConfirming(false)
      notifyParticipantsChanged()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mereset kehadiran.')
    } finally {
      setLoading(false)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={attendedCount === 0}
        className="flex items-center gap-1.5 rounded-full border border-[#dfe4e8] bg-white px-4 py-2.5 text-sm font-bold text-[#1b3555] transition-colors duration-200 hover:bg-[#f1f3f5] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw size={14} /> Reset Kehadiran
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-[#1b3555]">
        Reset semua kehadiran{attendedCount > 0 && <> ({attendedCount} sudah hadir)</>}? Riwayat scan dihapus, data peserta tetap.
      </span>
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
      <button
        type="button"
        onClick={reset}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full bg-[#b98a12] px-3 py-1.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#9a740f] active:scale-95 disabled:opacity-60"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Ya, reset
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false)
          setError(null)
        }}
        className="rounded-full border border-[#dfe4e8] px-3 py-1.5 text-xs font-bold text-[#657080] hover:bg-[#f1f3f5]"
      >
        Batal
      </button>
    </div>
  )
}