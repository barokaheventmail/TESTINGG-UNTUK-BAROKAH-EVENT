import Link from 'next/link'
import { History, LayoutDashboard, QrCode } from 'lucide-react'
import { LogoutButton } from '@/components/admin/logout-button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <header className="sticky top-0 z-30 border-b border-[#dfe4e8] bg-white/90 print:hidden backdrop-blur">
        <div className="container-wide flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1b4f9c] text-white">
              <LayoutDashboard size={15} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#1b3555]">Panel Admin</p>
              <Link href="/" className="text-[11px] font-semibold text-[#657080] hover:text-[#1b4f9c]">
                Barokah Tour and Travel
              </Link>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/admin/logs"
              className="flex items-center gap-1.5 rounded-full border border-[#dfe4e8] bg-white px-3 py-1.5 text-xs font-bold text-[#1b3555] transition-colors duration-200 hover:bg-[#f1f3f5]"
            >
              <History size={13} /> Riwayat
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full border border-[#dfe4e8] bg-white px-3 py-1.5 text-xs font-bold text-[#1b3555] transition-colors duration-200 hover:bg-[#f1f3f5]"
            >
              <QrCode size={13} /> Event
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="container-wide px-4 py-6 pb-16">{children}</main>
    </div>
  )
}