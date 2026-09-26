import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string; busId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdminSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, busId } = await params

  let body: { name?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Nama bus wajib diisi.' }, { status: 400 })

  const existing = await prisma.bus.findFirst({ where: { id: busId, eventId: id } })
  if (!existing) return NextResponse.json({ error: 'Bus tidak ditemukan.' }, { status: 404 })
  if (existing.name === name) return NextResponse.json({ bus: existing })

  try {
    const bus = await prisma.$transaction(async (tx) => {
      const updated = await tx.bus.update({ where: { id: busId }, data: { name } })
      await tx.activityLog.create({
        data: { eventId: id, userId: session.sub, action: 'bus.update', detail: { from: existing.name, to: name } },
      })
      return updated
    })
    logger.info('bus updated', { eventId: id, by: session.username, busId, from: existing.name, to: name })
    return NextResponse.json({ bus })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'Nama bus sudah ada untuk event ini.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Gagal memperbarui bus.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, busId } = await params
  const existing = await prisma.bus.findFirst({ where: { id: busId, eventId: id } })
  if (!existing) return NextResponse.json({ error: 'Bus tidak ditemukan.' }, { status: 404 })

  const totalPeserta = await prisma.participant.count({ where: { busId } })

  await prisma.$transaction(async (tx) => {
    await tx.activityLog.create({
      data: { eventId: id, userId: session.sub, action: 'bus.delete', detail: { name: existing.name, participants: totalPeserta } },
    })
    await tx.bus.delete({ where: { id: busId } })
    await tx.user.deleteMany({ where: { role: 'CREW', workers: { none: {} } } })
  })

  logger.info('bus deleted', { eventId: id, by: session.username, busId, name: existing.name, participants: totalPeserta })

  return NextResponse.json({ deleted: true, participants: totalPeserta })
}