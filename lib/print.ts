/**
 * Helper label untuk kartu QR peserta.
 *
 * `vw` berasal dari kolom "No VW" di Excel dan isinya sudah sering ikut
 * prefixed ("VW 044"), sementara label di template menuliskannya sebagai
 * `VW {vw}`. Kalau dua-duanya dipakai apa adanya, kartunya tercetak
 * "VW VW 044".
 */
export function vwLabel(vw: string | null | undefined): string {
  const raw = (vw ?? '').trim()
  if (!raw) return ''
  return /^(vw)\b/i.test(raw) ? raw.toUpperCase() : `VW ${raw}`
}

/**
 * Baris meta di bawah nama pada kartu QR: "No.1 · Kursi 1 · VW 044".
 * Bagian yang kosong dilewati supaya tidak pernah ada separator menggantung.
 */
export function metaLine(input: { order: number; seat?: string | null; vw?: string | null }): string {
  const parts = [`No.${input.order}`]
  const seat = (input.seat ?? '').trim()
  if (seat) parts.push(`Kursi ${seat}`)
  const vw = vwLabel(input.vw)
  if (vw) parts.push(vw)
  return parts.join(' · ')
}

/**
 * Mengelompokkan item menjadi potongan berukuran tetap untuk dicetak: dua
 * kartu QR per satu halaman A5. Sisa yang ganjil tetap jadi potongan terakhir
 * (halaman penutup) — tidak diisi kartu palsu supaya pemotong kertas rapi.
 */
export function chunkPairs<T>(items: readonly T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += 2) out.push(items.slice(i, i + 2))
  return out
}
