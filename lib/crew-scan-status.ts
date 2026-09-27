/**
 * Label & warna badge status scan untuk Riwayat crew.
 *
 * ScanLog punya tiga status nyata:
 * - `attended`  : peserta baru ditandai hadir oleh crew/admin
 * - `already`   : peserta sudah hadir sebelumnya (scan ulang, tidak ada perubahan)
 * - `unattended`: Kehadiran dicabut oleh admin
 *
 * Sebelumnya status selain `attended` semuanya dilabeli "Sudah hadir",
 * sehingga `unattended` tampil seolah-olah peserta masih hadir.
 */

export type ScanStatusUi = {
  label: string
  badgeClass: string
}

const DEFAULT_SCAN_STATUS: ScanStatusUi = {
  label: 'Riwayat',
  badgeClass: 'bg-[#f1f3f5] text-[#657080]',
}

export const SCAN_STATUS_UI: Record<string, ScanStatusUi> = {
  attended: { label: 'Hadir', badgeClass: 'bg-[#e6f4ea] text-[#2ca84a]' },
  already: { label: 'Sudah hadir', badgeClass: 'bg-[#fff7e0] text-[#b98a12]' },
  unattended: { label: 'Kehadiran dicabut', badgeClass: 'bg-[#f1f3f5] text-[#657080]' },
}

export function scanStatusUi(status: string): ScanStatusUi {
  return SCAN_STATUS_UI[status] ?? DEFAULT_SCAN_STATUS
}
