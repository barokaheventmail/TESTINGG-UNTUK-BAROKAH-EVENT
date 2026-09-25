import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100)
  const eventId = (request.nextUrl.searchParams.get('eventId') ?? '').trim().slice(0, 100)
  if (!q) return NextResponse.json({ matches: [] })

  const matches = await prisma.participant.findMany({
    where: {
      name: { contains: q, mode: 'insensitive' },
      event: { status: 'ACTIVE' },
      ...(eventId ? { eventId } : {}),
    },
    select: {
      token: true,
      name: true,
      order: true,
      seat: true,
      room: true,
      vw: true,
      scannedAt: true,
      bus: { select: { name: true } },
      event: { select: { id: true, title: true, date: true, status: true } },
    },
    orderBy: [{ event: { date: 'desc' } }, { order: 'asc' }],
    take: 8,
  })

  logger.info('public search', { q, hits: matches.length })

  return NextResponse.json({
    matches: matches.map((p) => ({
      token: p.token,
      name: p.name,
      order: p.order,
      seat: p.seat,
      room: p.room,
      vw: p.vw,
      attended: p.scannedAt !== null,
      busName: p.bus.name,
      eventTitle: p.event.title,
      eventDate: p.event.date.toISOString(),
      eventStatus: p.event.status,
    })),
  })
}