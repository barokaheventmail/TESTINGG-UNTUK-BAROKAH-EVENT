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

  const links = await prisma.busWorker.findMany({
    where: { bus: { eventId: id } },
    include: {
      bus: { select: { name: true } },
      user: { select: { id: true, username: true, name: true, role: true } },
    },
  })

  if (links.length === 0) {
    await prisma.activityLog.create({
      data: { eventId: id, userId: session.sub, action: 'busCrew.deleteAccounts', detail: { count: 0, unlinked: 0 } },
    })
    return NextResponse.json({ deleted: [], unlinked: [] })
  }

  const byUser = new Map<string, { username: string; name: string | null; buses: string[] }>()
  for (const l of links) {
    if (l.user.role === 'ADMIN' || l.user.id === session.sub) continue
    const entry = byUser.get(l.user.id)
    if (entry) entry.buses.push(l.bus.name)
    else byUser.set(l.user.id, { username: l.user.username, name: l.user.name, buses: [l.bus.name] })
  }

  const userIds = [...byUser.keys()]
  const outside = await prisma.busWorker.findMany({
    where: { userId: { in: userIds }, bus: { eventId: { not: id } } },
    select: { userId: true },
  })
  const outsideIds = new Set(outside.map((o) => o.userId))

  let deletedIds: string[] = []
  await prisma.$transaction(async (tx) => {
    deletedIds = userIds.filter((u) => !outsideIds.has(u))
    const usernames = deletedIds.map((u) => byUser.get(u)!.username)

    await tx.busWorker.deleteMany({ where: { userId: { in: userIds }, bus: { eventId: id } } })
    await tx.user.deleteMany({ where: { id: { in: deletedIds } } })
    await tx.activityLog.create({
      data: {
        eventId: id,
        userId: session.sub,
        action: 'busCrew.deleteAccounts',
        detail: { count: deletedIds.length, unlinked: outsideIds.size, usernames },
      },
    })
  })

  logger.info('crew accounts deleted', { eventId: id, by: session.username, count: deletedIds.length })
  return NextResponse.json({
    deleted: deletedIds.map((u) => byUser.get(u)!),
    unlinked: [...outsideIds].map((u) => byUser.get(u)!),
  })
}