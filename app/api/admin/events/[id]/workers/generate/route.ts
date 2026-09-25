import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

const PREFIX_RE = /^[a-z0-9_]{1,20}$/

function randomPassword(len = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length]
  return out
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: { buses: { orderBy: { order: 'asc' }, include: { workers: { select: { id: true } } } } },
  })
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

  let body: { prefix?: unknown; perBus?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prefix = typeof body?.prefix === 'string' ? body.prefix.trim().toLowerCase() : ''
  const rawPer = typeof body?.perBus === 'string' ? Number(body.perBus) : body?.perBus
  const perBus = Number.isFinite(rawPer) ? Math.min(Math.max(1, Math.floor(Number(rawPer))), 10) : 1
  if (!PREFIX_RE.test(prefix)) {
    return NextResponse.json({ error: 'Kode event hanya huruf/angka tanpa spasi, maks 20 karakter.' }, { status: 400 })
  }

  // Nomor terakhir yang sudah dipakai untuk prefix ini (global).
  let maxNum = 0
  const existing = await prisma.user.findMany({
    where: { username: { startsWith: prefix } },
    select: { username: true },
  })
  for (const u of existing) {
    const tail = u.username.slice(prefix.length)
    if (/^\d+$/.test(tail)) maxNum = Math.max(maxNum, Number(tail))
  }

  const plan = event.buses
    .map((b) => ({ bus: b, needed: perBus - b.workers.length }))
    .filter((p) => p.needed > 0)

  const created: { busName: string; username: string; password: string }[] = []
  let nextNum = maxNum + 1

  if (plan.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const { bus, needed } of plan) {
        for (let i = 0; i < needed; i++) {
          let user: { id: string; username: string } | null = null
          // Coba dengan nomor berurutan; bila bentrok (P2002), naikkan angka.
          for (let attempt = 0; attempt < 50 && !user; attempt++) {
            const username = prefix + nextNum
            const password = randomPassword()
            const passwordHash = await bcrypt.hash(password, 10)
            try {
              user = await tx.user.create({ data: { username, passwordHash, role: 'CREW' } })
              created.push({ busName: bus.name, username, password })
            } catch (err) {
              if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                nextNum += 1
                continue
              }
              throw err
            }
          }
          if (!user) throw new Error('Gagal membuat username unik.')
          nextNum += 1
          const order = bus.workers.length + i + 1
          await tx.busWorker.create({ data: { busId: bus.id, userId: user.id, order } })
        }
      }
      await tx.event.update({ where: { id }, data: { crewPrefix: prefix } })
    })
  }

  await prisma.activityLog.create({
    data: {
      eventId: id,
      userId: session.sub,
      action: 'busCrew.generate',
      detail: { prefix, perBus, buses: plan.length, created: created.length },
    },
  })

  logger.info('crew accounts generated', { eventId: id, by: session.username, prefix, created: created.length })
  return NextResponse.json({ created, prefix, skipped: event.buses.length - plan.length })
}