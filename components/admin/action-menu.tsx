'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type ActionMenuItem = {
  key: string
  label: string
  hint?: string
  icon: React.ReactNode
  tone?: 'default' | 'danger'
  disabled?: boolean
  disabledTitle?: string
  dividerBefore?: boolean
  onSelect: () => void
}

export function ActionMenu({
  label = 'Aksi',
  items,
  align = 'right',
}: {
  label?: string
  items: ActionMenuItem[]
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full bg-[linear-gradient(100deg,#071e3d_0%,#163d78_100%)] py-2.5 pl-4 pr-3.5 text-xs font-bold text-white shadow-[0_12px_28px_-12px_rgba(9,32,74,0.95)] transition-shadow duration-300 hover:shadow-[0_16px_34px_-12px_rgba(9,32,74,1)]"
      >
        {label}
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-out ${
            open ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown size={13} />
        </span>
      </button>

      {/*
        Sengaja tanpa `transform` maupun `filter` (termasuk backdrop-blur).
        Panel ini jadi ancestor dari modal `fixed inset-0`, dan transform akan
        menjadikannya blok penampung posisi -- overlay modal ikut terukur
        seukuran panel. Animasi karena itu hanya opacity + visibility + shadow.
      */}
      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute z-40 mt-2 w-72 rounded-2xl border border-[#ece3cd] bg-white p-1.5 transition-[opacity,visibility,box-shadow] duration-200 ease-out ${
          align === 'right' ? 'right-0' : 'left-0'
        } ${
          open
            ? 'visible opacity-100 shadow-[0_28px_70px_-22px_rgba(9,32,74,0.6)]'
            : 'pointer-events-none invisible opacity-0 shadow-[0_12px_28px_-20px_rgba(9,32,74,0.4)]'
        }`}
      >
        <div className="mx-2.5 mb-1.5 mt-0.5 h-px bg-gradient-to-r from-transparent via-[#e8d9ab] to-transparent" />

        {items.map((item) => {
          const danger = item.tone === 'danger'
          return (
            <div key={item.key}>
              {item.dividerBefore && <div className="my-1.5 h-px bg-[#f1f3f5]" />}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                title={item.disabled ? item.disabledTitle : undefined}
                onClick={item.onSelect}
                className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
                  danger ? 'hover:bg-[#fdf0f0]' : 'hover:bg-[#fbf7ec]'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                    danger
                      ? 'bg-[#fdf0f0] text-[#c03a3a] group-hover:bg-[#f8dcdc]'
                      : 'bg-[#eef3fb] text-[#163d78] group-hover:bg-[#f5e7bd] group-hover:text-[#b8860b]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[13px] font-bold ${danger ? 'text-[#c03a3a]' : 'text-[#1b3555]'}`}
                  >
                    {item.label}
                  </span>
                  {item.hint && (
                    <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#8a93a3]">
                      {item.hint}
                    </span>
                  )}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
