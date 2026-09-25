import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const participantSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  phone: z.string().trim().nullish(),
  seat: z.string().trim().nullish(),
  room: z.string().trim().nullish(),
  vw: z.string().trim().nullish(),
  busName: z.string().trim().nullish(),
})

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = participantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }, { status: 400 })
  }

  const { name, phone, seat, room, vw, busName } = parsed.data
  const wantedBus = busName || 'Bus 1'

  let bus = await prisma.bus.findUnique({ where: { eventId_name: { eventId: id, name: wantedBus } } })
  if (!bus) {
    const order = await prisma.bus.count({ where: { eventId: id } })
    bus = await prisma.bus.create({ data: { eventId: id, name: wantedBus, order: order + 1 } })
  }

  const maxOrder = await prisma.participant.aggregate({
    where: { busId: bus.id },
    _max: { order: true },
  })

  const participant = await prisma.participant.create({
    data: {
      eventId: id,
      busId: bus.id,
      order: (maxOrder._max.order ?? 0) + 1,
      name,
      phone: phone || null,
      seat: seat || null,
      room: room || null,
      vw: vw || null,
    },
  })

  await prisma.activityLog.create({
    data: { eventId: id, userId: session.sub, action: 'participant.create', detail: { name, bus: bus.name } },
  })
  logger.info('participant created manually', { eventId: id, by: session.username, name })

  return NextResponse.json({ participant }, { status: 201 })
}