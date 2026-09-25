import { NextResponse } from 'next/server'
import { COOKIE_NAME, getSessionToken, verifySession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST() {
  const token = await getSessionToken()
  const session = token ? await verifySession(token) : null
  if (session) {
    await prisma.activityLog.create({
      data: { userId: session.sub, action: 'auth.logout', detail: { username: session.username } },
    })
    logger.info('logout', { username: session.username })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { ...{ httpOnly: true, path: '/' }, maxAge: 0 })
  return res
}