import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

  let body: { name?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Nama bus wajib diisi.' }, { status: 400 })

  const order = await prisma.bus.count({ where: { eventId: id } })
  try {
    const bus = await prisma.$transaction(async (tx) => {
      const created = await tx.bus.create({ data: { eventId: id, name, order: order + 1 } })
      await tx.activityLog.create({
        data: { eventId: id, userId: session.sub, action: 'bus.create', detail: { name } },
      })
      return created
    })
    logger.info('bus created', { eventId: id, bus: name })
    return NextResponse.json({ bus }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Nama bus sudah ada untuk event ini.' }, { status: 409 })
  }
}