'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Copy, Loader2, UserPlus, X } from 'lucide-react'
import { useModal } from '@/components/admin/use-modal'

export type GenerateBus = { id: string; name: string; workerCount: number }

type CreatedRow = { busName: string; username: string; password: string }

const inputCls =
  'w-full rounded-xl border border-[#dfe4e8] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#1b3555] outline-none placeholder:text-[#9aa3af] focus:border-[#1b4f9c] focus:bg-white focus:ring-2 focus:ring-[#1b4f9c]/15'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12) || 'armada'
}

export function GenerateCrewButton({
  eventId,
  eventTitle,
  defaultPrefix,
  buses,
  mode = 'button',
  open: controlledOpen,
  onOpenChange,
}: {
  eventId: string
  eventTitle: string
  defaultPrefix: string | null
  buses: GenerateBus[]
  // 'button' = pemicunya ikut dirender. 'modal' = hanya layarnya, pemicunya
  // dibuat oleh ActionMenu supaya seragam dengan aksi lain di menu.
  mode?: 'button' | 'modal'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const router = useRouter()
  const [open, setOpen] = useModal(controlledOpen, onOpenChange)
  const [prefix, setPrefix] = useState(defaultPrefix ?? slugify(eventTitle))
  const [perBus, setPerBus] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedRow[] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const totalNew = buses.reduce((acc, b) => acc + Math.max(0, perBus - b.workerCount), 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/workers/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, perBus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal generate akun.')
      setCreated(data.created)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal generate akun.')
    } finally {
      setLoading(false)
    }
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    } catch {
      // ignore
    }
  }

  function resetAndClose() {
    setOpen(false)
    setCreated(null)
    setError(null)
  }

  return (
    <>
      {mode === 'button' && (
        <button
          type="button"
          onClick={() => {
            if (defaultPrefix) setPrefix(defaultPrefix)
            setCreated(null)
            setError(null)
            setOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-full bg-[#1b4f9c] px-4 py-2.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95"
        >
          <UserPlus size={13} /> Generate Akun Crew
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-fade-up flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1b3555]">Generate Akun Crew</h3>
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-full p-1 text-[#657080] hover:bg-[#f1f3f5]"
              >
                <X size={15} />
              </button>
            </div>

            {!created ? (
              <form onSubmit={submit} className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[#9aa3af]">Kode event</label>
                  <p className="mb-1 text-[11px] text-[#9aa3af]">
                    Username jadi <span className="font-bold text-[#1b4f9c]">{prefix || 'kode'}1</span>,{' '}
                    <span className="font-bold text-[#1b4f9c]">{prefix || 'kode'}2</span>, … berurutan.
                  </p>
                  <input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                    placeholder="mis. dufan"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-[#9aa3af]">
                    Akun per armada
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={perBus}
                    onChange={(e) => setPerBus(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                    className={inputCls}
                  />
                </div>
                <p className="rounded-xl bg-[#eef3fb] px-3 py-2 text-xs font-semibold text-[#1b4f9c]">
                  {buses.length} armada × {perBus} = <span className="font-black">{totalNew}</span> akun baru
                  {buses.some((b) => b.workerCount > 0) && (
                    <span className="block text-[11px] font-semibold text-[#657080]">
                      Armada yang sudah lengkap tidak digenerate ulang.
                    </span>
                  )}
                </p>
                {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="rounded-full border border-[#dfe4e8] px-4 py-2 text-xs font-bold text-[#657080] hover:bg-[#f1f3f5]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || totalNew === 0 || !prefix.trim()}
                    className="flex items-center gap-1.5 rounded-full bg-[#1b4f9c] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#143d79] active:scale-95 disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Generate
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4">
                {created.length === 0 ? (
                  <p className="rounded-xl bg-[#eef3fb] px-3 py-2 text-xs font-semibold text-[#1b4f9c]">
                    Semua armada sudah lengkap. Tidak ada akun baru. (Armada lain tetap bisa dapat akun lewat panel per
                    armada.)
                  </p>
                ) : (
                  <>
                    <p className="mb-2 rounded-xl bg-[#fff7e0] px-3 py-2 text-[11px] font-semibold text-[#b98a12]">
                      Password hanya tampil sekali ini. Segera bagikan ke crew masing-masing. Salin tabel di bawah lalu
                      kirim ke hak armada.
                    </p>
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-[#dfe4e8]">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wide text-[#9aa3af]">
                          <tr>
                            <th className="px-3 py-2">Armada</th>
                            <th className="px-3 py-2">Username</th>
                            <th className="px-3 py-2">Password</th>
                            <th className="px-3 py-2 text-right">Salin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef0f3]">
                          {created.map((r, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 font-semibold text-[#1b3555]">{r.busName}</td>
                              <td className="px-3 py-2 font-mono text-[#1b4f9c]">@{r.username}</td>
                              <td className="px-3 py-2 font-mono text-[#1b3555]">{r.password}</td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => copy(`${r.username} / ${r.password}`, `row-${i}`)}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#dfe4e8] px-2 py-1 text-[11px] font-bold text-[#657080] hover:bg-[#f1f3f5]"
                                >
                                  {copied === `row-${i}` ? <Check size={11} /> : <Copy size={11} />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copy(
                            created.map((r) => `${r.busName}\t${r.username}\t${r.password}`).join('\n'),
                            'all',
                          )
                        }
                        className="flex items-center gap-1.5 rounded-full bg-[#f5b915] px-4 py-2 text-xs font-bold text-[#1d2733] hover:bg-[#e4aa09]"
                      >
                        {copied === 'all' ? <Check size={13} /> : <Copy size={13} />} Salin Semua
                      </button>
                      <button
                        type="button"
                        onClick={resetAndClose}
                        className="rounded-full bg-[#1b4f9c] px-4 py-2 text-xs font-bold text-white hover:bg-[#143d79]"
                      >
                        Selesai
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}