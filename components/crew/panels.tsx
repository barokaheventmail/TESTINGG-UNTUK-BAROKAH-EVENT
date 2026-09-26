'use client'

import { useState } from 'react'
import { Armchair, ChevronLeft, ChevronRight, ScanBarcode, Users } from 'lucide-react'
import { CrewScanner } from '@/components/crew/scanner'
import { CrewSeatMap } from '@/components/crew/seat-map'
import { CrewRoster } from '@/components/crew/roster'

const TABS = [
  { id: 'kamera', label: 'Kamera QR', icon: ScanBarcode },
  { id: 'kursi', label: 'Peta Kursi', icon: Armchair },
  { id: 'nama', label: 'Daftar Nama', icon: Users },
] as const

type TabId = (typeof TABS)[number]['id']

export function CrewPanels({ username }: { username: string }) {
  const [tab, setTab] = useState<TabId>('kamera')

  const step = (dir: 1 | -1) => {
    const i = TABS.findIndex((t) => t.id === tab)
    const next = (i + dir + TABS.length) % TABS.length
    setTab(TABS[next].id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Panel sebelumnya"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="grid flex-1 grid-cols-3 overflow-hidden rounded-full bg-white/10">
          {TABS.map((t) => {
            const active = t.id === tab
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-bold transition-colors duration-150 ${
                  active ? 'bg-[#f5b915] text-[#1d2733]' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={13} />
                <span className="hidden min-[360px]:inline">{t.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Panel berikutnya"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {tab === 'kamera' && <CrewScanner username={username} />}
      {tab === 'kursi' && <CrewSeatMap />}
      {tab === 'nama' && <CrewRoster />}
    </div>
  )
}