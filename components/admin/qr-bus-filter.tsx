'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bus } from 'lucide-react'

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
  const [value, setValue] = useState<string>(
    initial.length === buses.length && buses.length > 0 ? 'all' : initial[0] ?? 'all',
  )

  function apply(next: string) {
    setValue(next)
    if (next === 'all' || buses.length === 0) {
      router.replace(`/admin/events/${eventId}/qr?bus=${allIds.join(',')}`)
    } else {
      router.replace(`/admin/events/${eventId}/qr?bus=${next}`)
    }
  }

  if (buses.length === 0) return null

  return (
    <label className="mt-3 flex w-fit items-center gap-2 rounded-full border border-[#dfe4e8] bg-[#f8fafc] px-3 py-2 print:hidden">
      <Bus size={14} className="shrink-0 text-[#9aa3af]" />
      <span className="whitespace-nowrap text-xs font-bold text-[#657080]">Cetak bus:</span>
      <select
        value={value}
        onChange={(e) => apply(e.target.value)}
        aria-label="Pilih bus untuk dicetak"
        className="max-w-[220px] bg-transparent text-xs font-bold text-[#1b3555] outline-none"
      >
        <option value="all">Semua ({buses.length})</option>
        {buses.map((bus) => (
          <option key={bus.id} value={bus.id}>
            {bus.name}
          </option>
        ))}
      </select>
    </label>
  )
}