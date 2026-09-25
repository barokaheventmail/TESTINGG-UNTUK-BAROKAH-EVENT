import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { eventSchema } from '@/lib/excel'

type Params = { params: Promise<{ id: string }> }

async function loadEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      buses: { orderBy: { order: 'asc' }, include: { _count: { select: { participants: true } } } },
      participants: {
        orderBy: [{ busId: 'asc' }, { order: 'asc' }],
        include: { bus: { select: { id: true, name: true } }, scannedBy: { select: { username: true } } },
      },
    },
  })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }, { status: 400 })
  }

  const { title, date, location, status, note } = parsed.data
  const d = new Date(date)
  if (isNaN(d.getTime())) return NextResponse.json({ error: 'Tanggal tidak valid.' }, { status: 400 })

  const event = await prisma.event.update({
    where: { id },
    data: { title, date: d, location, status, note: note || null },
  })

  await prisma.activityLog.create({
    data: { eventId: id, userId: session.sub, action: 'event.update', detail: { title } },
  })
  logger.info('event updated', { eventId: id, by: session.username })

  return NextResponse.json({ event })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

  await prisma.activityLog.create({
    data: { eventId: id, userId: session.sub, action: 'event.delete', detail: { title: existing.title } },
  })
  await prisma.event.delete({ where: { id } })
  logger.info('event deleted', { eventId: id, title: existing.title, by: session.username })

  return NextResponse.json({ ok: true })
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const event = await loadEvent(id)
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ event })
}