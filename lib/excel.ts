import * as XLSX from 'xlsx'
import { z } from 'zod'

export type ExcelParticipant = {
  order: number
  name: string
  birthPlace?: string | null
  birthDate?: Date | null
  phone?: string | null
  seat?: string | null
  room?: string | null
  vw?: string | null
}

export type ExcelBus = {
  name: string
  participants: ExcelParticipant[]
}

export type ExcelParseResult = {
  buses: ExcelBus[]
  total: number
  skipped: number
}

type FieldKey = keyof Omit<ExcelParticipant, 'name'>
type FieldAssign = Partial<Record<FieldKey | 'name', number>>

const HEADER_MAP: Record<string, FieldKey | 'name' | 'skip'> = {
  no: 'order',
  'no.': 'order',
  nomor: 'order',
  'nama lengkap': 'name',
  nama: 'name',
  'nama peserta': 'name',
  'tempat lahir': 'birthPlace',
  'tanggal lahir': 'birthDate',
  'tgl lahir': 'birthDate',
  ttl: 'birthDate',
  'no telp/hp': 'phone',
  'no telp': 'phone',
  'no hp': 'phone',
  telp: 'phone',
  hp: 'phone',
  notelp: 'phone',
  'no kursi': 'seat',
  kursi: 'seat',
  'no kamar': 'room',
  kamar: 'room',
  'no vw': 'vw',
  vw: 'vw',
  bus: 'skip',
  bis: 'skip',
}

function normalizeHeader(raw: unknown): string {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, ' ')
}

function normalizeKey(raw: unknown): FieldKey | 'name' | 'skip' {
  const key = normalizeHeader(raw)
  if (!key) return 'skip'
  return HEADER_MAP[key] ?? 'skip'
}

/**
 * Mencari baris header di mana pun dalam sheet (file asli sering punya blok judul
 * di atasnya, mis. "DATA PESERTA" / nama rombongan). Baris dianggap header jika
 * memuat minimal "No" + "Nama" + minimal 1 kolom terpetakan lainnya.
 */
function detectHeader(rows: unknown[][]): { index: number; map: FieldAssign } | null {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const row = rows[i]
    const map: FieldAssign = {}
    let recognized = 0
    for (let c = 0; c < row.length; c++) {
      const key = normalizeKey(row[c])
      if (key === 'skip' || key in map) continue
      map[key] = c
      recognized++
    }
    if (map.name === undefined || map.order === undefined || recognized < 3) continue
    return { index: i, map }
  }
  return null
}

export function parseDate(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === '') return null
  if (raw instanceof Date) {
    const d = new Date(raw)
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(raw).trim()
  if (!s) return null

  // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
  if (dmy) {
    const day = +dmy[1]
    const month = +dmy[2]
    let year = +dmy[3]
    if (year < 100) year += year > 30 ? 1900 : 2000
    const d = new Date(year, month - 1, day)
    return isNaN(d.getTime()) ? null : d
  }

  // yyyy-mm-dd (ISO)
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    const d = new Date(+iso[1], +iso[2] - 1, +iso[3])
    return isNaN(d.getTime()) ? null : d
  }

  const fallback = new Date(s)
  return isNaN(fallback.getTime()) ? null : fallback
}

function cellText(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  return String(raw).trim()
}

function cellTextAt(row: unknown[], idx: number | undefined): string {
  if (idx === undefined || !Array.isArray(row)) return ''
  return cellText(row[idx])
}

export function parseWorkbook(buffer: ArrayBuffer): ExcelParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const result: ExcelParseResult = { buses: [], total: 0, skipped: 0 }

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils
      .sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: true, blankrows: false })
      .filter((row): row is unknown[] => Array.isArray(row))

    if (rows.length === 0) continue

    const detected = detectHeader(rows)
    if (!detected) continue
    const { index: headerIndex, map: fields } = detected

    const participants: ExcelParticipant[] = []
    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i]
      const name = cellTextAt(row, fields.name)
      if (!name) {
        result.skipped++
        continue
      }

      const orderRaw = cellTextAt(row, fields.order)
      const orderNum = parseInt(orderRaw.replace(/\D/g, ''), 10)

      const participant: ExcelParticipant = {
        order: isNaN(orderNum) ? participants.length + 1 : orderNum,
        name,
        birthPlace: cellTextAt(row, fields.birthPlace) || null,
        birthDate: fields.birthDate != null ? parseDate(row[fields.birthDate]) : null,
        phone: cellTextAt(row, fields.phone) || null,
        seat: cellTextAt(row, fields.seat) || null,
        room: cellTextAt(row, fields.room) || null,
        vw: cellTextAt(row, fields.vw) || null,
      }

      participants.push(participant)
    }

    if (participants.length > 0) {
      result.buses.push({ name: sheetName.trim(), participants })
      result.total += participants.length
    }
  }

  return result
}

export const eventSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  location: z.string().trim().default(''),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).default('ACTIVE'),
  note: z.string().trim().nullish(),
  panduanItinerary: z.string().trim().nullish(),
  crewName: z.string().trim().nullish(),
  crewPhone: z.string().trim().nullish(),
  crewPhotoUrl: z.string().trim().nullish(),
})

export const eventPatchSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi').optional(),
  date: z.string().min(1, 'Tanggal wajib diisi').optional(),
  location: z.string().trim().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
  note: z.string().trim().nullish(),
  panduanItinerary: z.string().trim().nullish(),
  crewName: z.string().trim().nullish(),
  crewPhone: z.string().trim().nullish(),
  crewPhotoUrl: z.string().trim().nullish(),
})