'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { History, Loader2, Trash2, X } from 'lucide-react'
import { LogEntry, type LogEntryItem } from '@/components/admin/log-entry'

export type LogRow = {
  id: string
  action: string
  detail: unknown
  createdAt: string
  username: string | null
  eventTitle: string | null
}

export function LogsTable({
  logs,
  page,
  totalPages,
  /** Query string filter+page saat ini, dipakai untuk mundur satu halaman. */
  baseQuery,
}: {
  logs: LogRow[]
  page: number
  totalPages: number
  baseQuery: string
}) {
  const router = useRouter()
  const [picked, setPicked] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickedSet = useMemo(() => new Set(picked), [picked])
  const allOnPage = logs.length > 0 && logs.every((l) => pickedSet.has(l.id))
  const someOnPage = logs.some((l) => pickedSet.has(l.id))

  function toggle(id: string) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  function toggleAll() {
    setPicked((cur) => (allOnPage ? [] : logs.map((l) => l.id)))
  }

  async function remove() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: picked }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menghapus riwayat.')

      const gone = picked.length
      setConfirming(false)
      setPicked([])

      // Kalau seluruh baris halaman ini ikut terhapus dan ini bukan halaman
      // pertama, mundur satu halaman supaya tidak mendarat di halaman kosong.
      if (gone >= logs.length && page > 1) {
        const sp = new URLSearchParams(baseQuery)
        sp.set('page', String(page - 1))
        router.replace(`/admin/logs?${sp.toString()}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus riwayat.')
    } finally {
      setLoading(false)
    }
  }

  if (logs.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-[#bfd3c4] bg-white p-10 text-center">
        <History className="mx-auto text-[#9aa3af]" size={36} />
        <p className="mt-3 text-sm font-bold text-[#1b3555]">Tidak ada riwayat</p>
        <p className="mt-1 text-xs text-[#657080]">Belum ada aktivitas yang tercatat untuk filter ini.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-bold text-[#657080]">
          <input
            type="checkbox"
            checked={allOnPage}
            ref={(el) => {
              if (el) el.indeterminate = !allOnPage && someOnPage
            }}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer accent-[#1b4f9c]"
          />
          Pilih semua di halaman ini
        </label>

        {picked.length > 0 && (
          <>
            <span className="text-xs font-bold tabular-nums text-[#1b4f9c]">
              {picked.length.toLocaleString('id-ID')} dipilih
            </span>
            <button
              type="button"
              onClick={() => setPicked([])}
              className="flex items-center gap-1 rounded-full border border-[#dfe4e8] px-3 py-1.5 text-xs font-bold text-[#657080] transition-colors duration-200 hover:bg-[#f1f3f5]"
            >
              <X size={12} /> Batal pilih
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-red-700 active:scale-95"
            >
              <Trash2 size={13} /> Hapus {picked.length.toLocaleString('id-ID')} entri
            </button>
          </>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white">
        <ul className="divide-y divide-[#eef1f4]">
          {logs.map((log) => (
            <LogEntry
              key={log.id}
              selectable
              selected={pickedSet.has(log.id)}
              onToggle={() => toggle(log.id)}
              log={
                {
                  id: log.id,
                  action: log.action,
                  detail: log.detail,
                  createdAt: new Date(log.createdAt),
                  user: log.username ? { username: log.username } : null,
                  event: log.eventTitle ? { title: log.eventTitle } : null,
                } satisfies LogEntryItem
              }
            />
          ))}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="font-semibold text-[#657080]">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/logs${pageQuery(baseQuery, page - 1)}`}
                className="rounded-xl border border-[#dfe4e8] bg-white px-4 py-2 text-sm font-bold text-[#1b3555] hover:bg-[#f1f3f5]"
              >
                ‹ Sebelumnya
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/logs${pageQuery(baseQuery, page + 1)}`}
                className="rounded-xl border border-[#dfe4e8] bg-white px-4 py-2 text-sm font-bold text-[#1b3555] hover:bg-[#f1f3f5]"
              >
                Berikutnya ›
              </a>
            )}
          </div>
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => !loading && setConfirming(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="hapus-riwayat-judul"
            className="animate-fade-up w-full max-w-sm rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-xl"
          >
            <h3 id="hapus-riwayat-judul" className="text-sm font-bold text-[#1b3555]">
              Hapus {picked.length.toLocaleString('id-ID')} entri riwayat?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#657080]">
              Riwayat yang dipilih akan dihapus permanen dan tidak bisa dikembalikan. Tindakan ini sendiri
              tetap tercatat di riwayat.
            </p>
            {error && (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="rounded-full border border-[#dfe4e8] px-4 py-2 text-xs font-bold text-[#657080] hover:bg-[#f1f3f5] disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-red-700 active:scale-95 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}{' '}
                Ya, hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function pageQuery(baseQuery: string, page: number): string {
  const sp = new URLSearchParams(baseQuery)
  sp.set('page', String(page))
  const s = sp.toString()
  return s ? `?${s}` : ''
}
