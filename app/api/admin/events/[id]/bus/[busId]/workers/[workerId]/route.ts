import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string; busId: string; workerId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, busId, workerId } = await params

  let body: { name?: unknown; phone?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const worker = await prisma.busWorker.findFirst({ where: { id: workerId, busId }, include: { bus: { select: { name: true } }, user: { select: { id: true } } } })
  if (!worker) return NextResponse.json({ error: 'Crew tidak ditemukan.' }, { status: 404 })

  const data: { name?: string; phone?: string | null } = {}
  if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (body?.phone !== undefined) data.phone = typeof body.phone === 'string' ? body.phone.trim() || null : null

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Tidak ada data yang diubah.' }, { status: 400 })

  const user = await prisma.user.update({ where: { id: worker.userId }, data })
  await prisma.activityLog.create({
    data: {
      eventId: id,
      userId: session.sub,
      action: 'busCrew.update',
      detail: { bus: worker.bus.name, username: user.username, ...data },
    },
  })

  logger.info('crew updated', { eventId: id, by: session.username, bus: worker.bus.name, username: user.username })
  return NextResponse.json({ worker: { id: worker.id, phone: user.phone, name: user.name, username: user.username } })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, busId, workerId } = await params

  const worker = await prisma.busWorker.findFirst({ where: { id: workerId, busId }, include: { bus: { select: { name: true } }, user: { select: { username: true, name: true } } } })
  if (!worker) return NextResponse.json({ error: 'Crew tidak ditemukan.' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.activityLog.create({
      data: {
        eventId: id,
        userId: session.sub,
        action: 'busCrew.remove',
        detail: { bus: worker.bus.name, username: worker.user.username, name: worker.user.name },
      },
    })
    await tx.busWorker.delete({ where: { id: workerId } })
  })

  logger.info('crew removed', { eventId: id, by: session.username, bus: worker.bus.name, username: worker.user.username })
  return NextResponse.json({ removed: true })
}