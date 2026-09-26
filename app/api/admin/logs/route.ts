import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Satu permintaan dibatasi 200 entri. Cukup untuk satu halaman (50) dengan
// cadangan, dan menjaga `IN (...)` tetap wajar.
const MAX_IDS = 200

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let raw: string[]
  try {
    const body = (await request.json()) as { ids?: unknown }
    if (!Array.isArray(body.ids)) throw new Error('bukan array')
    raw = body.ids.filter((v): v is string => typeof v === 'string' && v.length > 0)
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 })
  }

  if (raw.length === 0) {
    return NextResponse.json({ error: 'Pilih minimal satu entri riwayat.' }, { status: 400 })
  }
  // Batasnya dicek SEBELUM dedup. Kalau sesudah, 10.000 id yang sama-sama
  // jadi satu dan batas ini tidak akan pernah aktif.
  if (raw.length > MAX_IDS) {
    return NextResponse.json({ error: `Maksimal ${MAX_IDS} entri sekaligus.` }, { status: 400 })
  }

  // Dedup supaya penghitungan dan daftar yang dicatat tidak kembar.
  const ids = [...new Set(raw)]

  // Hanya entri yang benar-benar ada yang dihapus, jadi `deleted` bisa lebih
  // kecil dari `ids` bila ada id kedaluwarsa (mis. sudah terhapus di tab lain).
  const deleted = await prisma.$transaction(async (tx) => {
    const found = await tx.activityLog.findMany({
      where: { id: { in: ids } },
      select: { id: true, eventId: true },
    })
    if (found.length === 0) return 0

    const res = await tx.activityLog.deleteMany({ where: { id: { in: found.map((f) => f.id) } } })

    // Penghapusan jejak audit harus tetap tercatat — kalau tidak, hilang satu-
    // satunya bukti siapa yang menghapus apa.
    const eventIds = [...new Set(found.map((f) => f.eventId).filter((v): v is string => !!v))]
    await tx.activityLog.create({
      data: {
        eventId: eventIds.length === 1 ? eventIds[0] : null,
        userId: session.sub,
        action: 'log.delete',
        detail: {
          count: res.count,
          ids: found.map((f) => f.id),
        },
      },
    })
    return res.count
  })

  logger.warn('admin activity logs deleted', {
    by: session.username,
    requested: ids.length,
    deleted,
  })

  if (deleted === 0) {
    return NextResponse.json({ error: 'Entri riwayat tidak ditemukan.' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, deleted })
}
