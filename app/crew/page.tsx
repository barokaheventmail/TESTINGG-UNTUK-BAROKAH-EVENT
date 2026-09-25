import type { Metadata } from 'next'
import Link from 'next/link'
import { History } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CrewScanner } from '@/components/crew/scanner'
import { LogoutButton } from '@/components/admin/logout-button'

export const metadata: Metadata = { title: 'Scan QR Peserta – Barokah Tour', robots: { index: false } }

export default async function CrewPage() {
  const session = await requireUser()
  if (!session) redirect('/login?next=/crew')

  return (
    <main className="min-h-screen bg-[#0f2a52] pb-16">
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
            <LogoutButton variant="dark" />
          </div>
        </div>
        <p className="mt-1 text-xs text-white/60">Crew: {session.username}</p>
      </header>
      <div className="mx-auto mt-5 w-full max-w-md px-4">
        <CrewScanner username={session.username} />
      </div>
    </main>
  )
}