const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function formatTanggalPendek(d: Date): string {
  return `${d.getDate()} ${months[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

export function formatTanggal(d: Date): string {
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function toISOInput(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export function formatWaktuLengkap(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${months[d.getMonth()].slice(0, 3)} ${d.getFullYear()} · ${h}:${m} WIB`
}