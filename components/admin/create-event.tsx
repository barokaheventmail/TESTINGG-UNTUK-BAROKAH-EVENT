'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { EventForm } from './event-form'

export function CreateEvent() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-[#1b4f9c] px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-95"
      >
        <Plus size={15} /> Buat Event Baru
      </button>
    )
  }

  return (
    <div className="animate-fade-up rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1b3555]">Buat Event Baru</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-bold text-[#657080] hover:text-[#1b4f9c]"
        >
          Tutup
        </button>
      </div>
      <EventForm onDone={() => setOpen(false)} />
    </div>
  )
}