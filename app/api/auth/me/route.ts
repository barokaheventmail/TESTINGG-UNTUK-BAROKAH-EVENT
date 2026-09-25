import { NextRequest, NextResponse } from 'next/server'
import { getSession, getSessions, type SessionRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const scope = (request.nextUrl.searchParams.get('scope') ?? '').toUpperCase()
  if (scope) {
    if (scope !== 'ADMIN' && scope !== 'CREW') {
      return NextResponse.json({ error: 'scope invalid' }, { status: 400 })
    }
    const role = scope as SessionRole
    const session = await getSession(role)
    if (!session) return NextResponse.json({ user: null, sessions: [] }, { status: 401 })
    return NextResponse.json({ user: session, sessions: [session] })
  }

  const sessions = await getSessions()
  return NextResponse.json({ user: sessions[0] ?? null, sessions })
}