import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { requireAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await requireAdminSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const headers = ['No', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'No Telp/Hp', 'No Kursi', 'No Kamar', 'No VW']
  const contoh = [
    [1, 'Ahmad Fauzi', 'Sukabumi', '12/03/1998', '085812345678', 'A1', '101', 'VW-01'],
    [2, 'Siti Rahmawati', 'Bandung', '05/11/2000', '085812345679', 'A2', '102', 'VW-01'],
  ]
  const contoh2 = [
    [1, 'Nurhaliza Putri', 'Bogor', '30/01/1999', '085812345681', 'B1', '201', 'VW-02'],
    [2, 'Agus Setiawan', 'Depok', '17/09/2001', '085812345682', 'B2', '202', 'VW-02'],
  ]

  const wb = XLSX.utils.book_new()
  const mk = (rows: (string | number)[][]) =>
    XLSX.utils.aoa_to_sheet([headers, ...rows])
  XLSX.utils.book_append_sheet(wb, mk(contoh), 'Bus 1')
  XLSX.utils.book_append_sheet(wb, mk(contoh2), 'Bus 2')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as ArrayBuffer

  return new NextResponse(Buffer.from(buf as unknown as ArrayBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-peserta-barokah.xlsx"',
    },
  })
}