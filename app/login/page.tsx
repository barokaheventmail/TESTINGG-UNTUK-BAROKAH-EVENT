'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, LogIn, LogOut, ShieldCheck } from 'lucide-react'

function resolveDest(next: string | null, role: string): string {
  const target = role === 'ADMIN' ? '/admin' : '/crew'
  if (!next || !next.startsWith('/') || next.startsWith('//')) return target
  const isAdminPath = next.startsWith('/admin')
  const allowed = role === 'ADMIN' || !isAdminPath
  return allowed ? next : target
}

function isAllowedNext(next: string | null, role: string): boolean {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return false
  return role === 'ADMIN' || !next.startsWith('/admin')
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [next, setNext] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [sessionInfo, setSessionInfo] = useState<{ role: string; target: string } | null>(null)

  const redirectAfterLogin = useCallback(
    (role: string) => {
      router.replace(resolveDest(next, role))
      router.refresh()
    },
    [next, router]
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNext(params.get('next'))
    fetch('/api/auth/me')
      .then(async (r) => {
        if (!r.ok) return
        const { user } = await r.json()
        const role: string = user?.role ?? 'CREW'
        const requested = params.get('next')
        if (requested && !isAllowedNext(requested, role)) {
          setSessionInfo({ role, target: requested })
          return
        }
        redirectAfterLogin(role)
      })
      .finally(() => setChecking(false))
  }, [redirectAfterLogin])

  async function logout() {
    setLoading(true)
    setError(null)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setSessionInfo(null)
    } finally {
      setLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Gagal masuk.')
        return
      }
      redirectAfterLogin(data.role ?? 'CREW')
    } catch {
      setError('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fa] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="guide-pattern rounded-2xl border border-[#dfe4e8] bg-white p-7 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b4f9c] text-white">
              <ShieldCheck size={28} />
            </div>
            <h1 className="mt-4 text-xl font-bold text-[#1b3555]">Panel Barokah Tour</h1>
            <p className="mt-1 text-sm text-[#657080]">Masuk untuk Admin & Crew</p>
          </div>

          {sessionInfo && (
            <div className="mt-5 rounded-xl border border-[#ffe3a3] bg-[#fff7e0] p-4 text-xs">
              <p className="flex items-center gap-2 font-bold text-[#b98a12]">
                <AlertTriangle size={15} className="shrink-0" />
                Anda sudah masuk sebagai <span className="uppercase">{sessionInfo.role}</span>
              </p>
              <p className="mt-1 leading-relaxed text-[#8a6d1f]">
                Akun ini tidak punya akses ke <strong>{sessionInfo.target}</strong>. Keluar dulu atau masuk dengan akun
                yang sesuai.
              </p>
              <button
                type="button"
                onClick={logout}
                disabled={loading}
                className="mt-2.5 flex items-center gap-1.5 rounded-full bg-[#b98a12] px-4 py-2 font-bold text-white transition-colors duration-200 hover:bg-[#a07910] active:scale-95 disabled:opacity-60"
              >
                <LogOut size={13} /> {loading ? '…' : 'Keluar & ganti akun'}
              </button>
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#657080]" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                disabled={checking}
                placeholder="admin / crew"
                className="mt-1.5 w-full rounded-xl border border-[#dfe4e8] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#1b3555] outline-none transition-colors placeholder:text-[#9aa3af] focus:border-[#1b4f9c] focus:bg-white focus:ring-2 focus:ring-[#1b4f9c]/15"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#657080]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={checking}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-[#dfe4e8] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#1b3555] outline-none transition-colors placeholder:text-[#9aa3af] focus:border-[#1b4f9c] focus:bg-white focus:ring-2 focus:ring-[#1b4f9c]/15"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || checking}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1b4f9c] py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#143d79] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <a href="/" className="mt-5 block text-center text-xs font-semibold text-[#657080] hover:text-[#1b4f9c]">
            ← Kembali ke beranda
          </a>
        </div>
      </div>
    </main>
  )
}