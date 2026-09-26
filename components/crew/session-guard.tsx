'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

const HEARTBEAT_MS = 15_000

export function SessionGuard({ scope = 'CREW' }: { scope?: 'ADMIN' | 'CREW' }) {
  const router = useRouter()
  const kickingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let inflight = false

    const kick = async () => {
      if (kickingRef.current || cancelled) return
      kickingRef.current = true
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope }),
        })
      } catch {
        // lanjut redirect walau request logout gagal
      }
      if (!cancelled) router.replace(`/login?scope=${scope}&switch=1`)
    }

    const check = async () => {
      if (kickingRef.current || cancelled || inflight) return
      inflight = true
      try {
        const res = await fetch(`/api/auth/me?scope=${scope}`, { cache: 'no-store' })
        if (!res.ok) {
          await kick()
          return
        }
        const data = (await res.json().catch(() => null)) as { user?: unknown } | null
        if (!data?.user) {
          await kick()
        }
      } catch {
        // jaringan bermasalah → biarkan tick berikutnya
      } finally {
        inflight = false
      }
    }

    check()
    const timer = setInterval(check, HEARTBEAT_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, router])

  return null
}