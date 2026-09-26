'use client'

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'

type Initial = {
  username: string
  name: string | null
  phone: string | null
  photoUrl: string | null
}

type Status = { type: 'ok' | 'err'; text: string } | null

export function CrewProfileEditor({ initial }: { initial: Initial }) {
  const [name, setName] = useState(initial.name ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [avatar, setAvatar] = useState(initial.photoUrl)
  const [busy, setBusy] = useState<'save' | 'photo' | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const initialChar = (initial.name?.trim()[0] ?? initial.username?.[0] ?? 'C').toUpperCase()

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy('save')
    setStatus(null)
    try {
      const res = await fetch('/api/crew/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setStatus({ type: 'err', text: data?.error ?? 'Gagal menyimpan profil.' })
        return
      }
      setStatus({ type: 'ok', text: 'Profil berhasil disimpan.' })
      if (data?.user) {
        setAvatar(data.user.photoUrl ?? avatar)
      }
    } catch {
      setStatus({ type: 'err', text: 'Gagal menyimpan profil.' })
    } finally {
      setBusy(null)
    }
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy('photo')
    setStatus(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/crew/profile', { method: 'POST', body: fd })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setStatus({ type: 'err', text: data?.error ?? 'Gagal mengunggah foto.' })
        return
      }
      setAvatar(data?.photoUrl ?? data?.url ?? avatar)
      setStatus({ type: 'ok', text: 'Foto profil berhasil diperbarui.' })
    } catch {
      setStatus({ type: 'err', text: 'Gagal mengunggah foto.' })
    } finally {
      setBusy(null)
    }
  }

  async function removePhoto() {
    setBusy('photo')
    setStatus(null)
    try {
      const res = await fetch('/api/crew/profile', { method: 'DELETE' })
      if (!res.ok) {
        setStatus({ type: 'err', text: 'Gagal menghapus foto.' })
        return
      }
      setAvatar(null)
      setStatus({ type: 'ok', text: 'Foto profil dihapus.' })
    } catch {
      setStatus({ type: 'err', text: 'Gagal menghapus foto.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-2xl">
      <div className="flex flex-col items-center">
        <div className="relative">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt="Foto profil"
              className="h-24 w-24 rounded-full border-4 border-white ring-1 ring-[#dfe4e8] object-cover shadow-lg"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1b4f9c,#0d2850)] text-3xl font-black text-white ring-1 ring-white/60 shadow-lg">
              {initialChar}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy === 'photo'}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#f5b915] text-[#1d2733] shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
            aria-label="Ubah foto profil"
          >
            {busy === 'photo' ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} className="hidden" />
        </div>

        <p className="mt-3 text-sm font-bold text-[#1b3555]">{initial.name || 'Crew'}</p>
        <p className="text-xs text-[#657080]">@{initial.username}</p>

        {avatar && (
          <button
            type="button"
            onClick={removePhoto}
            disabled={busy === 'photo'}
            className="mt-2 flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 size={12} /> Hapus Foto
          </button>
        )}
      </div>

      <form onSubmit={save} className="mt-5 space-y-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#9aa3af]" htmlFor="crew-name">
            Nama
          </label>
          <input
            id="crew-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap kamu"
            className="mt-1 w-full rounded-xl border border-[#dfe4e8] bg-[#f8fafc] px-3.5 py-2.5 text-sm font-semibold text-[#1b3555] outline-none transition-colors focus:border-[#1b4f9c]"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#9aa3af]" htmlFor="crew-wa">
            Nomor WhatsApp
          </label>
          <input
            id="crew-wa"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="08xxxxxxxxxx"
            className="mt-1 w-full rounded-xl border border-[#dfe4e8] bg-[#f8fafc] px-3.5 py-2.5 text-sm font-semibold text-[#1b3555] outline-none transition-colors focus:border-[#1b4f9c]"
          />
          <p className="mt-1 text-[11px] text-[#9aa3af]">
            Nomor ini dipakai publik untuk menghubungi kamu lewat WhatsApp.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy !== null}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1b4f9c] py-3 text-sm font-bold text-white transition-colors hover:bg-[#143d79] active:scale-[0.98] disabled:opacity-60"
        >
          {busy === 'save' ? <Loader2 size={16} className="animate-spin" /> : null} Simpan Profil
        </button>
      </form>

      {status && (
        <p
          className={`mt-4 rounded-xl px-4 py-2.5 text-center text-xs font-bold ${
            status.type === 'ok' ? 'bg-[#e6f4ea] text-[#2ca84a]' : 'bg-[#fdecec] text-[#c0392b]'
          }`}
        >
          {status.text}
        </p>
      )}
    </div>
  )
}