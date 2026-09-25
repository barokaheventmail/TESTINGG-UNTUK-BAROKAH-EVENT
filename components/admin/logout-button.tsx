'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

export function LogoutButton({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  const cls =
    variant === 'dark'
      ? 'flex items-center gap-1.5 rounded-full border border-white/40 px-3 py-1.5 text-xs font-bold text-white transition-colors duration-200 hover:bg-white/10 active:scale-95 disabled:opacity-60'
      : 'flex items-center gap-1.5 rounded-full border border-[#dfe4e8] bg-white px-3 py-1.5 text-xs font-bold text-[#1b3555] transition-colors duration-200 hover:bg-[#f1f3f5] active:scale-95 disabled:opacity-60'

  return (
    <button type="button" onClick={logout} disabled={loading} className={cls}>
      <LogOut size={13} /> {loading ? '…' : 'Keluar'}
    </button>
  )
}