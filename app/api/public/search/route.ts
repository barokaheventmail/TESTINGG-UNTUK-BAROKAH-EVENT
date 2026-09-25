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
      bus: { select: { name: true } },
      event: { select: { title: true, date: true } },
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
      busName: p.bus.name,
      eventTitle: p.event.title,
      eventDate: p.event.date.toISOString(),
    })),
  })
}