export type ItineraryRow = { time: string; agenda: string; keterangan: string }

function mapRow(item: unknown): ItineraryRow {
  const rec = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>
  const time = typeof rec.time === 'string' ? rec.time.trim() : ''
  // Bentuk lama `{time, desc}` -> agenda (tanpa keterangan).
  const agenda = typeof rec.agenda === 'string' ? rec.agenda.trim() : typeof rec.desc === 'string' ? rec.desc.trim() : ''
  const keterangan = typeof rec.keterangan === 'string' ? rec.keterangan.trim() : ''
  return { time, agenda, keterangan }
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
      .map((row) => ({ time: row.time.trim(), agenda: row.agenda.trim(), keterangan: row.keterangan.trim() }))
      .filter((row) => row.time && row.agenda),
  )
}