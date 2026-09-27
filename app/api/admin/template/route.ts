import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth'
import { buildTemplateWorkbook } from '@/lib/excel'

export async function GET() {
  const session = await requireAdminSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Workbook dibangun di lib/excel.ts supaya sama persis dengan header yang
  // dibaca parser dan bisa diuji (lihat lib/core.test.ts).
  const buf = buildTemplateWorkbook()

  return new NextResponse(Buffer.from(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-peserta-barokah.xlsx"',
    },
  })
}
