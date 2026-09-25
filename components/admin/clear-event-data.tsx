'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { notifyParticipantsChanged } from '@/lib/events'

export function ClearEventData({
  eventId,
  busesCount,
  participantsCount,
}: {
  eventId: string
  busesCount: number
  participantsCount: number
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const noData = busesCount === 0 && participantsCount === 0

  async function clear() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/clear`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menghapus data.')
      setConfirming(false)
      setDone(true)
      notifyParticipantsChanged()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/60 p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-red-700">
        <AlertTriangle size={16} /> Area Berbahaya
      </div>
      <p className="mt-1 text-xs leading-relaxed text-red-600/90">
        Hapus <strong>semua bus (armada) &amp; peserta</strong> di event ini beserta riwayat scan-nya. <strong>Event itu
        sendiri tetap ada</strong> — data bisa di-import ulang. Tindakan ini tidak bisa dibatalkan.
      </p>

      {done ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#e6f4ea] px-4 py-2.5 text-xs font-bold text-[#2ca84a]">
          <CheckCircle2 size={15} /> Data bus &amp; peserta event ini telah dihapus.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!confirming && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={noData || loading}
              className="flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={13} /> Hapus Data Bus &amp; Peserta
            </button>
          )}
          {noData && !confirming && (
            <span className="text-xs font-semibold text-[#9aa3af]">
              {busesCount} bus · {participantsCount} peserta — tidak ada data untuk dihapus.
            </span>
          )}
          {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
          {confirming && (
            <>
              <span className="text-xs font-semibold text-red-700">
                Hapus permanen {busesCount} bus &amp; {participantsCount} peserta dari event ini? Event tetap ada, tidak
                bisa dibatalkan.
              </span>
              <button
                type="button"
                onClick={clear}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-red-700 active:scale-95 disabled:opacity-60"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Ya, hapus data
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false)
                  setError(null)
                }}
                className="rounded-full border border-[#dfe4e8] bg-white px-4 py-2 text-xs font-bold text-[#657080] hover:bg-[#f1f3f5]"
              >
                Batal
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}