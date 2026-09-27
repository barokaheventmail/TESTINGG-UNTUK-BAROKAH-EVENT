import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkbook, parseDate } from '../lib/excel'
import {
  FACILITY_MAX_NAME,
  FACILITY_MAX_NOTE,
  FACILITY_MAX_ITEMS,
  FACILITY_ICON_GROUPS,
  FACILITY_ICON_LABELS,
  FACILITY_ICON_OPTIONS,
  parseFacilities,
  serializeFacilities,
  validateFacilities,
} from '../lib/facilities'
import { FACILITY_ICONS } from '../components/facility-icon'
import { encodeToken, decodeToken, ticketCodeFromToken } from '../lib/scan'
import { formatLogDetail } from '../lib/log-labels'

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
  it('ticketCodeFromToken menghasilkan kode tiket huruf besar persis', () => {
    const date = new Date('2026-09-17T00:00:00.000Z')
    expect(ticketCodeFromToken(date, 'cmuh1z9zw0008ifaat10qud8e')).toBe('BTH-26-QUD8E')
    expect(ticketCodeFromToken(date, 'cmu0000l3prf')).toBe('BTH-26-L3PRF')
  })
})

describe('fasilitas', () => {
  it('parseFacilities membaca JSON dan membuang item tanpa nama', () => {
    const raw = JSON.stringify([
      { icon: 'snowflake', name: 'AC', note: 'Pendingin kabin' },
      { icon: 'wifi', name: '   ', note: 'kosong' },
      { icon: 'usb-plug', name: 'USB', note: '' },
    ])
    expect(parseFacilities({ facilities: raw })).toEqual([
      { icon: 'snowflake', name: 'AC', note: 'Pendingin kabin' },
      { icon: 'usb-plug', name: 'USB', note: '' },
    ])
  })
  it('parseFacilities aman untuk null, JSON rusak & ikon asing', () => {
    expect(parseFacilities({ facilities: null })).toEqual([])
    expect(parseFacilities({ facilities: '{bukan json' })).toEqual([])
    expect(parseFacilities('{"a":1}')).toEqual([])
    expect(parseFacilities({ facilities: JSON.stringify([{ icon: 'nope', name: 'WiFi' }]) })).toEqual([
      { icon: 'armchair', name: 'WiFi', note: '' },
    ])
  })
  it('serializeFacilities mengembalikan null saat kosong', () => {
    expect(serializeFacilities([])).toBeNull()
    const json = serializeFacilities([{ icon: 'wifi', name: 'WiFi', note: 'Gratis' }])
    expect(parseFacilities({ facilities: json })).toEqual([{ icon: 'wifi', name: 'WiFi', note: 'Gratis' }])
  })
  it('validateFacilities menolak ikon tak dikenal & melebihi batas', () => {
    expect(validateFacilities([{ icon: 'nope', name: 'AC' }]).error).toBeTruthy()
    expect(validateFacilities([{ icon: 'wifi', name: 'x'.repeat(FACILITY_MAX_NAME + 1) }]).error).toBeTruthy()
    expect(validateFacilities([{ icon: 'wifi', name: 'WiFi', note: 'x'.repeat(FACILITY_MAX_NOTE + 1) }]).error).toBeTruthy()
    expect(validateFacilities('bukan array').error).toBeTruthy()
    const many = Array.from({ length: FACILITY_MAX_ITEMS + 1 }, (_, i) => ({ icon: 'wifi', name: `F${i}`, note: '' }))
    expect(validateFacilities(many).error).toBeTruthy()
  })
  it('validateFacilities membersihkan input dan mengabaikan baris kosong', () => {
    const res = validateFacilities([
      { icon: 'tv', name: ' TV ', note: ' Layar ' },
      { icon: 'wifi', name: '', note: 'tanpa nama' },
    ])
    expect(res.error).toBeUndefined()
    expect(res.items).toEqual([{ icon: 'tv', name: 'TV', note: 'Layar' }])
  })
  it('katalog ikon konsisten: tanpa duplikat, semua punya label & komponen', () => {
    const all = FACILITY_ICON_GROUPS.flatMap((g) => [...g.icons])
    expect(new Set(all).size).toBe(all.length)
    expect(FACILITY_ICON_OPTIONS).toEqual(all)
    expect(all.length).toBeGreaterThanOrEqual(50)
    for (const icon of all) {
      expect(FACILITY_ICON_LABELS[icon], `label ${icon}`).toBeTruthy()
      expect(FACILITY_ICONS[icon], `komponen ${icon}`).toBeTruthy()
    }
    for (const icon of Object.keys(FACILITY_ICONS)) {
      expect(FACILITY_ICON_OPTIONS, `katalog memuat ${icon}`).toContain(icon)
    }
    expect(FACILITY_ICON_OPTIONS).toContain('ellipsis')
  })
  it('validateFacilities menerima ikon baru & tetap menolak yang asing', () => {
    const res = validateFacilities([
      { icon: 'ellipsis', name: 'Lainnya', note: '' },
      { icon: 'bus-front', name: 'Armada', note: '' },
      { icon: 'plug-zap', name: 'Colokan cepat', note: '' },
    ])
    expect(res.error).toBeUndefined()
    expect(res.items.map((i) => i.icon)).toEqual(['ellipsis', 'bus-front', 'plug-zap'])
    expect(validateFacilities([{ icon: 'smart-tv', name: 'X' }]).error).toBeTruthy()
  })
})

describe('label log hapus massal', () => {
  it('hapus kursi & fasilitas per armada tetap menyebut nama bus', () => {
    expect(formatLogDetail('bus.seatLayoutClear', { name: 'Bus 1' })).toBe('Layout kursi Bus 1 dihapus')
    expect(formatLogDetail('bus.facilitiesClear', { name: 'Bus 1' })).toBe('Fasilitas Bus 1 dihapus')
  })
  it('scope all menampilkan jumlah armada, bukan ???', () => {
    expect(formatLogDetail('bus.seatLayoutClear', { scope: 'all', buses: 45 })).toBe(
      'Layout kursi dihapus di 45 armada',
    )
    expect(formatLogDetail('bus.facilitiesClear', { scope: 'all', buses: 2 })).toBe('Fasilitas dihapus di 2 armada')
    expect(formatLogDetail('bus.seatLayoutClear', { scope: 'all' })).toBe('Layout kursi dihapus di ??? armada')
  })
})