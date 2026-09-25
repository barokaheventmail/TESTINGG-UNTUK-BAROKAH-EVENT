import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkbook, parseDate } from '../lib/excel'
import { encodeToken, decodeToken } from '../lib/scan'

const HEADERS = ['No', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'No Telp/Hp', 'No Kursi', 'No Kamar', 'No VW']

function makeBuffer(sheets: { name: string; rows: (string | number)[][] }[]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([HEADERS, ...sheet.rows]), sheet.name)
  }
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as ArrayBuffer
}

function makeBufferFull(sheets: { name: string; aoa: (string | number)[][] }[]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet.aoa), sheet.name)
  }
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as ArrayBuffer
}

function ymd(d: Date | null): string | null {
  if (!d) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

describe('parseExcel', () => {
  it('memetakan kolom dan men-disable baris tanpa nama', () => {
    const buf = makeBuffer([
      {
        name: 'Bus 1',
        rows: [
          [1, 'Ahmad Fauzi', 'Sukabumi', '12/03/1998', '085812345678', 'A1', '101', 'VW-01'],
          [2, 'Siti Rahmawati', 'Bandung', '05/11/2000', '085812345679', 'A2', '102', 'VW-01'],
          [3, '', 'kosong', '', '', '', '', ''],
        ],
      },
    ])
    const result = parseWorkbook(buf)
    expect(result.buses).toHaveLength(1)
    expect(result.buses[0].name).toBe('Bus 1')
    expect(result.buses[0].participants).toHaveLength(2)
    expect(result.skipped).toBe(1)
    const ahmad = result.buses[0].participants[0]
    expect(ahmad.name).toBe('Ahmad Fauzi')
    expect(ahmad.phone).toBe('085812345678')
    expect(ahmad.seat).toBe('A1')
    expect(ahmad.vw).toBe('VW-01')
    expect(ahmad.birthPlace).toBe('Sukabumi')
    expect(ahmad.birthDate && ymd(ahmad.birthDate)).toBe('1998-03-12')
    expect(ahmad.birthDate?.getDate()).toBe(12)
  })

  it('tiap sheet jadi 1 bus', () => {
    const buf = makeBuffer([
      { name: 'Bus 1', rows: [[1, 'A', 'x', '', '', '', '', '']] },
      { name: 'Bus 2', rows: [[1, 'B', 'x', '', '', '', '', '']] },
    ])
    const result = parseWorkbook(buf)
    expect(result.buses.map((b) => b.name)).toEqual(['Bus 1', 'Bus 2'])
    expect(result.total).toBe(2)
  })

  it('mendeteksi header di tengah sheet (file ber-blok judul) & mengabaikan kolom CATATAN', () => {
    const buf = makeBufferFull([
      {
        name: 'Bus 1',
        aoa: [
          ['DATA PESERTA'],
          [''],
          ['PT.COMBIPHAR'],
          [...HEADERS, 'CATATAN'],
          [1, 'Farisa Hilmi', 'Jakarta', '12/03/1998', '085800000001', '1', '101', 'VW-01', ''],
          [2, 'Ardian', 'Bandung', '05/11/2000', '085800000002', '2', '102', 'VW-01', ''],
          [3, '', '', '', '', '', '', '', 'pindah'],
          ['CATATAN:'],
          ['x', '', '', '', '', '', '', '', ''],
        ],
      },
    ])
    const result = parseWorkbook(buf)
    expect(result.buses).toHaveLength(1)
    expect(result.buses[0].participants).toHaveLength(2)
    expect(result.skipped).toBe(3)
    const farisa = result.buses[0].participants[0]
    expect(farisa.name).toBe('Farisa Hilmi')
    expect(farisa.order).toBe(1)
    expect(farisa.phone).toBe('085800000001')
    expect(farisa.birthPlace).toBe('Jakarta')
    expect(farisa.birthDate && ymd(farisa.birthDate)).toBe('1998-03-12')
    expect(result.buses[0].participants[1].order).toBe(2)
  })

  it('header tetap terdeteksi walau ada kolom kosong sebelum No', () => {
    const buf = makeBufferFull([
      {
        name: 'Bus A',
        aoa: [
          ['', ...HEADERS],
          ['', 1, 'Zainal', 'Sukabumi', '', '085700000001', '1', '201', 'VW-02'],
        ],
      },
    ])
    const result = parseWorkbook(buf)
    expect(result.total).toBe(1)
    expect(result.buses[0].participants[0].name).toBe('Zainal')
    expect(result.buses[0].participants[0].phone).toBe('085700000001')
  })
})

describe('parseDate', () => {
  it('mendukung dd/mm/yyyy dengan 2 digit tahun dinormalisasi', () => {
    expect(ymd(parseDate('12/03/1998'))).toBe('1998-03-12')
    expect(ymd(parseDate('01-01-98'))).toBe('1998-01-01')
    expect(ymd(parseDate('5/5/30'))).toBe('2030-05-05')
  })
  it('mendukung ISO dan mengembalikan null untuk input tidak valid', () => {
    expect(ymd(parseDate('2026-10-12'))).toBe('2026-10-12')
    expect(parseDate('gibberish')).toBeNull()
    expect(parseDate('')).toBeNull()
  })
})

describe('qr token', () => {
  const token = 'tok123abc'
  it('encode/decode membungkus & membaca ulang dengan prefiks', () => {
    const payload = encodeToken(token)
    expect(payload.startsWith('BTHT:')).toBe(true)
    expect(decodeToken(payload)).toBe(token)
  })
  it('decode menerima token polos dan URL /tiket/<token>', () => {
    expect(decodeToken(token)).toBe(token)
    expect(decodeToken('https://site.example/tiket/tok123abc')).toBe(token)
    expect(decodeToken('https://site.example/tiket/tok123abc?x=1')).toBe(token)
  })
  it('decode menolak string kosong', () => {
    expect(decodeToken('')).toBeNull()
    expect(decodeToken('   ')).toBeNull()
  })
})