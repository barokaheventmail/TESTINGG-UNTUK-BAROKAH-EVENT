'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'

export function LogoutButton({
  variant = 'light',
  scope = 'ADMIN',
}: {
  variant?: 'light' | 'dark'
  scope?: 'ADMIN' | 'CREW'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope }),
    })
    router.replace(`/login?scope=${scope}&next=${scope === 'ADMIN' ? '/admin' : '/crew'}&switch=1`)
    router.refresh()
  }

  // Keluar itu destruktif, jadi merah disimpan untuk hover saja. Diam-diamnya
  // netral supaya header admin tidak ramai, tapi tetap jelas saat dituju.
  const cls =
    variant === 'dark'
      ? 'group flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-[#f9dc8c]/45 hover:bg-white/[0.12] hover:text-white active:scale-[0.97] disabled:opacity-60'
      : 'group flex items-center gap-1.5 rounded-full border border-[#e4e8ec] bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#657080] transition-all duration-200 hover:border-[#f0c5c2] hover:bg-[#fdf4f3] hover:text-[#b03a2e] active:scale-[0.97] disabled:opacity-60'

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      aria-busy={loading}
      title="Keluar dari sesi ini"
      className={cls}
    >
      {loading ? (
        <Loader2
          size={13}
          className={`animate-spin ${variant === 'dark' ? 'text-[#f9dc8c]' : 'text-[#c0392b]'}`}
        />
      ) : (
        <LogOut
          size={13}
          className={`transition-transform duration-200 group-hover:translate-x-0.5 ${
            variant === 'dark'
              ? 'text-[#f9dc8c]'
              : 'text-[#9aa3af] group-hover:text-[#c0392b]'
          }`}
        />
      )}
      {/* Label sengaja tidak berubah saat loading supaya tombol tidak bergeser. */}
      Keluar
    </button>
  )
}
