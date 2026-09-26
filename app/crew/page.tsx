import type { Metadata } from 'next'
import Link from 'next/link'
import { History } from 'lucide-react'
import { requireCrewSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CrewScanner } from '@/components/crew/scanner'
import { CrewSeatMap } from '@/components/crew/seat-map'
import { SessionGuard } from '@/components/crew/session-guard'
import { LogoutButton } from '@/components/admin/logout-button'

export const metadata: Metadata = { title: 'Scan QR Peserta – Barokah Tour', robots: { index: false } }

export default async function CrewPage() {
  const session = await requireCrewSession()
  if (!session) redirect('/login?scope=CREW&next=/crew')

  const [user, assigned] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub }, select: { name: true } }),
    prisma.busWorker.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: 'asc' },
      include: { bus: { select: { id: true, name: true, eventId: true, event: { select: { title: true, status: true } } } } },
    }),
  ])

  const activeAssignments = assigned.filter((a) => a.bus.event.status === 'ACTIVE')

  return (
    <main className="min-h-screen bg-[#0f2a52] pb-16">
      <SessionGuard scope="CREW" />
      <header className="border-b border-white/10 px-4 py-5 text-center">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-left text-[11px] font-bold uppercase tracking-widest text-white/50">Barokah Tour and Travel</p>
            <h1 className="mt-1 text-left text-xl font-bold text-white">Scan QR Absensi</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/crew/riwayat"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-white/20"
            >
              <History size={13} /> Riwayat
            </Link>
            <LogoutButton variant="dark" scope="CREW" />
          </div>
        </div>
        <p className="mt-1 text-xs text-white/60">Crew: {user?.name ?? session.username}</p>
        {activeAssignments.length > 0 && (
          <p className="mx-auto mt-1 max-w-md text-[11px] text-white/60">
            Ditugaskan di{' '}
            {activeAssignments.map((a, i) => (
              <span key={a.bus.id}>
                {i > 0 && ' · '}
                <span className="font-bold text-white">
                  {a.bus.event.title} ({a.bus.name})
                </span>
              </span>
            ))}
          </p>
        )}
      </header>
      <div className="mx-auto mt-5 w-full max-w-md px-4">
        <CrewScanner username={user?.name ?? session.username} />
        <div className="mt-4">
          <CrewSeatMap />
        </div>
      </div>
    </main>
  )
}