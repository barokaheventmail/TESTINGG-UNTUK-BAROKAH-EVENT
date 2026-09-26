import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params

  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, status: true } })
  if (!event || event.status !== 'ACTIVE') {
    return NextResponse.json({ attended: 0, total: 0, perBus: {}, seq: null, new: [] })
  }

  const sinceRaw = request.nextUrl.searchParams.get('since')
  const since = sinceRaw ? new Date(sinceRaw) : null

  const [totalByBus, attendedByBus, latestLog, delta] = await Promise.all([
    prisma.participant.groupBy({ by: ['busId'], where: { eventId: id }, _count: { _all: true } }),
    prisma.participant.groupBy({ by: ['busId'], where: { eventId: id, scannedAt: { not: null } }, _count: { _all: true } }),
    prisma.scanLog.findFirst({
      where: { participant: { eventId: id } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    prisma.scanLog.findMany({
      where: {
        status: 'attended',
        createdAt: { gt: since ?? new Date(0) },
        participant: { eventId: id },
      },
      select: { participantId: true, participant: { select: { busId: true } } },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
  ])

  const totalMap = new Map(totalByBus.map((r) => [r.busId, r._count._all]))
  const attendedMap = new Map(attendedByBus.map((r) => [r.busId, r._count._all]))
  const perBus: Record<string, { attended: number; total: number }> = {}
  for (const [busId, total] of totalMap) {
    perBus[busId] = { attended: attendedMap.get(busId) ?? 0, total }
  }
  const total = [...totalMap.values()].reduce((a, b) => a + b, 0)
  const attended = [...attendedMap.values()].reduce((a, b) => a + b, 0)

  return NextResponse.json(
    {
      attended,
      total,
      perBus,
      seq: latestLog?.createdAt.toISOString() ?? null,
      new: delta.map((l) => ({ participantId: l.participantId, busId: l.participant.busId })),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}