import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { qrDataUrl, encodeToken } from '@/lib/scan'
import { formatTanggalPendek } from '@/lib/dates'
import { PrintButton } from '@/components/admin/print-button'
import { QrBusFilter } from '@/components/admin/qr-bus-filter'

export const metadata: Metadata = { title: 'Cetak QR Peserta – Panel Admin', robots: { index: false } }

export const dynamic = 'force-dynamic'

export default async function EventQR({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ bus?: string }>
}) {
  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      buses: { orderBy: { order: 'asc' } },
      participants: {
        orderBy: [{ busId: 'asc' }, { order: 'asc' }],
        include: { bus: { select: { id: true, name: true } } },
      },
    },
  })

  if (!event) notFound()

  const sp = await searchParams
  const rawBus = (sp.bus ?? '').trim()
  let selectedIds: string[] | null = null
  if (rawBus === 'none') selectedIds = []
  else if (rawBus) selectedIds = rawBus.split(',').filter(Boolean)

  const hasSelection = selectedIds !== null && selectedIds.length > 0

  const grouped = event.buses
    .map((bus) => ({
      bus,
      participants: event.participants
        .filter((p) => p.busId === bus.id)
        .sort((a, b) => a.order - b.order),
    }))
    .filter((g) => g.participants.length > 0)
    .filter((g) => !hasSelection || selectedIds!.includes(g.bus.id))

  type Section = { bus: (typeof event.buses)[number]; cards: { p: (typeof event.participants)[number]; qr: string }[] }
  let sections: Section[] = []
  if (hasSelection) {
    sections = await Promise.all(
      grouped.map(async (group) => {
        const cards = await Promise.all(
          group.participants.map(async (p) => {
            const qr = await qrDataUrl(encodeToken(p.token), 256)
            return { p, qr }
          }),
        )
        return { bus: group.bus, cards }
      }),
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/events/${event.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#657080] hover:text-[#1b4f9c]"
        >
          <ArrowLeft size={13} /> Kembali ke detail
        </Link>
        <PrintButton />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 print:mt-0">
        <h1 className="text-xl font-bold text-[#1b3555]">{event.title}</h1>
        <span className="text-sm text-[#657080]">{formatTanggalPendek(new Date(event.date))}</span>
      </div>

      <QrBusFilter
        eventId={event.id}
        buses={event.buses.map((b) => ({ id: b.id, name: b.name }))}
        initial={selectedIds ?? []}
      />

      {selectedIds === null ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#bfd3c4] bg-white p-10 text-center">
          <p className="text-sm font-bold text-[#1b3555]">Pilih bus untuk mencetak QR</p>
          <p className="mt-1 text-xs text-[#657080]">
            Klik satu atau lebih nama bus di atas, lalu tekan Cetak. Ini mencegah halaman memuat ribuan QR sekaligus dan
            menjaga browser tetap ringan.
          </p>
        </div>
      ) : selectedIds.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#bfd3c4] bg-white p-10 text-center">
          <p className="text-sm font-bold text-[#1b3555]">Tidak ada bus yang dipilih</p>
          <p className="mt-1 text-xs text-[#657080]">Pilih minimal satu bus untuk dicetak.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map(({ bus, cards }) => (
            <div key={bus.id}>
              <h2 className="mb-3 border-b-2 border-[#1b4f9c] pb-1 text-left text-base font-black uppercase text-[#1b4f9c]">
                {bus.name} · {cards.length} peserta
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {cards.map(({ p, qr }) => (
                  <div key={p.id} className="break-inside-avoid rounded-lg border border-[#dfe4e8] p-2 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr} alt={`QR ${p.name}`} className="mx-auto aspect-square w-full max-w-[132px]" />
                    <p className="mt-1.5 truncate text-[11px] font-bold text-[#1b3555]">{p.name}</p>
                    <p className="text-[10px] font-semibold text-[#657080]">
                      No.{p.order} · {p.seat ? `Kursi ${p.seat} · ` : ''}
                      {p.vw ? `VW ${p.vw}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}