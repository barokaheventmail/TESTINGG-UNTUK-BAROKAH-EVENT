'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

export function EventImage({ eventId, imageUrl }: { eventId: string; imageUrl: string | null }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/admin/events/${eventId}/image`, { method: 'POST', body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Gagal mengunggah gambar.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/image`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menghapus gambar.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus gambar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-[#1b3555]">Gambar Event</h2>
      <p className="mt-0.5 text-xs text-[#657080]">
        Cover yang tampil di halaman publik event dan beranda. JPG / PNG / WebP, maks 5 MB.
      </p>

      {imageUrl && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-[#dfe4e8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Cover event" className="h-44 w-full object-cover" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full bg-[#1b4f9c] px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#16407d] active:scale-95 disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          {imageUrl ? 'Ganti Gambar' : 'Unggah Gambar'}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-[#f0c4c4] bg-white px-4 py-2.5 text-sm font-bold text-[#c0392b] transition-colors duration-200 hover:bg-[#fdecec] active:scale-95 disabled:opacity-60"
          >
            <Trash2 size={14} /> Hapus
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload(file)
          }}
        />
      </div>

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  )
}