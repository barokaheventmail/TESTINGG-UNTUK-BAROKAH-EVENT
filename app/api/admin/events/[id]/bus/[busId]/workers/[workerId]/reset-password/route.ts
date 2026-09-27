import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdminSession } from '@/lib/auth'
import { crewPassword } from '@/lib/crew-password'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string; busId: string; workerId: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, busId, workerId } = await params

  // Password crew tidak pernah diketik manual lagi: pola username+1123,
  // jadi server cukup menurunkan ulang dari username yang sudah ada.
  const worker = await prisma.busWorker.findFirst({ where: { id: workerId, busId }, include: { bus: { select: { name: true } }, user: { select: { username: true } } } })
  if (!worker) return NextResponse.json({ error: 'Crew tidak ditemukan.' }, { status: 404 })

  const passwordHash = await bcrypt.hash(crewPassword(worker.user.username), 10)
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: worker.userId }, data: { passwordHash } })
    await tx.activityLog.create({
      data: {
        eventId: id,
        userId: session.sub,
        action: 'busCrew.resetPassword',
        detail: { bus: worker.bus.name, username: worker.user.username },
      },
    })
  })

  logger.info('crew password reset', { eventId: id, by: session.username, bus: worker.bus.name, username: worker.user.username })
  return NextResponse.json({ ok: true })
}