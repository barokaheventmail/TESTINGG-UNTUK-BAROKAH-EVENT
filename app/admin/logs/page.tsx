import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { LOG_ACTIONS, HIDDEN_LOG_ACTIONS } from '@/lib/log-labels'
import { LogsTable } from '@/components/admin/logs-table'

export const metadata: Metadata = { title: 'Riwayat – Panel Admin', robots: { index: false } }
export const dynamic = 'force-dynamic'

const PER_PAGE = 50
type SearchParams = Promise<{ page?: string; action?: string; eventId?: string; userId?: string; from?: string; to?: string }>

export default async function AdminLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const action = typeof sp.action === 'string' && sp.action !== 'semua' ? sp.action : null
  const eventId = typeof sp.eventId === 'string' && sp.eventId !== 'semua' ? sp.eventId : null
  const userId = typeof sp.userId === 'string' && sp.userId !== 'semua' ? sp.userId : null

  const fromRaw = typeof sp.from === 'string' ? sp.from : ''
  const toRaw = typeof sp.to === 'string' ? sp.to : ''
  const from = fromRaw ? new Date(`${fromRaw}T00:00:00`) : null
  const to = toRaw ? new Date(`${toRaw}T23:59:59.999`) : null
  const fromValid = from && !isNaN(from.getTime()) ? from : null
  const toValid = to && !isNaN(to.getTime()) ? to : null

  const where: Record<string, unknown> = {
    // Entri tersembunyi tetap ada di database, cuma tidak bisa dilihat/dipilih.
    // `in` dan `notIn` harus dalam satu objek: kalau `action` ditulis terpisah
    // lewat spread, filter `notIn` ketimpa dan `?action=log.delete` bisa
    // membocorkan entri yang sengaja disembunyikan.
    action: action ? { in: [action], notIn: HIDDEN_LOG_ACTIONS } : { notIn: HIDDEN_LOG_ACTIONS },
    ...(eventId ? { eventId } : {}),
    ...(userId ? { userId } : {}),
    ...(fromValid || toValid ? { createdAt: { ...(fromValid ? { gte: fromValid } : {}), ...(toValid ? { lte: toValid } : {}) } } : {}),
  }

  const [logs, total, users, events] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.activityLog.count({ where }),
    prisma.user.findMany({ select: { id: true, username: true, role: true }, orderBy: { username: 'asc' } }),
    prisma.event.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const data: Record<string, { username?: string; title?: string }> = {}
  for (const u of users) data[u.id] = { username: u.username }
  for (const e of events) data[e.id] = { ...data[e.id], title: e.title }

  // Halaman ini biasanya dibuka dari tombol "Lihat riwayat lengkap" di tab
  // Riwayat sebuah event, jadi kembalinya harus ke sana — bukan ke daftar
  // event. Kalau tidak difilter per event (atau event-nya sudah dihapus),
  // jatuh ke daftar event. Gaya link-nya sengaja sama dengan link "Kembali ke
  // daftar event" di halaman detail event.
  const backEvent = eventId ? events.find((e) => e.id === eventId) ?? null : null
  const backHref = backEvent ? `/admin/events/${backEvent.id}?tab=riwayat` : '/admin'
  const backLabel = backEvent ? 'Kembali ke Riwayat Event' : 'Kembali ke daftar event'

  const qs = (patch: Record<string, string>): string => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({
      action: action ?? '',
      eventId: eventId ?? '',
      userId: userId ?? '',
      from: fromRaw,
      to: toRaw,
      page: String(page),
    })) {
      if (v && v !== 'semua') p.set(k, v)
    }
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v)
    }
    const s = p.toString()
    return s ? `?${s}` : ''
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs font-bold text-[#657080] hover:text-[#1b4f9c]"
      >
        <ArrowLeft size={13} /> {backLabel}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1b3555]">Riwayat Aktivitas</h1>
          <p className="mt-0.5 text-sm text-[#657080]">
            {backEvent ? (
              <>
                Catatan aksi untuk event <span className="font-bold text-[#1b3555]">{backEvent.title}</span> ({total.toLocaleString('id-ID')} entri).
              </>
            ) : (
              <>Catatan semua aksi admin dan scan crew ({total.toLocaleString('id-ID')} entri).</>
            )}
          </p>
        </div>
      </div>

      <form className="mt-5 flex flex-wrap items-end gap-2 print:hidden" method="get">
        <label className="text-xs">
          <span className="mb-1 block font-bold text-[#657080]">Aksi</span>
          <select
            name="action"
            defaultValue={action ?? 'semua'}
            className="rounded-xl border border-[#dfe4e8] bg-white px-3 py-2 text-sm font-semibold text-[#1b3555]"
          >
            <option value="semua">Semua aksi</option>
            {LOG_ACTIONS.map((g) => {
              // Grup yang seluruhnya tersembunyi tidak perlu tampil sama sekali.
              const actions = g.actions.filter((a) => !HIDDEN_LOG_ACTIONS.includes(a.value))
              if (actions.length === 0) return null
              return (
                <optgroup key={g.group} label={g.group}>
                  {actions.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-bold text-[#657080]">Event</span>
          <select
            name="eventId"
            defaultValue={eventId ?? 'semua'}
            className="rounded-xl border border-[#dfe4e8] bg-white px-3 py-2 text-sm font-semibold text-[#1b3555]"
          >
            <option value="semua">Semua event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-bold text-[#657080]">User</span>
          <select
            name="userId"
            defaultValue={userId ?? 'semua'}
            className="rounded-xl border border-[#dfe4e8] bg-white px-3 py-2 text-sm font-semibold text-[#1b3555]"
          >
            <option value="semua">Semua user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-bold text-[#657080]">Dari tanggal</span>
          <input
            type="date"
            name="from"
            defaultValue={fromRaw}
            className="rounded-xl border border-[#dfe4e8] bg-white px-3 py-2 text-sm font-semibold text-[#1b3555]"
          />
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-bold text-[#657080]">Sampai tanggal</span>
          <input
            type="date"
            name="to"
            defaultValue={toRaw}
            className="rounded-xl border border-[#dfe4e8] bg-white px-3 py-2 text-sm font-semibold text-[#1b3555]"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[#1b4f9c] px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#16407d]"
        >
          Terapkan
        </button>
        {(action || eventId || userId || fromRaw || toRaw) && (
          <Link
            href="/admin/logs"
            className="rounded-xl border border-[#dfe4e8] bg-white px-4 py-2.5 text-sm font-bold text-[#657080] hover:bg-[#f1f3f5]"
          >
            Reset
          </Link>
        )}
      </form>

      <LogsTable
        logs={logs.map((log) => ({
          id: log.id,
          action: log.action,
          detail: log.detail,
          createdAt: log.createdAt.toISOString(),
          username: data[log.userId ?? '']?.username ?? null,
          eventTitle: data[log.eventId ?? '']?.title ?? null,
        }))}
        page={page}
        totalPages={totalPages}
        baseQuery={qs({})}
      />
    </div>
  )
}