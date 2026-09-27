/**
 * Kontrak data untuk tab scan crew (Daftar Nama & Peta Kursi).
 * Nama field di sini WAJIB sama dengan yang dipakai components/crew/roster.tsx
 * dan components/seat-grid.tsx: status kehadiran dikirim sebagai `present`.
 */

export type CrewSeat = {
  seat: string | null
  order: number
  name: string
  present: boolean
}

type PesertaSeat = {
  seat: string | null
  order: number
  name: string
  scannedAt: Date | null
}

/** Urutkan sesuai nomor kursi (numerik dulu), fallback nama kursi. */
export function sortSeatsByNumber<T extends { seat: string | null; order: number }>(list: T[]): T[] {
  return [...list].sort((x, y) => {
    const xs = Number.parseInt(x.seat ?? '', 10)
    const ys = Number.parseInt(y.seat ?? '', 10)
    if (!Number.isNaN(xs) && !Number.isNaN(ys)) return xs - ys
    return (x.seat ?? '').localeCompare(y.seat ?? '')
  })
}

/** Kehadiran ikut dari `scannedAt` yang sama dengan panel admin, siapa pun yang mencatatnya. */
export function mapCrewSeats(list: PesertaSeat[]): CrewSeat[] {
  return sortSeatsByNumber(list).map((p) => ({
    seat: p.seat,
    order: p.order,
    name: p.name,
    present: p.scannedAt !== null,
  }))
}

export function countPresent(list: PesertaSeat[]): number {
  return list.filter((p) => p.scannedAt !== null).length
}
