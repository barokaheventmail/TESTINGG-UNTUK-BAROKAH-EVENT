import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME } from '@/lib/auth'

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me')

async function getSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return {
      sub: String(payload.sub ?? ''),
      role: String(payload.role ?? ''),
    }
  } catch {
    return null
  }
}

function resolveDest(next: string | null, role: string): string {
  const target = role === 'ADMIN' ? '/admin' : '/crew'
  if (!next || !next.startsWith('/') || next.startsWith('//')) return target
  const isAdminPath = next.startsWith('/admin')
  const allowed = role === 'ADMIN' || !isAdminPath
  return allowed ? next : target
}

/** Apakah role ini memiliki akses ke path yang diminta `next`? */
function isAllowedNext(next: string | null, role: string): boolean {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return false
  return role === 'ADMIN' || !next.startsWith('/admin')
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSession(request)

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('next', pathname)

  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    if (session) {
      const next = request.nextUrl.searchParams.get('next')
      // Jika pengguna sudah login namun meminta halaman yang tidak diizinkan
      // untuk role-nya (mis. crew mengakses /admin), render halaman login
      // agar bisa pindah akun - jangan bounce/loop ke halaman rol lain.
      if (next && !isAllowedNext(next, session.role)) {
        return NextResponse.next()
      }
      const dest = resolveDest(next, session.role)
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?next=/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/crew/:path*', '/login'],
}