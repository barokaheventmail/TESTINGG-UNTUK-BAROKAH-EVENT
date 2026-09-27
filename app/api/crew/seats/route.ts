import { NextRequest, NextResponse } from 'next/server'
import { requireCrewSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { countPresent, mapCrewSeats } from '@/lib/crew-seats'

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
    buses.push({
      busId: a.busId,
      busName: a.bus.name,
      eventTitle: a.bus.event.title,
      seatRows: a.bus.seatRows,
      seatCols: a.bus.seatCols,
      seatLayout: a.bus.seatLayout,
      total: participants.length,
      filled: countPresent(participants),
      seats: mapCrewSeats(participants),
    })
  }

  return NextResponse.json({ buses }, { headers: { 'Cache-Control': 'no-store' } })
}