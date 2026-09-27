import { describe, expect, it } from 'vitest'
import { countPresent, mapCrewSeats, sortSeatsByNumber, type CrewSeat } from './crew-seats'

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
