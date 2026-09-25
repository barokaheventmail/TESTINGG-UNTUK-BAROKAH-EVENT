import { NextRequest, NextResponse } from 'next/server'
import { requireCrewSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { decodeToken } from '@/lib/scan'

export async function POST(request: NextRequest) {
  const session = await requireCrewSession()
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

  let p = await prisma.participant.findUnique({
    where: { token },
    include: {
      bus: { select: { name: true } },
      event: { select: { id: true, title: true, date: true, status: true } },
      scannedBy: { select: { username: true } },
    },
  })

  const ticketCode = raw.trim()
  if (!p && ticketCode) {
    const matches = await prisma.participant.findMany({
      where: { ticketCode },
      select: { token: true },
    })
    if (matches.length > 1) {
      logger.warn('scan ambiguous ticket code', { by: session.username, code: ticketCode })
      return NextResponse.json(
        { error: 'No. Tiket tidak unik. Gunakan QR atau tautan tiket untuk verifikasi.' },
        { status: 409 },
      )
    }
    if (matches.length === 1) {
      logger.info('scan resolved ticket code', { by: session.username, code: ticketCode, token: matches[0].token })
      p = await prisma.participant.findUnique({
        where: { token: matches[0].token },
        include: {
          bus: { select: { name: true } },
          event: { select: { id: true, title: true, date: true, status: true } },
          scannedBy: { select: { username: true } },
        },
      })
    }
  }

  if (!p) {
    logger.warn('scan unknown QR', { by: session.username, token: String(token).slice(0, 8) })
    return NextResponse.json(
      { error: 'QR atau No. Tiket tidak dikenali. Periksa kembali kode yang dimasukkan.' },
      { status: 404 },
    )
  }

  if (p.event.status !== 'ACTIVE') {
    logger.warn('scan inactive event', { by: session.username, eventId: p.event.id, status: p.event.status })
    return NextResponse.json({ error: 'Event tidak aktif.' }, { status: 409 })
  }

  // Atomic: hanya satu crew yang bisa menandai peserta ini pertama kali.
  let outcome: { firstScan: boolean; fresh: { scannedAt: Date | null; scannedBy: { username: string } | null } | null }

  try {
    outcome = await prisma.$transaction(async (tx) => {
      const first = await tx.participant.updateMany({
        where: { id: p.id, scannedAt: null },
        data: { scannedAt: new Date(), scannedById: session.sub },
      })

      const firstScan = first.count === 1
      const status = firstScan ? 'attended' : 'already'

      await tx.scanLog.create({
        data: { participantId: p.id, userId: session.sub, status },
      })

      await tx.activityLog.create({
        data: { eventId: p.event.id, userId: session.sub, action: firstScan ? 'scan.attended' : 'scan.duplicate', detail: { name: p.name } },
      })

      const fresh = await tx.participant.findUnique({
        where: { id: p.id },
        select: { scannedAt: true, scannedBy: { select: { username: true } } },
      })
      return { firstScan, fresh }
    })
  } catch (e) {
    logger.error('scan txn failed', { by: session.username, participant: p.name, eventId: p.event.id, error: e instanceof Error ? e.message : 'unknown' })
    return NextResponse.json({ error: 'Gagal mencatat scan.' }, { status: 500 })
  }

  const { firstScan, fresh } = outcome
  logger.info(firstScan ? 'scan attended' : 'scan duplicate', {
    by: session.username,
    participant: p.name,
    eventId: p.event.id,
  })

  const result = {
    ok: true,
    firstScan,
    alreadyAttended: !firstScan,
    attendedAt: fresh?.scannedAt?.toISOString() ?? null,
    scannedBy: fresh?.scannedBy?.username ?? null,
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