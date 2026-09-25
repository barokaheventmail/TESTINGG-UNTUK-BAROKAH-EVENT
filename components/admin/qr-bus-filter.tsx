'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bus, RotateCcw } from 'lucide-react'

export function QrBusFilter({
  eventId,
  buses,
  initial,
}: {
  eventId: string
  buses: { id: string; name: string }[]
  initial: string[]
}) {
  const router = useRouter()
  const allIds = buses.map((b) => b.id)
  const initialAll = initial.length === buses.length && buses.length > 0
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialAll ? allIds : initial))

  function apply(next: Set<string>) {
    setSelected(next)
    if (next.size === buses.length) {
      router.replace(`/admin/events/${eventId}/qr?bus=${allIds.join(',')}`)
    } else if (next.size === 0) {
      router.replace(`/admin/events/${eventId}/qr?bus=none`)
    } else {
      router.replace(`/admin/events/${eventId}/qr?bus=${[...next].join(',')}`)
    }
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    apply(next)
  }

  if (buses.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
      <span className="flex items-center gap-1 text-xs font-bold text-[#657080]">
        <Bus size={13} /> Cetak bus:
      </span>
      <button
        type="button"
        onClick={() => apply(new Set(allIds))}
        className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
          selected.size === buses.length
            ? 'border-[#1b4f9c] bg-[#1b4f9c] text-white'
            : 'border-[#dfe4e8] bg-white text-[#657080] hover:bg-[#f1f3f5]'
        }`}
      >
        Semua ({buses.length})
      </button>
      {buses.map((bus) => (
        <button
          key={bus.id}
          type="button"
          onClick={() => toggle(bus.id)}
          className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
            selected.has(bus.id)
              ? 'border-[#1b4f9c] bg-[#1b4f9c] text-white'
              : 'border-[#dfe4e8] bg-white text-[#657080] hover:bg-[#f1f3f5]'
          }`}
        >
          {bus.name}
        </button>
      ))}
      {selected.size !== buses.length && (
        <button
          type="button"
          onClick={() => apply(new Set(allIds))}
          className="flex items-center gap-1 rounded-full border border-[#dfe4e8] bg-white px-3 py-1 text-xs font-bold text-[#657080] hover:bg-[#f1f3f5]"
        >
          <RotateCcw size={12} /> Reset
        </button>
      )}
      <span className="text-xs font-semibold text-[#9aa3af]">
        {selected.size} dari {buses.length} bus dipilih
      </span>
    </div>
  )
}