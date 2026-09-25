import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.participant.updateMany({
      where: { eventId: id, scannedAt: { not: null } },
      data: { scannedAt: null, scannedById: null, scannedAtEvent: null },
    })
    const logs = await tx.scanLog.deleteMany({ where: { participant: { eventId: id } } })
    if (updated.count > 0) {
      await tx.activityLog.create({
        data: {
          eventId: id,
          userId: session.sub,
          action: 'attendance.reset',
          detail: { participants: updated.count, logs: logs.count },
        },
      })
    }
    return { participants: updated.count, logs: logs.count }
  })

  logger.info('attendance reset', { eventId: id, by: session.username, ...result })

  return NextResponse.json(result)
}