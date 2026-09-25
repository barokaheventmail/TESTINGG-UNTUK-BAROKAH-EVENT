import Link from 'next/link'
import type { Metadata } from 'next'
import { History } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatWaktuLengkap } from '@/lib/dates'
import { formatLogDetail, groupLog, labelLog, LOG_ACTIONS, type LogDetail } from '@/lib/log-labels'

export const metadata: Metadata = { title: 'Riwayat – Panel Admin', robots: { index: false } }
export const dynamic = 'force-dynamic'

const PER_PAGE = 50
type SearchParams = Promise<{ page?: string; action?: string; eventId?: string; userId?: string }>

export default async function AdminLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const action = typeof sp.action === 'string' && sp.action !== 'semua' ? sp.action : null
  const eventId = typeof sp.eventId === 'string' && sp.eventId !== 'semua' ? sp.eventId : null
  const userId = typeof sp.userId === 'string' && sp.userId !== 'semua' ? sp.userId : null

  const where: Record<string, unknown> = {
    ...(action ? { action } : {}),
    ...(eventId ? { eventId } : {}),
    ...(userId ? { userId } : {}),
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

  const qs = (patch: Record<string, string>): string => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ action: action ?? '', eventId: eventId ?? '', userId: userId ?? '', page: String(page) })) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1b3555]">Riwayat Aktivitas</h1>
          <p className="mt-0.5 text-sm text-[#657080]">
            Catatan semua aksi admin dan scan crew ({total.toLocaleString('id-ID')} entri).
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
            {LOG_ACTIONS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.actions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </optgroup>
            ))}
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
        <button
          type="submit"
          className="rounded-xl bg-[#1b4f9c] px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#16407d]"
        >
          Terapkan
        </button>
        {(action || eventId || userId) && (
          <Link
            href="/admin/logs"
            className="rounded-xl border border-[#dfe4e8] bg-white px-4 py-2.5 text-sm font-bold text-[#657080] hover:bg-[#f1f3f5]"
          >
            Reset
          </Link>
        )}
      </form>

      {logs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#bfd3c4] bg-white p-10 text-center">
          <History className="mx-auto text-[#9aa3af]" size={36} />
          <p className="mt-3 text-sm font-bold text-[#1b3555]">Tidak ada riwayat</p>
          <p className="mt-1 text-xs text-[#657080]">Belum ada aktivitas yang tercatat untuk filter ini.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white">
          <ul className="divide-y divide-[#eef1f4]">
            {logs.map((log) => {
              const g = groupLog(log.action)
              const meta = data[log.eventId ?? '']
              const uname = data[log.userId ?? '']?.username
              return (
                <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${g.cls}`}>{g.group}</span>
                      <span className="text-sm font-bold text-[#1b3555]">{labelLog(log.action)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#657080]">
                      {formatLogDetail(log.action, log.detail as unknown as LogDetail)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <p className="font-semibold text-[#657080]">{formatWaktuLengkap(new Date(log.createdAt))}</p>
                    <p className="mt-0.5 text-[#9aa3af]">
                      {meta?.title ?? '—'}
                      {uname ? ` · ${uname}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="font-semibold text-[#657080]">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/logs${qs({ page: String(page - 1) })}`}
                className="rounded-xl border border-[#dfe4e8] bg-white px-4 py-2 text-sm font-bold text-[#1b3555] hover:bg-[#f1f3f5]"
              >
                ‹ Sebelumnya
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/logs${qs({ page: String(page + 1) })}`}
                className="rounded-xl border border-[#dfe4e8] bg-white px-4 py-2 text-sm font-bold text-[#1b3555] hover:bg-[#f1f3f5]"
              >
                Berikutnya ›
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}