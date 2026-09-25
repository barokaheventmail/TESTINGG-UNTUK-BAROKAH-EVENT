import Link from 'next/link'
import type { Metadata } from 'next'
import { Bus, CalendarDays, ChevronRight, ClipboardList, MapPin, QrCode, Users } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatTanggalPendek, formatWaktuLengkap } from '@/lib/dates'
import { formatLogDetail, groupLog, labelLog, type LogDetail } from '@/lib/log-labels'
import { CreateEvent } from '@/components/admin/create-event'

export const metadata: Metadata = { title: 'Panel Admin – Barokah Tour', robots: { index: false } }

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draf', cls: 'bg-[#eff1f4] text-[#657080]' },
  ACTIVE: { label: 'Aktif', cls: 'bg-[#e6f4ea] text-[#2ca84a]' },
  CLOSED: { label: 'Selesai', cls: 'bg-[#eef3fb] text-[#1b4f9c]' },
}

export default async function AdminDashboard() {
  const [events, attendedRows, recentLogs] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: 'desc' },
      include: { _count: { select: { buses: true, participants: true } } },
    }),
    prisma.participant.groupBy({
      by: ['eventId'],
      where: { scannedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { username: true } }, event: { select: { title: true } } },
    }),
  ])
  const attendedMap = new Map(attendedRows.map((r) => [r.eventId, r._count._all]))

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1b3555]">Event</h1>
          <p className="mt-0.5 text-sm text-[#657080]">
            Kelola event, import peserta dari Excel, dan cetak QR absensi.
          </p>
        </div>
        <CreateEvent />
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#bfd3c4] bg-white p-10 text-center">
          <ClipboardList className="mx-auto text-[#9aa3af]" size={36} />
          <p className="mt-3 text-sm font-bold text-[#1b3555]">Belum ada event</p>
          <p className="mt-1 text-xs text-[#657080]">Buat event pertama, lalu upload data peserta dari Excel.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map((event) => {
            const attended = attendedMap.get(event.id) ?? 0
            const status = STATUS_LABEL[event.status] ?? STATUS_LABEL.DRAFT
            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-bold text-[#1b3555]">{event.title}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#657080]">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} /> {formatTanggalPendek(new Date(event.date))}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} /> {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
                    <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
                      <Bus className="mx-auto text-[#1b4f9c]" size={15} />
                      <p className="mt-1 text-base font-black text-[#1b3555]">{event._count.buses}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa3af]">Bus</p>
                    </div>
                    <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
                      <Users className="mx-auto text-[#2ca84a]" size={15} />
                      <p className="mt-1 text-base font-black text-[#1b3555]">{event._count.participants}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa3af]">Peserta</p>
                    </div>
                    <div className="rounded-xl bg-[#fff7e0] px-3 py-2">
                      <QrCode className="mx-auto text-[#b98a12]" size={15} />
                      <p className="mt-1 text-base font-black text-[#1b3555]">{attended}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa3af]">Hadir</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {recentLogs.length > 0 && (
        <div className="mt-8 rounded-2xl border border-[#dfe4e8] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1b3555]">Aktivitas Terbaru</h2>
            <Link href="/admin/logs" className="flex items-center gap-0.5 text-xs font-bold text-[#1b4f9c] hover:text-[#16407d]">
              Lihat semua <ChevronRight size={13} />
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-[#eef1f4]">
            {recentLogs.map((log) => {
              const g = groupLog(log.action)
              return (
                <li key={log.id} className="flex items-center gap-3 py-2.5">
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${g.cls}`}>{g.group}</span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-xs font-bold text-[#1b3555]">{labelLog(log.action)}</p>
                    <p className="truncate text-xs text-[#657080]">
                      {formatLogDetail(log.action, log.detail as unknown as LogDetail)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-[#9aa3af]">
                    <p>{formatWaktuLengkap(new Date(log.createdAt))}</p>
                    <p className="font-semibold text-[#657080]">
                      {log.user?.username ?? '—'}
                      {log.event?.title ? ` · ${log.event.title}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}