'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BadgeCheck, Loader2, UserX } from 'lucide-react'
import { notifyParticipantsChanged } from '@/lib/events'

export function ToggleAttendance({
  eventId,
  participantId,
  name,
  attended,
}: {
  eventId: string
  participantId: string
  name: string
  attended: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/participants/${participantId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended: !attended }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal mengubah kehadiran.')
      notifyParticipantsChanged()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah kehadiran.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        title={attended ? `Batalkan kehadiran ${name}` : `Tandai ${name} hadir`}
        className={
          attended
            ? 'flex items-center gap-1 rounded-full border border-[#d0e6d6] px-2.5 py-1 text-[11px] font-bold text-[#2ca84a] transition-colors duration-200 hover:border-[#b3d7bd] hover:bg-[#eef7f1] active:scale-95 disabled:opacity-60'
            : 'flex items-center gap-1 rounded-full border border-dashed border-[#d8c9a3] px-2.5 py-1 text-[11px] font-bold text-[#b98a12] transition-colors duration-200 hover:border-[#c9b06b] hover:bg-[#fdf8ea] active:scale-95 disabled:opacity-60'
        }
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : attended ? (
          <UserX size={11} />
        ) : (
          <BadgeCheck size={11} />
        )}
        {attended ? 'Batalkan' : 'Tandai Hadir'}
      </button>
      {error && <span className="sr-only">{error}</span>}
    </span>
  )
}