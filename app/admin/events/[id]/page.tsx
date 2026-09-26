import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Bus, CalendarDays, Download, History, MapPin, Printer, ShieldAlert } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatWaktuLengkap } from '@/lib/dates'
import { EditEvent } from '@/components/admin/edit-event'
import { DeleteEvent } from '@/components/admin/delete-event'
import { ImportExcel } from '@/components/admin/import-excel'
import { ParticipantTable, type RowBus } from '@/components/admin/participant-table'
import { AddParticipant } from '@/components/admin/add-participant'
import { ArmadaActions } from '@/components/admin/armada-actions'
import { BusArmadaSection, type BusWithWorkersData } from '@/components/admin/bus-crew'
import { EventImage } from '@/components/admin/event-image'
import type { GenerateBus } from '@/components/admin/generate-crew'
import { ResetAttendance } from '@/components/admin/reset-attendance'
import { LogEntry } from '@/components/admin/log-entry'
import { TabBar, isEventTab, type EventTabId } from '@/components/admin/tab-bar'

const MANAGEMENT_ACTIONS: string[] = ['scan.attended', 'scan.duplicate']

export const metadata: Metadata = { title: 'Detail Event – Panel Admin', robots: { index: false } }

export const dynamic = 'force-dynamic'

export default async function EventDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const active: EventTabId = isEventTab(tab) ? tab : 'ringkasan'

  const [event, totalByBus, attendedByBus, eventLogs, eventLogCount] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        buses: {
          orderBy: { order: 'asc' },
          include: { workers: { orderBy: { order: 'asc' }, include: { user: { select: { id: true, username: true, name: true, phone: true } } } } },
        },
      },
    }),
    prisma.participant.groupBy({ by: ['busId'], where: { eventId: id }, _count: { _all: true } }),
    prisma.participant.groupBy({
      by: ['busId'],
      where: { eventId: id, scannedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.activityLog.findMany({
      where: { eventId: id, action: { notIn: MANAGEMENT_ACTIONS } },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: { user: { select: { username: true } } },
    }),
    prisma.activityLog.count({ where: { eventId: id, action: { notIn: MANAGEMENT_ACTIONS } } }),
  ])

  if (!event) notFound()

  const totalMap = new Map(totalByBus.map((r) => [r.busId, r._count._all]))
  const attendedMap = new Map(attendedByBus.map((r) => [r.busId, r._count._all]))

  const buses: RowBus[] = event.buses.map((b) => ({
    id: b.id,
    name: b.name,
    order: b.order,
    count: totalMap.get(b.id) ?? 0,
    attended: attendedMap.get(b.id) ?? 0,
  }))

  const busesWithWorkers: BusWithWorkersData[] = event.buses.map((b) => ({
    id: b.id,
    name: b.name,
    order: b.order,
    count: totalMap.get(b.id) ?? 0,
    attended: attendedMap.get(b.id) ?? 0,
    workers: b.workers.map((w) => ({
      id: w.id,
      order: w.order,
      user: { id: w.user.id, username: w.user.username, name: w.user.name, phone: w.user.phone },
    })),
  }))

  const generateBuses: GenerateBus[] = event.buses.map((b) => ({
    id: b.id,
    name: b.name,
    workerCount: b.workers.length,
  }))

  const uniqueCrewCount = new Set(event.buses.flatMap((b) => b.workers.map((w) => w.user.id))).size

  const totalParticipants = buses.reduce((acc, b) => acc + b.count, 0)
  const totalAttended = buses.reduce((acc, b) => acc + b.attended, 0)

  const stats = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {buses.length > 0 && (
        <div className="rounded-2xl border border-[#dfe4e8] bg-white p-4 shadow-sm">
          <Bus className="text-[#1b4f9c]" size={18} />
          <p className="mt-2 text-2xl font-black text-[#1b3555]">{buses.length}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Bus / Armada</p>
        </div>
      )}
      <div className="rounded-2xl border border-[#dfe4e8] bg-white p-4 shadow-sm">
        <p className="text-2xl font-black text-[#1b3555]">{totalParticipants}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Total Peserta</p>
      </div>
      <div className="rounded-2xl border border-[#dfe4e8] bg-white p-4 shadow-sm">
        <p className="text-2xl font-black text-[#2ca84a]">{totalAttended}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Sudah Hadir</p>
      </div>
      <div className="rounded-2xl border border-[#dfe4e8] bg-white p-4 shadow-sm">
        <p className="text-2xl font-black text-[#b98a12]">{totalParticipants - totalAttended}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Belum Hadir</p>
      </div>
    </div>
  )

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <ImportExcel eventId={event.id} />
      <a
        href={`/api/admin/events/${event.id}/export`}
        download
        className="flex items-center gap-1.5 rounded-full border border-[#dfe4e8] bg-white px-4 py-2.5 text-sm font-bold text-[#1b3555] transition-colors duration-200 hover:bg-[#f1f3f5] active:scale-95"
      >
        <Download size={15} /> Export CSV
      </a>
      <Link
        href={`/admin/events/${event.id}/qr`}
        className="flex items-center gap-1.5 rounded-full bg-[#f5b915] px-5 py-2.5 text-sm font-bold text-[#1d2733] transition-colors duration-200 hover:bg-[#e4aa09] active:scale-95"
      >
        <Printer size={15} /> Cetak QR Peserta
      </Link>
    </div>
  )

  const riwayatList = eventLogs.map((log) => (
    <LogEntry
      key={log.id}
      showEvent={false}
      log={{
        id: log.id,
        action: log.action,
        detail: log.detail,
        createdAt: log.createdAt,
        user: log.user,
        event: null,
      }}
    />
  ))

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-[#657080] hover:text-[#1b4f9c]">
        <ArrowLeft size={13} /> Kembali ke daftar event
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[#1b3555]">{event.title}</h1>
            <span className="flex items-center gap-2">
              <EditEvent
                event={{
                  id: event.id,
                  title: event.title,
                  date: event.date.toISOString(),
                  location: event.location,
                  status: event.status,
                  note: event.note ?? '',
                }}
              />
              <DeleteEvent eventId={event.id} />
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#657080]">
            <span className="flex items-center gap-1">
              <CalendarDays size={13} /> {formatWaktuLengkap(new Date(event.date))}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <TabBar eventId={event.id} active={active} />

      {active === 'ringkasan' && (
        <div className="mt-5 space-y-4">
          {stats}

          <EventImage eventId={event.id} imageUrl={event.imageUrl} />

          <div className="rounded-2xl border border-[#dfe4e8] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1b3555]">Aksi Cepat</h2>
            <p className="mt-0.5 text-xs text-[#657080]">
              Import peserta dari Excel, cetak QR untuk scan crew, atau unduh data.
            </p>
            <div className="mt-3">{actionButtons}</div>
          </div>

          <div className="rounded-2xl border border-[#f0c4c4] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#c03a3a]">
              <ShieldAlert size={15} /> Pengaturan
            </h2>
            <p className="mt-0.5 text-xs text-[#657080]">Aksi berisiko: hapus catatan kehadiran semua peserta.</p>
            <div className="mt-3">
              <ResetAttendance eventId={event.id} attendedCount={totalAttended} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#dfe4e8] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#1b3555]">
                  <History size={15} /> Aktivitas Terbaru
                </h2>
                <p className="mt-0.5 text-xs text-[#657080]">Aksi kelola terakhir di event ini.</p>
              </div>
              <Link
                href={`/admin/events/${event.id}?tab=riwayat`}
                className="shrink-0 text-xs font-bold text-[#1b4f9c] hover:text-[#16407d]"
              >
                Lihat semua →
              </Link>
            </div>
            {riwayatList.length === 0 ? (
              <p className="mt-4 text-xs text-[#9aa3af]">Belum ada aktivitas kelola untuk event ini.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[#eef1f4]">
                {riwayatList.slice(0, 6)}
              </ul>
            )}
          </div>
        </div>
      )}

      {active === 'peserta' && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1b3555]">Peserta</h2>
              <p className="text-xs text-[#657080]">
                {totalParticipants} peserta · cari, filter, dan kelola per peserta.
              </p>
            </div>
            <AddParticipant eventId={event.id} buses={buses} />
          </div>
          <ParticipantTable
            eventId={event.id}
            buses={buses}
            totalParticipants={totalParticipants}
            totalAttended={totalAttended}
          />
        </div>
      )}

      {active === 'armada' && (
        <div className="mt-5 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <ArmadaActions
              eventId={event.id}
              eventTitle={event.title}
              defaultPrefix={event.crewPrefix}
              buses={generateBuses}
              totalCrew={uniqueCrewCount}
              totalAccounts={generateBuses.reduce((sum, b) => sum + b.workerCount, 0)}
              hasBuses={event.buses.length > 0}
            />
            <div>
              <h2 className="text-sm font-bold text-[#1b3555]">Bus & Armada</h2>
              <p className="text-xs text-[#657080]">
                Klik armada untuk kelola crew dan namanya. Akun crew dibuat dari Generate Akun Crew.
              </p>
            </div>
          </div>
          {event.buses.length > 0 ? (
            <BusArmadaSection eventId={event.id} buses={busesWithWorkers} />
          ) : (
            <p className="rounded-xl bg-[#f8fafc] px-4 py-6 text-center text-xs font-semibold text-[#9aa3af]">
              Belum ada bus/armada. Tambah manual lewat tombol di atas, atau impor dari Excel.
            </p>
          )}
        </div>
      )}

      {active === 'riwayat' && (
        <div className="mt-5 rounded-2xl border border-[#dfe4e8] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#1b3555]">
                <History size={15} /> Riwayat Event
              </h2>
              <p className="mt-0.5 text-xs text-[#657080]">
                Aksi kelola event ini (import, bus, peserta, crew, reset). Scan crew tercatat di riwayat crew.
              </p>
            </div>
            <Link
              href={`/admin/logs?eventId=${event.id}`}
              className="shrink-0 text-xs font-bold text-[#1b4f9c] hover:text-[#16407d]"
            >
              Lihat riwayat lengkap →
            </Link>
          </div>

          {eventLogs.length === 0 ? (
            <p className="mt-4 text-xs text-[#9aa3af]">Belum ada aktivitas kelola untuk event ini.</p>
          ) : (
            <>
              <ul className="mt-3 max-h-[420px] divide-y divide-[#eef1f4] overflow-y-auto">
                {riwayatList}
              </ul>
              {eventLogCount > eventLogs.length && (
                <p className="mt-3 text-xs font-semibold text-[#657080]">
                  …dan {eventLogCount - eventLogs.length} entri lainnya.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}