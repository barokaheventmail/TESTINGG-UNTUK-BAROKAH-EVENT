import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { decodeToken } from '@/lib/scan'

export async function POST(request: NextRequest) {
  const session = await requireUser()
  if (!session || (session.role !== 'CREW' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { token?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const raw = typeof body.token === 'string' ? body.token : ''
  const token = decodeToken(raw)
  if (!token) {
    return NextResponse.json({ error: 'QR tidak valid.' }, { status: 400 })
  }

  const p = await prisma.participant.findUnique({
    where: { token },
    include: {
      bus: { select: { name: true } },
      event: { select: { id: true, title: true, date: true, status: true } },
      scannedBy: { select: { username: true } },
    },
  })

  if (!p) {
    logger.warn('scan unknown QR', { by: session.username, token: String(token).slice(0, 8) })
    return NextResponse.json({ error: 'QR tidak dikenali. Pastikan QR adalah tiket peserta.' }, { status: 404 })
  }

  if (p.event.status !== 'ACTIVE') {
    logger.warn('scan inactive event', { by: session.username, eventId: p.event.id, status: p.event.status })
    return NextResponse.json({ error: 'Event tidak aktif.' }, { status: 409 })
  }

  // Atomic: hanya satu crew yang bisa menandai peserta ini pertama kali.
  const first = await prisma.participant.updateMany({
    where: { id: p.id, scannedAt: null },
    data: { scannedAt: new Date(), scannedById: session.sub },
  })

  const attendedNow = first.count === 1
  const status = attendedNow ? 'attended' : 'already'

  await prisma.scanLog.create({
    data: { participantId: p.id, userId: session.sub, status },
  })

  await prisma.activityLog.create({
    data: { eventId: p.event.id, userId: session.sub, action: attendedNow ? 'scan.attended' : 'scan.duplicate', detail: { name: p.name } },
  })
  logger.info(attendedNow ? 'scan attended' : 'scan duplicate', {
    by: session.username,
    participant: p.name,
    eventId: p.event.id,
  })

  const now = p.scannedAt
  const result = {
    ok: true,
    firstScan: attendedNow,
    alreadyAttended: !attendedNow,
    attendedAt: attendedNow ? new Date().toISOString() : now?.toISOString() ?? null,
    scannedBy: attendedNow ? session.username : p.scannedBy?.username ?? null,
    participant: {
      name: p.name,
      order: p.order,
      seat: p.seat,
      room: p.room,
      vw: p.vw,
      busName: p.bus.name,
      eventTitle: p.event.title,
    },
  }

  return NextResponse.json(result)
}