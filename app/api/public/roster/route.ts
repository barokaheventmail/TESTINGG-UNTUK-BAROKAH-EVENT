import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const eventId = (request.nextUrl.searchParams.get('eventId') ?? '').trim().slice(0, 100)
  if (!eventId) return NextResponse.json({ buses: [] })

  const busIds = (request.nextUrl.searchParams.get('busIds') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 50)

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true },
  })
  if (!event || event.status !== 'ACTIVE') return NextResponse.json({ buses: [] })

  const buses = await prisma.bus.findMany({
    where: {
      eventId,
      ...(busIds.length ? { id: { in: busIds } } : {}),
    },
    select: { id: true, name: true },
    orderBy: { order: 'asc' },
  })

  if (buses.length === 0) return NextResponse.json({ buses: [] })

  const participants = await prisma.participant.findMany({
    where: {
      eventId,
      ...(busIds.length ? { busId: { in: busIds } } : {}),
    },
    select: { id: true, busId: true, order: true, name: true, token: true, scannedAt: true },
    orderBy: { order: 'asc' },
  })

  const byBus = new Map<string, typeof participants>(buses.map((b) => [b.id, [] as typeof participants]))
  for (const p of participants) byBus.get(p.busId)?.push(p)

  const result = buses.map((bus) => ({
    busId: bus.id,
    busName: bus.name,
    participants: (byBus.get(bus.id) ?? []).map((p) => ({
      id: p.id,
      order: p.order,
      name: p.name,
      token: p.token,
      present: p.scannedAt !== null,
    })),
  }))

  logger.info('public roster', { eventId, busIds, hits: result.reduce((n, b) => n + b.participants.length, 0) })

  return NextResponse.json({ buses: result })
}