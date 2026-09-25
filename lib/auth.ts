import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { Role } from '@prisma/client'
import { prisma } from './db'

export const COOKIE_NAME = 'bt_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 hari

export type Session = {
  sub: string
  username: string
  role: Role
}

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me')
}

export const cookieOpts = () => {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ username: session.username, role: session.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret())
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.sub || !payload.role) return null
    return {
      sub: payload.sub,
      username: String(payload.username ?? ''),
      role: payload.role as Role,
    }
  } catch {
    return null
  }
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value ?? null
}

export async function requireUser(): Promise<Session | null> {
  const token = await getSessionToken()
  if (!token) return null
  return verifySession(token)
}

export function userRoleGate(session: Session | null, roles: Role[]): Session | null {
  if (!session || !roles.includes(session.role)) return null
  return session
}

export async function logActivity(action: string, eventId?: string | null, userId?: string | null, detail?: unknown) {
  return prisma.activityLog.create({
    data: { action, eventId: eventId ?? null, userId: userId ?? null, detail: detail ?? undefined },
  })
}