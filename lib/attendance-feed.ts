/**
 * Penanda "sinkron ulang" untuk feed kehadiran publik.
 *
 * Reset Kehadiran admin sengaja TIDAK menghapus ScanLog (itu jejak audit),
 * jadi halaman publik tidak bisa mencari tahu bahwa semua kursi dikosongkan
 * hanya dari `scanLog`. Karena itu reset dicatat di `activityLog` dengan aksi
 * `attendance.reset`, dan endpoint kehadiran memberi tahu klien lewat
 * flag `reset` supaya klien mengosongkan penanda kursi yang terisi.
 *
 * Mengembalikan `seq` yang harus dipakai klien untuk polling berikutnya.
 */

export type AttendanceFeedInput = {
  /** Seq terakhir yang dikirim klien (null = pemuatan awal). */
  since: Date | null
  /** Waktu scanLog terakhir pada event ini. */
  latestLogAt: Date | null
  /** Waktu reset kehadiran terakhir pada event ini. */
  latestResetAt: Date | null
}

export type AttendanceFeed = {
  /** Seq berikutnya, atau null bila belum ada aktivitas sama sekali. */
  seq: string | null
  /** True bila klien perlu mengosongkan seluruh penanda kursi. */
  reset: boolean
}

function maxDate(a: Date | null, b: Date | null): Date | null {
  if (!a) return b
  if (!b) return a
  return a.getTime() >= b.getTime() ? a : b
}

export function resolveAttendanceFeed({ since, latestLogAt, latestResetAt }: AttendanceFeedInput): AttendanceFeed {
  const reset = since !== null && latestResetAt !== null && latestResetAt.getTime() > since.getTime()

  // Saat reset baru terjadi, seq dipatok ke waktu reset dan delta dikosongkan:
  // klien mengosongkan semua kursi, lalu tick berikutnya menerima scan
  // yang terjadi SESUDAH reset (bukan scan lama sebelum reset).
  const seq = reset ? latestResetAt : maxDate(latestLogAt, latestResetAt)

  return { seq: seq ? seq.toISOString() : null, reset }
}

/** Parse `since` dari query string; nilai rusak dianggap tidak ada. */
export function parseSince(raw: string | null): Date | null {
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
