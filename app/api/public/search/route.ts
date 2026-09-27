import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100)
  const eventId = (request.nextUrl.searchParams.get('eventId') ?? '').trim().slice(0, 100)
  const busIds = (request.nextUrl.searchParams.get('busIds') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 50)
  if (!q) return NextResponse.json({ matches: [] })

  const matches = await prisma.participant.findMany({
    where: {
      name: { contains: q, mode: 'insensitive' },
      event: { status: 'ACTIVE' },
      ...(eventId ? { eventId } : {}),
      ...(busIds.length ? { busId: { in: busIds } } : {}),
    },
    select: {
      token: true,
      name: true,
      order: true,
      birthDate: true,
      bus: {
        select: {
          name: true,
          workers: {
            orderBy: { order: 'asc' },
            select: { user: { select: { name: true, username: true, phone: true, photoUrl: true } } },
          },
        },
      },
      event: { select: { id: true, title: true, date: true } },
    },
    orderBy: [{ event: { date: 'desc' } }, { order: 'asc' }],
    take: 8,
  })

  logger.info('public search', { q, hits: matches.length })

  return NextResponse.json({
    matches: matches.map((p) => {
      const resp = p.bus.workers.find((w) => w.user.phone)?.user
      return {
        eventId: p.event.id,
        token: p.token,
        name: p.name,
        order: p.order,
        birthDate: p.birthDate ? p.birthDate.toISOString() : null,
        busName: p.bus.name,
        eventTitle: p.event.title,
        eventDate: p.event.date.toISOString(),
        crew: resp ? { name: resp.name ?? resp.username, phone: resp.phone, photoUrl: resp.photoUrl } : null,
      }
    }),
  })
}