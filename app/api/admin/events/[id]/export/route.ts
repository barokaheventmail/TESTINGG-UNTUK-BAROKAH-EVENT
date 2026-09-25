import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

function csvCell(v: string | number | Date | null | undefined): string {
  if (v instanceof Date) v = v.toISOString()
  const s = v === null || v === undefined ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest, { params }: Params) {
  const session = await requireAdminSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

  const participants = await prisma.participant.findMany({
    where: { eventId: id },
    include: { bus: { select: { name: true, order: true } }, scannedBy: { select: { username: true } } },
    orderBy: [{ bus: { order: 'asc' } }, { order: 'asc' }],
  })

  const header = ['No', 'Nama', 'Tempat Lahir', 'Tgl Lahir', 'No HP', 'Kursi', 'Kamar', 'VW', 'Bus', 'Status', 'Waktu Scan', 'Crew']
  const rows = participants.map((p) => [
    p.order,
    p.name,
    p.birthPlace,
    p.birthDate,
    p.phone,
    p.seat,
    p.room,
    p.vw,
    p.bus.name,
    p.scannedAt ? 'HADIR' : 'BELUM',
    p.scannedAt,
    p.scannedBy?.username,
  ])

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
  const safeName = event.title.replace(/[^\w]+/g, '_').slice(0, 60) || 'event'
  logger.info('export csv', { eventId: id, by: session.username, rows: participants.length })

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="peserta-${safeName}.csv"`,
    },
  })
}