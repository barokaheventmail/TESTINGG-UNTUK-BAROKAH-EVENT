import { NextRequest, NextResponse } from 'next/server'
import { requireCrewSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await requireCrewSession()
  if (!session || (session.role !== 'CREW' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const assignments = await prisma.busWorker.findMany({
    where: { userId: session.sub },
    select: {
      busId: true,
      bus: {
        select: {
          id: true,
          name: true,
          eventId: true,
          seatRows: true,
          seatCols: true,
          seatLayout: true,
          event: { select: { title: true, status: true } },
        },
      },
    },
  })

  const active = assignments.filter((a) => a.bus.event.status === 'ACTIVE')

  const buses = []
  for (const a of active) {
    const participants = await prisma.participant.findMany({
      where: { busId: a.busId },
      select: { seat: true, order: true, name: true, scannedAt: true },
    })
    participants.sort((x, y) => {
      const xs = Number.parseInt(x.seat ?? '', 10)
      const ys = Number.parseInt(y.seat ?? '', 10)
      if (!Number.isNaN(xs) && !Number.isNaN(ys)) return xs - ys
      return (x.seat ?? '').localeCompare(y.seat ?? '')
    })
    buses.push({
      busId: a.busId,
      busName: a.bus.name,
      eventTitle: a.bus.event.title,
      seatRows: a.bus.seatRows,
      seatCols: a.bus.seatCols,
      seatLayout: a.bus.seatLayout,
      total: participants.length,
      filled: participants.filter((p) => p.scannedAt !== null).length,
      seats: participants.map((p) => ({
        seat: p.seat,
        order: p.order,
        name: p.name,
        present: p.scannedAt !== null,
      })),
    })
  }

  return NextResponse.json({ buses }, { headers: { 'Cache-Control': 'no-store' } })
}