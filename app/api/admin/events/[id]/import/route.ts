import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { parseWorkbook } from '@/lib/excel'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ROWS = 50000

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireUser()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Event tidak ditemukan.' }, { status: 404 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File Excel diperlukan.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 10MB.' }, { status: 400 })
  }
  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    return NextResponse.json({ error: 'Format file harus .xlsx atau .xls.' }, { status: 400 })
  }

  let parsed
  try {
    parsed = parseWorkbook(await file.arrayBuffer())
  } catch (e) {
    logger.error('excel parse failed', { eventId: id, error: e instanceof Error ? e.message : 'unknown' })
    return NextResponse.json({ error: 'Gagal membaca file Excel. Pastikan format sesuai template.' }, { status: 400 })
  }

  if (parsed.buses.length === 0) {
    return NextResponse.json({ error: 'Tidak ada data peserta ditemukan di file.' }, { status: 400 })
  }

  const totalRows = parsed.buses.reduce((acc, b) => acc + b.participants.length, 0)
  if (totalRows > MAX_ROWS) {
    return NextResponse.json(
      { error: `File terlalu besar: ${totalRows} baris. Maksimal ${MAX_ROWS} baris per file. Pisahkan menjadi beberapa file.` },
      { status: 400 },
    )
  }

  const busResults: { name: string; created: number; updated: number; skipped: number }[] = []
  let totalCreated = 0
  let totalUpdated = 0

  try {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < parsed.buses.length; i++) {
        const bus = parsed.buses[i]
        const busRec = await tx.bus.upsert({
          where: { eventId_name: { eventId: id, name: bus.name } },
          create: { eventId: id, name: bus.name, order: i + 1 },
          update: { order: i + 1 },
        })

        let created = 0
        let updated = 0
        for (const p of bus.participants) {
          const data = {
            name: p.name,
            birthPlace: p.birthPlace ?? null,
            birthDate: p.birthDate ?? null,
            phone: p.phone ?? null,
            seat: p.seat ?? null,
            room: p.room ?? null,
            vw: p.vw ?? null,
          }
          const exists = await tx.participant.findUnique({
            where: { eventId_busId_order: { eventId: id, busId: busRec.id, order: p.order } },
            select: { id: true },
          })
          if (exists) {
            await tx.participant.update({ where: { id: exists.id }, data })
            updated++
          } else {
            await tx.participant.create({ data: { ...data, eventId: id, busId: busRec.id, order: p.order } })
            created++
          }
        }

        totalCreated += created
        totalUpdated += updated
        busResults.push({ name: bus.name, created, updated, skipped: 0 })
      }

      await tx.activityLog.create({
        data: {
          eventId: id,
          userId: session.sub,
          action: 'event.import',
          detail: { buses: busResults, created: totalCreated, updated: totalUpdated, skipped: parsed.skipped as number },
        },
      })
    })
  } catch (e) {
    logger.error('excel import failed', { eventId: id, error: e instanceof Error ? e.message : 'unknown' })
    return NextResponse.json({ error: 'Gagal menyimpan data import.' }, { status: 500 })
  }

  logger.info('excel imported', { eventId: id, by: session.username, created: totalCreated, updated: totalUpdated })

  return NextResponse.json({
    ok: true,
    buses: busResults,
    created: totalCreated,
    updated: totalUpdated,
    skipped: parsed.skipped as number,
  })
}