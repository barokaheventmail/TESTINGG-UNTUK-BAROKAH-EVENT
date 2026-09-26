import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArrowLeft, CircleUserRound, History } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { requireCrewSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SessionGuard } from '@/components/crew/session-guard'
import { LogoutButton } from '@/components/admin/logout-button'
import { CrewProfileEditor } from '@/components/crew/profile-editor'
import { CrewRiwayatList } from '@/components/crew/riwayat-list'

export const metadata: Metadata = { title: 'Profil & Riwayat – Barokah Tour', robots: { index: false } }
export const dynamic = 'force-dynamic'

const PER_PAGE = 50
type SearchParams = Promise<{ tab?: string; page?: string; q?: string }>

export default async function CrewProfilPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireCrewSession()
  if (!session) redirect('/login?scope=CREW&next=/crew/profil')

  const sp = await searchParams
  const tab = sp.tab === 'riwayat' ? 'riwayat' : 'profile'
  const page = Math.max(1, Number(sp.page) || 1)
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) : ''
  const userId = session.sub

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true, phone: true, photoUrl: true },
  })
  if (!user) redirect('/login?scope=CREW&next=/crew/profil')

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const logWhere: Prisma.ScanLogWhereInput = q
    ? { userId, participant: { name: { contains: q, mode: 'insensitive' } } }
    : { userId }

  let logs: import('@/components/crew/riwayat-list').RiwayatLog[] = []
  let total = 0
  let todayCount = 0

  if (tab === 'riwayat') {
    const [l, t, tc] = await Promise.all([
      prisma.scanLog.findMany({
        where: logWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        include: {
          participant: {
            select: {
              name: true,
              order: true,
              seat: true,
              room: true,
              bus: { select: { name: true } },
              event: { select: { title: true } },
            },
          },
        },
      }),
      prisma.scanLog.count({ where: logWhere }),
      prisma.scanLog.count({ where: { userId, createdAt: { gte: startOfToday } } }),
    ])
    logs = l as import('@/components/crew/riwayat-list').RiwayatLog[]
    total = t
    todayCount = tc
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const deel = 'flex-1 rounded-xl px-4 py-2 text-center text-xs font-bold transition-colors duration-200'
  const tabClass = (active: boolean) =>
    active ? `${deel} bg-[#f5b915] text-[#1d2733]` : `${deel} text-white/70 hover:bg-white/10 hover:text-white`

  return (
    <main className="min-h-screen bg-[#0f2a52] pb-16">
      <SessionGuard scope="CREW" />
      <header className="border-b border-white/10 px-4 py-5">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/crew"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Kembali ke scan"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <p className="text-left text-[11px] font-bold uppercase tracking-widest text-white/50">
                Barokah Tour and Travel
              </p>
              <h1 className="mt-0.5 flex items-center gap-1.5 text-left text-lg font-bold text-white">
                <CircleUserRound size={17} /> Profile {tab === 'riwayat' && <>&amp; Riwayat</>}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LogoutButton variant="dark" scope="CREW" />
          </div>
        </div>
        <p className="mx-auto mt-1 max-w-md text-left text-xs text-white/60">Crew: {user.username}</p>
      </header>

      <div className="mx-auto mt-5 w-full max-w-md px-4">
        <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1.5">
          <Link
            href="/crew/profil"
            className={`${tabClass(tab === 'profile')} inline-flex items-center justify-center gap-1`}
          >
            <CircleUserRound size={13} /> Profile
          </Link>
          <Link
            href="/crew/profil?tab=riwayat"
            className={`${tabClass(tab === 'riwayat')} inline-flex items-center justify-center gap-1`}
          >
            <History size={13} /> Riwayat
          </Link>
        </div>

        <div className="mt-5">
          {tab === 'profile' ? (
            <CrewProfileEditor initial={user} />
          ) : (
            <CrewRiwayatList
              basePath="/crew/profil"
              tab="riwayat"
              q={q}
              page={page}
              total={total}
              todayCount={todayCount}
              totalPages={totalPages}
              logs={logs}
            />
          )}
        </div>
      </div>
    </main>
  )
}