import Link from 'next/link'
import { redirect } from 'next/navigation'
import { History, QrCode } from 'lucide-react'
import { AutoRefresh } from '@/components/admin/auto-refresh'
import { LogoutButton } from '@/components/admin/logout-button'
import { Logo } from '@/components/site'
import { requireAdminSession } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession()
  if (!session) redirect('/login?scope=ADMIN&next=/admin')
  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <AutoRefresh />
      <header className="sticky top-0 z-30 border-b border-[#dfe4e8] bg-white/90 print:hidden backdrop-blur">
        <div className="container-wide flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo className="h-8 w-auto" />
            <p className="truncate text-sm font-bold text-[#1b3555]">Panel Admin</p>
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