export type ItineraryRow = { time: string; agenda: string; keterangan: string; day: number }

function mapRow(item: unknown): ItineraryRow {
  const rec = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>
  const time = typeof rec.time === 'string' ? rec.time.trim() : ''
  // Bentuk lama `{time, desc}` -> agenda (tanpa keterangan).
  const agenda = typeof rec.agenda === 'string' ? rec.agenda.trim() : typeof rec.desc === 'string' ? rec.desc.trim() : ''
  const keterangan = typeof rec.keterangan === 'string' ? rec.keterangan.trim() : ''
  const rawDay = Number(rec.day)
  const day = Number.isFinite(rawDay) ? Math.max(1, Math.floor(rawDay)) : 1
  return { time, agenda, keterangan, day }
}

export function parseItinerary(raw: string | null | undefined): ItineraryRow[] {
  try {
    const value = raw ? JSON.parse(raw) : []
    if (!Array.isArray(value)) return []
    return value.map(mapRow).filter((row) => row.time && row.agenda)
  } catch {
    return []
  }
}

export function serializeItinerary(rows: ItineraryRow[]): string {
  return JSON.stringify(
    rows
      .map((row) => ({
        day: Math.max(1, Math.floor(Number(row.day) || 1)),
        time: row.time.trim(),
        agenda: row.agenda.trim(),
        keterangan: row.keterangan.trim(),
      }))
      .filter((row) => row.time && row.agenda),
  )
}

export function maxDay(rows: ItineraryRow[]): number {
  return rows.reduce((max, row) => Math.max(max, row.day), 1)
}

export function groupItineraryByDay(rows: ItineraryRow[]): { day: number; rows: ItineraryRow[] }[] {
  const map = new Map<number, ItineraryRow[]>()
  for (const row of rows) {
    const list = map.get(row.day) ?? []
    list.push(row)
    map.set(row.day, list)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, dayRows]) => ({ day, rows: dayRows }))
}