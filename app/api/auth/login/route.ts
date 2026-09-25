import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { COOKIE_NAME, cookieOpts, signSession } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  let body: { username?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const username = typeof body.username === 'string' ? body.username.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    logger.warn('login failed', { username, reason: 'user_not_found' })
    return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 })
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    logger.warn('login failed', { username, reason: 'wrong_password' })
    return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 })
  }

  const token = await signSession({ sub: user.id, username: user.username, role: user.role })
  logger.info('login ok', { username, role: user.role })

  const res = NextResponse.json({ ok: true, role: user.role, username: user.username })
  res.cookies.set(COOKIE_NAME, token, cookieOpts())
  return res
}