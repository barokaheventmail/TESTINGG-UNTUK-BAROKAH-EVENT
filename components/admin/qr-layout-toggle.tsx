'use client'

import { useRouter } from 'next/navigation'
import { Grid2X2, Square } from 'lucide-react'

export type QrLayout = 'grid' | 'single'

const OPTIONS: { value: QrLayout; label: string; icon: typeof Grid2X2; hint: string }[] = [
  { value: 'grid', label: 'Grid', icon: Grid2X2, hint: 'Banyak QR per halaman, untuk cetak massal' },
  { value: 'single', label: '1 per halaman', icon: Square, hint: 'Kertas A5, 2 QR per halaman' },
]

/**
 * Pemilih tata letak cetak QR.
 *
 * State-nya lewat query param, bukan `useState`: `@page { size: A5 }` hanya
 * bisa ditulis di server, jadi markup yang menentukan tata letak cetak harus
 * ikut berubah. Efek sampingnya bagus — URL `?bus=…&layout=single` bisa dikirim
 * ke rekan satu tim dan langsung menghasilkan output yang sama.
 */
export function QrLayoutToggle({
  eventId,
  bus,
  layout,
}: {
  eventId: string
  /** Nilai query `bus` saat ini; diteruskan apa adanya agar filter tidak hilang. */
  bus: string
  layout: QrLayout
}) {
  const router = useRouter()

  function apply(next: QrLayout) {
    if (next === layout) return
    const params = new URLSearchParams()
    if (bus) params.set('bus', bus)
    params.set('layout', next)
    router.replace(`/admin/events/${eventId}/qr?${params.toString()}`, { scroll: false })
  }

  const active = OPTIONS.find((o) => o.value === layout) ?? OPTIONS[0]

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[#657080]">Tata letak:</span>
      <div
        role="radiogroup"
        aria-label="Tata letak cetak QR"
        className="inline-flex items-center gap-1 rounded-full border border-[#dfe4e8] bg-[#f8fafc] p-1"
      >
        {OPTIONS.map((o) => {
          const on = o.value === layout
          const Icon = o.icon
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              title={o.hint}
              onClick={() => apply(o.value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
                on ? 'bg-[#1b4f9c] text-white shadow-sm' : 'text-[#657080] hover:bg-white hover:text-[#1b4f9c]'
              }`}
            >
              <Icon size={13} /> {o.label}
            </button>
          )
        })}
      </div>
      <span className="text-[11px] font-semibold text-[#9aa3af]">{active.hint}</span>
    </div>
  )
}
