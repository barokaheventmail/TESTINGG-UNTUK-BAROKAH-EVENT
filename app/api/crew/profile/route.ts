import { NextRequest, NextResponse } from 'next/server'
import { requireCrewSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { removeCrewPhoto, saveCrewPhoto } from '@/lib/crew-photo'

function pickText(value: unknown): string | null | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, 100)
  return trimmed.length > 0 ? trimmed : null
}

export async function PATCH(request: NextRequest) {
  const session = await requireCrewSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
  }
  const record = body as Record<string, unknown>

  const name = pickText(record.name)
  const phone = pickText(record.phone)
  if (name === undefined && phone === undefined) {
    return NextResponse.json({ error: 'Tidak ada data yang diubah.' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.sub },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
    },
    select: { id: true, username: true, name: true, phone: true, photoUrl: true },
  })

  logger.info('crew profile updated', { by: session.username, name, phone })
  return NextResponse.json({ user: updated })
}

export async function POST(request: NextRequest) {
  const session = await requireCrewSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Pilih file gambar terlebih dahulu.' }, { status: 400 })
  }

  const current = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { photoUrl: true },
  })

  const saved = await saveCrewPhoto(file)
  if ('error' in saved) {
    return NextResponse.json({ error: saved.error }, { status: 400 })
  }

  try {
    await prisma.user.update({
      where: { id: session.sub },
      data: { photoUrl: saved.url },
    })
  } catch (err) {
    await removeCrewPhoto(saved.url).catch(() => undefined)
    logger.error('crew profile photo upload failed', { by: session.username, err })
    return NextResponse.json({ error: 'Gagal menyimpan foto.' }, { status: 500 })
  }

  await removeCrewPhoto(current?.photoUrl ?? null).catch(() => undefined)
  logger.info('crew profile photo uploaded', { by: session.username, url: saved.url })
  return NextResponse.json({ url: saved.url, photoUrl: saved.url })
}

export async function DELETE(_request: NextRequest) {
  const session = await requireCrewSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const current = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { photoUrl: true },
  })
  if (!current?.photoUrl) {
    return NextResponse.json({ ok: true })
  }

  await prisma.user.update({
    where: { id: session.sub },
    data: { photoUrl: null },
  })
  await removeCrewPhoto(current.photoUrl).catch(() => undefined)
  logger.info('crew profile photo removed', { by: session.username })
  return NextResponse.json({ ok: true })
}