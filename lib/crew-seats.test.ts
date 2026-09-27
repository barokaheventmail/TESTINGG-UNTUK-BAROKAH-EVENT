import { describe, expect, it } from 'vitest'
import {
  CREW_VISIBLE_EVENT_STATUS,
  countPresent,
  isCrewVisibleEvent,
  mapCrewSeats,
  sortSeatsByNumber,
  unmappedSeats,
  type CrewSeat,
} from './crew-seats'

const p = (order: number, name: string, seat: string | null, hadir: boolean) => ({
  order,
  name,
  seat,
  scannedAt: hadir ? new Date(2026, 8, 27, 8, 0) : null,
})

describe('kontrak data tab crew', () => {
  it('kursi mengirim status sebagai `present` (bukan `filled`)', () => {
    const hasil = mapCrewSeats([p(1, 'Ahmad', '1', true), p(2, 'Budi', '2', false)])
    expect(Object.keys(hasil[0]).sort()).toEqual(['name', 'order', 'present', 'seat'])
    // regression: UI pernah membaca s.filled sehingga selalu "Belum"
    expect((hasil[0] as unknown as Record<string, unknown>).filled).toBeUndefined()
  })

  it('presence mengikuti scannedAt yang sama dengan panel admin', () => {
    const hasil = mapCrewSeats([p(1, 'Ahmad', '1', true), p(2, 'Budi', '2', false)])
    expect(hasil.map((s) => s.present)).toEqual([true, false])
  })

  it('cocok dengan tipe yang dipakai komponen (CrewSeat)', () => {
    const hasil: CrewSeat[] = mapCrewSeats([p(1, 'Ahmad', null, false)])
    expect(hasil[0]).toEqual({ seat: null, order: 1, name: 'Ahmad', present: false })
  })

  it('urutkan berdasarkan nomor kursi; yang belum punya kursi tampil lebih dulu', () => {
    const hasil = mapCrewSeats([p(1, 'A', null, false), p(2, 'B', '10', false), p(3, 'C', '2', false)])
    expect(hasil.map((s) => s.name)).toEqual(['A', 'C', 'B'])
  })

  it('sortSeatsByNumber tidak mengubah array asal', () => {
    const asli = [p(2, 'B', '2', false), p(1, 'A', '1', false)]
    sortSeatsByNumber(asli)
    expect(asli.map((s) => s.name)).toEqual(['B', 'A'])
  })

  it('countPresent = banyak yang punya scannedAt', () => {
    expect(countPresent([p(1, 'A', '1', true), p(2, 'B', '2', false), p(3, 'C', '3', true)])).toBe(2)
  })
})

describe('peserta yang tidak bisa digambar di Peta Kursi', () => {
  const seat = (name: string, s: string | null, hadir: boolean) => ({ seat: s, order: 0, name, present: hadir })
  const bus2x2 = { seatRows: 2, seatCols: 2, seatLayout: '[[1,1],[1,1]]' }
  const tanpaLayout = { seatRows: 0, seatCols: 0, seatLayout: null }

  it('menampilkan peserta yang nomornya ada di layout sebagai terpetakan', () => {
    const hasil = unmappedSeats({ ...bus2x2, seats: [seat('Ahmad', '1', true), seat('Budi', '3', true)] })
    expect(hasil).toEqual([])
  })

  it('menandai kursi di luar layout (regression F5: kursi 5 di layout 2x2)', () => {
    const hasil = unmappedSeats({ ...bus2x2, seats: [seat('Ahmad', '1', true), seat('Rini', '5', true)] })
    expect(hasil.map((s) => s.name)).toEqual(['Rini'])
  })

  it('menandai kursi non-numerik dan peserta tanpa nomor kursi', () => {
    const hasil = unmappedSeats({ ...bus2x2, seats: [seat('A', 'VIP', true), seat('B', null, true)] })
    expect(hasil.map((s) => s.name).sort()).toEqual(['A', 'B'])
  })

  it('mengabaikan kursi kosong yang memang tidak ada di layout', () => {
    const hasil = unmappedSeats({ ...bus2x2, seats: [seat('Ahmad', '1', true), seat('Budi', '9', false)] })
    expect(hasil).toEqual([])
  })

  it('armada tanpa layout => semua peserta hadir tidak tergambar', () => {
    const hasil = unmappedSeats({ ...tanpaLayout, seats: [seat('A', '1', true), seat('B', '2', false)] })
    expect(hasil.map((s) => s.name)).toEqual(['A'])
  })

  it('mengurutkan nomor kursi numerik lebih dulu', () => {
    const hasil = unmappedSeats({ ...bus2x2, seats: [seat('VIP', 'VIP', true), seat('Rini', '7', true)] })
    expect(hasil.map((s) => s.seat)).toEqual(['7', 'VIP'])
  })
})

describe('event yang boleh dibaca crew', () => {
  it('membaca event ACTIVE dan CLOSED (regression F2: data closed hilang)', () => {
    expect(isCrewVisibleEvent('ACTIVE')).toBe(true)
    expect(isCrewVisibleEvent('CLOSED')).toBe(true)
  })

  it('tetap menyembunyikan event DRAFT', () => {
    expect(isCrewVisibleEvent('DRAFT')).toBe(false)
  })

  it('daftar status Prisma konsisten dengan helper', () => {
    expect(CREW_VISIBLE_EVENT_STATUS.every(isCrewVisibleEvent)).toBe(true)
    expect(CREW_VISIBLE_EVENT_STATUS).not.toContain('DRAFT')
  })
})
