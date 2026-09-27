'use client'

import { Printer } from 'lucide-react'

export function PrintButton({ label = 'Cetak / Simpan PDF' }: { label?: string } = {}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-full bg-[#f5b915] px-5 py-2.5 text-sm font-bold text-[#1d2733] transition-colors duration-200 hover:bg-[#e4aa09] active:scale-95 print:hidden"
    >
      <Printer size={15} /> {label}
    </button>
  )
}
