import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const startedAt = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      uptimeMs: startedAt,
      version: process.env.npm_package_version ?? 'dev',
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', db: 'error', message: error instanceof Error ? error.message : 'unknown' },
      { status: 503 },
    )
  }
}