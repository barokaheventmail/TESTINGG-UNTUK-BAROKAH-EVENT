'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react'
import { notifyParticipantsChanged } from '@/lib/events'

type Result = {
  created: number
  updated: number
  skipped: number
  buses: { name: string; created: number; updated: number; skipped: number }[]
}

export function ImportExcel({ eventId }: { eventId: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  async function upload() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/events/${eventId}/import`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import gagal.')
      setResult(data)
      notifyParticipantsChanged()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-[#bfd3c4] bg-[#f4fbf6] p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-[#1b3555]">
        <FileSpreadsheet size={16} className="text-[#2ca84a]" /> Import Peserta dari Excel
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-relaxed text-[#657080]">
        <p className="min-w-0">
          Setiap <strong>sheet</strong> dalam file = <strong>1 bus</strong> (nama sheet jadi nama bus). Kolom: No, Nama
          Lengkap, Tempat Lahir, Tanggal Lahir, No Telp/Hp, No Kursi, No Kamar, No VW. Import ulang tidak akan
          menggandakan data (berdasarkan No &amp; bus).
        </p>
        <a
          href="/api/admin/template"
          className="inline-flex shrink-0 items-center gap-1 font-bold text-[#1b4f9c] hover:underline"
        >
          <Download size={13} /> Unduh template Excel
        </a>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setResult(null)
            setError(null)
          }}
          className="block w-full text-xs text-[#657080] file:mr-3 file:rounded-full file:border-0 file:bg-[#e6f4ea] file:px-4 file:py-2 file:text-xs file:font-bold file:text-[#2ca84a] hover:file:bg-[#d3ebda]"
        />
        <button
          type="button"
          onClick={upload}
          disabled={!file || loading}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#2ca84a] px-5 py-2.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#219b42] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {loading ? 'Mengimpor…' : 'Import'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">{error}</p>}

      {result && (
        <div className="animate-fade-up mt-3 space-y-2 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2ca84a]">
            <CheckCircle2 size={16} /> Import berhasil
          </div>
          <p className="text-xs text-[#657080]">
            {result.buses.length} bus · {result.created} peserta baru · {result.updated} diperbarui ·{' '}
            {result.skipped} baris dilewati
          </p>
          <ul className="space-y-1 text-xs text-[#657080]">
            {result.buses.map((b) => (
              <li key={b.name}>
                <strong className="text-[#1b4f9c]">{b.name}</strong> — {b.created} baru · {b.updated} diperbarui
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}