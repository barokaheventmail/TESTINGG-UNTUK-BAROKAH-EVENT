import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { NextRequest, NextResponse } from 'next/server'

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const FILENAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/

type Params = { params: Promise<{ file: string }> }

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: Params) {
  const { file } = await params
  if (!FILENAME_RE.test(file)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const ext = file.split('.').pop() ?? ''
  const dir = resolve(process.cwd(), 'uploads', 'events')
  const full = resolve(dir, file)
  if (!full.startsWith(dir + '/')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const data = await readFile(full)
    return new NextResponse(data, {
      headers: {
        'Content-Type': EXT_MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}