import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { LEGACY_COOKIE_NAME, SESSION_COOKIE_NAMES, type SessionRole } from '@/lib/auth'

const DEV_SECRET = 'dev-secret-change-me'

const secret = () => {
  const value = process.env.JWT_SECRET || DEV_SECRET
  if (value === DEV_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET wajib di-set di lingkungan produksi.')
  }
  return new TextEncoder().encode(value)
}

type VerifiedSession = { sub: string; role: SessionRole }

async function readSession(token: string | undefined): Promise<VerifiedSession | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    const role = payload.role
    if (!payload.sub || (role !== 'ADMIN' && role !== 'CREW')) return null
    return { sub: String(payload.sub), role }
  } catch {
    return null
  }
}

async function routeSession(request: NextRequest, pathname: string): Promise<VerifiedSession | null> {
  const adminCookie = request.cookies.get(SESSION_COOKIE_NAMES.ADMIN)?.value
  const crewCookie = request.cookies.get(SESSION_COOKIE_NAMES.CREW)?.value
  const legacyCookie = request.cookies.get(LEGACY_COOKIE_NAME)?.value
  const [admin, crew, legacy] = await Promise.all([
    readSession(adminCookie),
    readSession(crewCookie),
    readSession(legacyCookie),
  ])

  if (pathname.startsWith('/admin')) {
    if (adminCookie) return admin
    return legacy?.role === 'ADMIN' ? legacy : null
  }

  if (crewCookie) return crew
  if (adminCookie) return admin
  return legacy
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  const role: SessionRole = pathname.startsWith('/admin') ? 'ADMIN' : 'CREW'
  const session = await routeSession(request, pathname)

  if (!session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    loginUrl.searchParams.set('scope', role)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?scope=ADMIN&next=/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/crew/:path*', '/login'],
}