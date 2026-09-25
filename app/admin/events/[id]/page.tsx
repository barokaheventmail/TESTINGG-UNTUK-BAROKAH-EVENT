import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Bus, CalendarDays, MapPin, Printer } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatTanggalPendek } from '@/lib/dates'
import { EditEvent } from '@/components/admin/edit-event'
import { DeleteEvent } from '@/components/admin/delete-event'
import { ImportExcel } from '@/components/admin/import-excel'
import { ParticipantTable, type RowBus, type RowParticipant } from '@/components/admin/participant-table'
import { AddBus } from '@/components/admin/add-bus'
import { AddParticipant } from '@/components/admin/add-participant'
import { BusChip } from '@/components/admin/bus-chip'
import { ResetAttendance } from '@/components/admin/reset-attendance'

export const metadata: Metadata = { title: 'Detail Event – Panel Admin', robots: { index: false } }

export const dynamic = 'force-dynamic'

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      buses: { orderBy: { order: 'asc' } },
      participants: {
        orderBy: [{ busId: 'asc' }, { order: 'asc' }],
        include: { scannedBy: { select: { username: true } } },
      },
    },
  })

  if (!event) notFound()

  const buses: RowBus[] = event.buses.map((b) => ({ id: b.id, name: b.name, order: b.order }))
  const participants: RowParticipant[] = event.participants.map((p) => ({
    id: p.id,
    busId: p.busId,
    order: p.order,
    name: p.name,
    birthPlace: p.birthPlace,
    birthDate: p.birthDate ? p.birthDate.toISOString() : null,
    phone: p.phone,
    seat: p.seat,
    room: p.room,
    vw: p.vw,
    scannedAt: p.scannedAt ? p.scannedAt.toISOString() : null,
    scannedBy: p.scannedBy,
  }))

  const perBus = buses.map((bus) => {
    const items = participants.filter((p) => p.busId === bus.id)
    return { ...bus, total: items.length, attended: items.filter((p) => p.scannedAt).length }
  })

  const totalAttended = participants.filter((p) => p.scannedAt).length

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
              <CalendarDays size={13} /> {formatTanggalPendek(new Date(event.date))}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {event.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ResetAttendance eventId={event.id} attendedCount={totalAttended} />
          <Link
            href={`/admin/events/${event.id}/qr`}
            className="flex items-center gap-1.5 rounded-full bg-[#f5b915] px-5 py-2.5 text-sm font-bold text-[#1d2733] transition-colors duration-200 hover:bg-[#e4aa09] active:scale-95"
          >
            <Printer size={15} /> Cetak QR Peserta
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {perBus.length > 0 && (
          <div className="rounded-2xl border border-[#dfe4e8] bg-white p-4 shadow-sm">
            <Bus className="text-[#1b4f9c]" size={18} />
            <p className="mt-2 text-2xl font-black text-[#1b3555]">{perBus.length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Bus / Armada</p>
          </div>
        )}
        <div className="rounded-2xl border border-[#dfe4e8] bg-white p-4 shadow-sm">
          <p className="text-2xl font-black text-[#1b3555]">{participants.length}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Total Peserta</p>
        </div>
        <div className="rounded-2xl border border-[#dfe4e8] bg-white p-4 shadow-sm">
          <p className="text-2xl font-black text-[#2ca84a]">{totalAttended}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Sudah Hadir</p>
        </div>
        <div className="rounded-2xl border border-[#dfe4e8] bg-white p-4 shadow-sm">
          <p className="text-2xl font-black text-[#b98a12]">{participants.length - totalAttended}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Belum Hadir</p>
        </div>
      </div>

      {perBus.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {perBus.map((bus) => (
            <div key={bus.id} className="flex items-center gap-2 rounded-full border border-[#dfe4e8] bg-white pl-3 pr-1 py-1">
              <span className="text-xs font-bold text-[#1b4f9c]">{bus.name}</span>
              <span className="rounded-full bg-[#f8fafc] px-2 py-0.5 text-[11px] font-semibold text-[#657080]">
                {bus.attended}/{bus.total} hadir
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <ImportExcel eventId={event.id} />
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#1b3555]">Bus / Armada</h2>
            <p className="text-xs text-[#657080]">Bus otomatis dibuat dari sheet di file Excel. Bisa juga ditambah manual.</p>
          </div>
          <div className="flex items-center gap-2">
            <AddParticipant eventId={event.id} buses={buses} />
            <AddBus eventId={event.id} />
          </div>
        </div>
        {event.buses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {perBus.map((bus) => (
              <BusChip key={bus.id} eventId={event.id} bus={bus} count={bus.total} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <ParticipantTable eventId={event.id} buses={buses} participants={participants} />
      </div>
    </div>
  )
}