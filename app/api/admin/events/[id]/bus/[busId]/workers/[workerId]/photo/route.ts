import { mkdir, rm, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type Params = { params: Promise<{ id: string; busId: string; workerId: string }> }

const ALLOWED = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])
const MAX_BYTES = 5 * 1024 * 1024

const UPLOAD_REL = join('uploads', 'crew')
const UPLOAD_URL_PREFIX = '/uploads/crew/'

/**
 * Foto crew disimpan di `User.photoUrl`, bukan di `BusWorker`, karena satu orang
 * bisa jadi crew di banyak bus dan event. Endpointnya tetap dibatasi per bus
 * supaya konsisten dengan route worker lain: crew harus benar-benar terpasang
 * di bus itu sebelum fotonya boleh diubah.
 *
 * File diletakkan di `uploads/crew/`, bukan `public/`, supaya tidak ikut
 * ter-*bundle* saat build dan tetap diabaikan git. Penyajiannya sendiri
 * ditangani `app/uploads/[...path]/route.ts`.
 */

function uploadPath(): string {
  return resolve(process.cwd(), UPLOAD_REL)
}

/** Hanya hapus file yang benar-benar milik folder foto crew. */
async function rmPhoto(url: string | null): Promise<void> {
  if (!url || !url.startsWith(UPLOAD_URL_PREFIX)) return
  const filename = url.slice(UPLOAD_URL_PREFIX.length)
  if (!filename || filename.includes('/') || filename.includes('..')) return
  await rm(join(uploadPath(), filename), { force: true })
}

async function findWorker(eventId: string, busId: string, workerId: string) {
  return prisma.busWorker.findFirst({
    where: { id: workerId, busId, bus: { eventId } },
    include: { bus: { select: { name: true } }, user: { select: { id: true, username: true, photoUrl: true } } },
  })
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, busId, workerId } = await params

  const worker = await findWorker(id, busId, workerId)
  if (!worker) return NextResponse.json({ error: 'Crew tidak ditemukan.' }, { status: 404 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Pilih file gambar terlebih dahulu.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5 MB.' }, { status: 400 })
  }
  const ext = ALLOWED.get(file.type)
  if (!ext) {
    return NextResponse.json({ error: 'Hanya mendukung gambar JPG, PNG, atau WebP.' }, { status: 400 })
  }

  const filename = `${crypto.randomUUID()}.${ext}`
  await mkdir(uploadPath(), { recursive: true })
  await writeFile(join(uploadPath(), filename), Buffer.from(await file.arrayBuffer()))

  const url = `${UPLOAD_URL_PREFIX}${filename}`
  const previous = worker.user.photoUrl

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: worker.user.id }, data: { photoUrl: url } })
      await tx.activityLog.create({
        data: {
          eventId: id,
          userId: session.sub,
          action: 'busCrew.photo',
          detail: { bus: worker.bus.name, username: worker.user.username, url },
        },
      })
    })
  } catch (err) {
    // DB gagal: jangan tinggalkan file yatim di disk.
    await rmPhoto(url).catch(() => undefined)
    logger.error('crew photo upload failed', { eventId: id, workerId, err })
    return NextResponse.json({ error: 'Gagal menyimpan foto.' }, { status: 500 })
  }

  await rmPhoto(previous).catch(() => undefined)
  logger.info('crew photo uploaded', { eventId: id, by: session.username, username: worker.user.username })
  return NextResponse.json({ url, photoUrl: url })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, busId, workerId } = await params

  const worker = await findWorker(id, busId, workerId)
  if (!worker) return NextResponse.json({ error: 'Crew tidak ditemukan.' }, { status: 404 })

  const previous = worker.user.photoUrl
  if (!previous) return NextResponse.json({ ok: true })

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: worker.user.id }, data: { photoUrl: null } })
    await tx.activityLog.create({
      data: {
        eventId: id,
        userId: session.sub,
        action: 'busCrew.photoRemove',
        detail: { bus: worker.bus.name, username: worker.user.username, url: previous },
      },
    })
  })

  await rmPhoto(previous).catch(() => undefined)
  logger.info('crew photo removed', { eventId: id, by: session.username, username: worker.user.username })
  return NextResponse.json({ ok: true })
}
