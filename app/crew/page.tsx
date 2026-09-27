import type { Metadata } from 'next'
import Link from 'next/link'
import { CircleUserRound, MessageCircle } from 'lucide-react'
import { requireCrewSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CrewPanels } from '@/components/crew/panels'
import { SessionGuard } from '@/components/crew/session-guard'
import { LogoutButton } from '@/components/admin/logout-button'
import { waLink } from '@/lib/wa'
import { isCrewVisibleEvent } from '@/lib/crew-seats'

export const metadata: Metadata = { title: 'Scan QR Peserta – Barokah Tour', robots: { index: false } }

export default async function CrewPage() {
  const session = await requireCrewSession()
  if (!session) redirect('/login?scope=CREW&next=/crew')

  const [user, assigned] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub }, select: { name: true, phone: true } }),
    prisma.busWorker.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: 'asc' },
      include: { bus: { select: { id: true, name: true, eventId: true, event: { select: { title: true, status: true } } } } },
    }),
  ])

  // Event CLOSED tetap ditampilkan (read-only) supaya crew tidak dikira
  // kehilangan akses begitu admin menutup event. DRAFT tetap disembunyikan.
  const visibleAssignments = assigned.filter((a) => isCrewVisibleEvent(a.bus.event.status))
  const closedAssignments = visibleAssignments.filter((a) => a.bus.event.status === 'CLOSED')

  return (
    <main className="min-h-screen bg-[#0f2a52] pb-16">
      <SessionGuard scope="CREW" />
      <header className="border-b border-white/10 px-4 py-5 text-center">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-left text-[11px] font-bold uppercase tracking-widest text-white/50">Barokah Tour and Travel</p>
              <h1 className="mt-1 truncate text-left text-xl font-bold text-white">Scan QR Absensi</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/crew/profil"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-white/20"
            >
              <CircleUserRound size={13} /> Profile <span className="hidden min-[380px]:inline">&amp; Riwayat</span>
            </Link>
            <LogoutButton variant="dark" scope="CREW" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-white/40">Crew</p>
            <p className="truncate text-sm font-black text-white">{user?.name ?? session.username}</p>
          </div>
          {user?.phone && (
            <a
              href={waLink(user.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#25d366]/40 bg-[#25d366]/15 px-3 py-1.5 text-[11px] font-bold text-[#7ceba7] transition-colors duration-200 hover:bg-[#25d366]/25"
            >
              <MessageCircle size={13} /> WA
            </a>
          )}
        </div>
        {visibleAssignments.length > 0 && (
          <p className="mx-auto mt-1 max-w-md text-[11px] text-white/60">
            Ditugaskan di{' '}
            {visibleAssignments.map((a, i) => (
              <span key={a.bus.id}>
                {i > 0 && ' · '}
                <span className="font-bold text-white">
                  {a.bus.event.title} ({a.bus.name})
                </span>
              </span>
            ))}
          </p>
        )}
        {closedAssignments.length > 0 && (
          <p className="mx-auto mt-2 max-w-md rounded-full bg-[#f5b915]/15 px-3 py-1.5 text-[11px] font-semibold text-[#ffd75e]">
            {closedAssignments.length} event sudah selesai — daftar nama &amp; peta kursi hanya bisa dibaca, scan
            dinonaktifkan.
          </p>
        )}
      </header>
      <div className="mx-auto mt-5 w-full max-w-md px-4">
        <CrewPanels username={user?.name ?? session.username} />
      </div>
    </main>
  )
}