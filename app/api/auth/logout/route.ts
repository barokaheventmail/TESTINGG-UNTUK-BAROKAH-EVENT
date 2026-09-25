import { NextRequest, NextResponse } from 'next/server'
import { cookieOpts, getSession, getSessionCookieName, LEGACY_COOKIE_NAME, type SessionRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const SCOPES: SessionRole[] = ['ADMIN', 'CREW']
const ALL = 'ALL'

export async function POST(request: NextRequest) {
  let scope: string = ALL
  try {
    const body = await request.json()
    const candidate = typeof body?.scope === 'string' ? body.scope.toUpperCase() : ALL
    if (candidate === ALL || SCOPES.includes(candidate as SessionRole)) {
      scope = candidate
    }
  } catch {
    scope = ALL
  }

  const selected: SessionRole[] = scope === ALL ? SCOPES : [scope as SessionRole]
  const res = NextResponse.json({ ok: true, scope })

  for (const role of selected) {
    const session = await getSession(role)
    if (session) {
      await prisma.activityLog.create({
        data: { userId: session.sub, action: 'auth.logout', detail: { username: session.username, role: session.role } },
      })
      logger.info('logout', { username: session.username, role: session.role })
    }
    res.cookies.set(getSessionCookieName(role), '', { ...cookieOpts(), maxAge: 0 })
  }
  res.cookies.set(LEGACY_COOKIE_NAME, '', { ...cookieOpts(), maxAge: 0 })

  return res
}