export type SeatLayout = { rows: number; cols: number; cells: number[][] }

export const SEAT_MIN = 1
export const SEAT_MAX = 24

type SeatLayoutSource = {
  seatRows?: number | null
  seatCols?: number | null
  seatLayout?: string | null
}

function parseCells(raw: unknown, rows: number, cols: number): number[][] {
  const cells: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols; c++) {
      const value = Array.isArray(raw) ? (raw as unknown[][])[r]?.[c] : undefined
      row.push(value === 1 ? 1 : 0)
    }
    cells.push(row)
  }
  return cells
}

export function parseSeatLayout(bus: SeatLayoutSource): SeatLayout {
  const rows = Number.isFinite(Number(bus.seatRows)) ? Math.max(0, Math.floor(Number(bus.seatRows))) : 0
  const cols = Number.isFinite(Number(bus.seatCols)) ? Math.max(0, Math.floor(Number(bus.seatCols))) : 0
  if (rows === 0 || cols === 0) return { rows: 0, cols: 0, cells: [] }
  let raw: unknown = null
  try {
    raw = bus.seatLayout ? JSON.parse(bus.seatLayout) : null
  } catch {
    raw = null
  }
  if (!Array.isArray(raw)) {
    return { rows: 0, cols: 0, cells: [] }
  }
  return { rows, cols, cells: parseCells(raw, rows, cols) }
}

export function seatNumberMatrix(rows: number, cols: number, cells: number[][]): (number | null)[][] {
  const matrix: (number | null)[][] = []
  let n = 1
  for (let r = 0; r < rows; r++) {
    const row: (number | null)[] = []
    for (let c = 0; c < cols; c++) {
      const active = cells[r]?.[c] === 1
      row.push(active ? n++ : null)
    }
    matrix.push(row)
  }
  return matrix
}

export function seatCount(cells: number[][]): number {
  return cells.reduce((acc, row) => acc + row.filter((v) => v === 1).length, 0)
}

export function serializeSeatLayout(rows: number, cols: number, cells: number[][]): string {
  return JSON.stringify(cells)
}

export function validateSeatShape(rows: unknown, cols: unknown, layout: unknown): { rows: number; cols: number; cells: number[][]; error?: string } {
  const r = Math.floor(Number(rows))
  const c = Math.floor(Number(cols))
  if (!Number.isFinite(r) || !Number.isFinite(c) || r < SEAT_MIN || r > SEAT_MAX || c < SEAT_MIN || c > SEAT_MAX) {
    return { rows: 0, cols: 0, cells: [], error: `Baris & kolom harus antara ${SEAT_MIN} sampai ${SEAT_MAX}.` }
  }
  if (!Array.isArray(layout) || layout.length !== r) {
    return { rows: 0, cols: 0, cells: [], error: 'Layout kursi tidak valid.' }
  }
  const cells: number[][] = []
  for (const row of layout as unknown[]) {
    if (!Array.isArray(row) || row.length !== c) {
      return { rows: 0, cols: 0, cells: [], error: 'Layout kursi tidak valid.' }
    }
    cells.push((row as unknown[]).map((v) => (v === 1 ? 1 : 0)))
  }
  return { rows: r, cols: c, cells }
}