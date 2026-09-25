import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BadgeCheck, Bus, CalendarDays, MapPin, Users } from 'lucide-react'
import { prisma } from '@/lib/db'
import { formatTanggalPendek } from '@/lib/dates'
import { BackLink } from '@/components/site'
import { TicketSearch } from '@/components/ticket-search'

export const metadata: Metadata = { title: 'Detail Event – Barokah Tour and Travel', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      buses: {
        orderBy: { order: 'asc' },
        include: { participants: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!event || event.status !== 'ACTIVE') notFound()

  const total = event.buses.reduce((acc, b) => acc + b.participants.length, 0)
  const attended = event.buses.reduce(
    (acc, b) => acc + b.participants.filter((p) => p.scannedAt !== null).length,
    0
  )

  return (
    <main className="min-h-screen bg-[#f4f7fa] px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <BackLink href="/" label="Kembali ke beranda" />

        <div className="mt-4 rounded-2xl border border-[#dfe4e8] bg-white p-6 shadow-lg">
            <h2 className="text-sm font-bold text-[#1b3555]">Cari Nama Peserta</h2>
            <p className="mt-0.5 mb-4 text-xs text-[#657080]">
              Ketik nama Anda untuk melihat tiket &amp; QR di event ini.
            </p>
            <TicketSearch eventId={event.id} />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#dfe4e8] bg-white shadow-lg">
          <div className="bg-gradient-to-br from-[#1b4f9c] to-[#163d78] px-6 py-6 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Event Wisata · Barokah Tour &amp; Travel</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{event.title}</h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} /> {formatTanggalPendek(new Date(event.date))}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {event.location}
                </span>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-bold text-[#2ca84a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2ca84a]" /> Aktif
            </div>
          </div>

          <div className="px-6 py-6">
            {event.note && (
              <p className="mb-5 rounded-xl bg-[#f8fafc] p-4 text-sm leading-relaxed text-[#44576d]">{event.note}</p>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#dfe4e8] p-4 text-center">
                <Bus className="mx-auto text-[#1b4f9c]" size={18} />
                <p className="mt-1.5 text-xl font-black text-[#1b3555]">{event.buses.length}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Bus</p>
              </div>
              <div className="rounded-xl border border-[#dfe4e8] p-4 text-center">
                <Users className="mx-auto text-[#1b4f9c]" size={18} />
                <p className="mt-1.5 text-xl font-black text-[#1b3555]">{total}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Peserta</p>
              </div>
              <div className="rounded-xl border border-[#dfe4e8] p-4 text-center">
                <BadgeCheck className="mx-auto text-[#2ca84a]" size={18} />
                <p className="mt-1.5 text-xl font-black text-[#2ca84a]">{attended}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9aa3af]">Hadir</p>
              </div>
            </div>

            {event.buses.length > 0 ? (
              <div className="mt-6 space-y-5">
                {event.buses.map((bus) => (
                  <div key={bus.id} className="overflow-hidden rounded-2xl border border-[#dfe4e8]">
                    <div className="flex items-center justify-between bg-[#eef3fb] px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-bold text-[#1b4f9c]">
                        <Bus size={15} /> {bus.name}
                      </p>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#657080]">
                        {bus.participants.filter((p) => p.scannedAt !== null).length}/{bus.participants.length} hadir
                      </span>
                    </div>
                    <div className="divide-y divide-[#edf0f3]">
                      {bus.participants.map((p) => (
                        <div key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm">
                          <span className="w-8 shrink-0 font-bold text-[#9aa3af]">{p.order}</span>
                          <span className="min-w-0 font-semibold text-[#1b3555]">{p.name}</span>
                          {p.room && <span className="text-xs text-[#657080]">Kamar {p.room}</span>}
                          {p.vw && <span className="text-xs text-[#657080]">VW {p.vw}</span>}
                          <span
                            className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              p.scannedAt !== null ? 'bg-[#e6f4ea] text-[#2ca84a]' : 'bg-[#fff7e0] text-[#b98a12]'
                            }`}
                          >
                            {p.scannedAt !== null ? 'Hadir' : 'Belum hadir'}
                          </span>
                        </div>
                      ))}
                      {bus.participants.length === 0 && (
                        <p className="px-4 py-3 text-xs text-[#657080]">Belum ada peserta di bus ini.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-dashed border-[#dfe4e8] p-6 text-center text-sm text-[#657080]">
                Belum ada bus/peserta untuk event ini.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}