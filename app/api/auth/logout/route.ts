import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST() {
  logger.info('logout')
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { ...{ httpOnly: true, path: '/' }, maxAge: 0 })
  return res
}