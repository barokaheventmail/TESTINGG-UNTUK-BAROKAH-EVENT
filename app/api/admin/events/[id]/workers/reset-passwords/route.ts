import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string }> }

function randomPassword(len = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length]
  return out
}

export async function POST(_request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const links = await prisma.busWorker.findMany({
    where: { bus: { eventId: id } },
    include: {
      bus: { select: { name: true } },
      user: { select: { id: true, username: true, name: true } },
    },
  })

  if (links.length === 0) {
    await prisma.activityLog.create({
      data: { eventId: id, userId: session.sub, action: 'busCrew.resetPasswords', detail: { count: 0 } },
    })
    return NextResponse.json({ reset: [] })
  }

  const byUser = new Map<string, { user: { id: string; username: string; name: string | null }; buses: string[] }>()
  for (const l of links) {
    const entry = byUser.get(l.user.id)
    if (entry) entry.buses.push(l.bus.name)
    else byUser.set(l.user.id, { user: l.user, buses: [l.bus.name] })
  }

  const reset: { username: string; name: string | null; buses: string[]; password: string }[] = []

  await prisma.$transaction(async (tx) => {
    for (const { user, buses } of byUser.values()) {
      const password = randomPassword()
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } })
      reset.push({ username: user.username, name: user.name, buses, password })
    }
    await tx.activityLog.create({
      data: {
        eventId: id,
        userId: session.sub,
        action: 'busCrew.resetPasswords',
        detail: { count: reset.length },
      },
    })
  })

  logger.info('crew passwords reset', { eventId: id, by: session.username, count: reset.length })
  return NextResponse.json({ reset })
}