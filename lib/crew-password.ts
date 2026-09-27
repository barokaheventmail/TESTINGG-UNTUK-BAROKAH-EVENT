/**
 * Password crew sengaja dibuat deterministik: password = username + "1123".
 *
 * Konsekuensinya penting: admin (dan panel admin ini) bisa menghitung ulang
 * password kapan saja dari username, jadi tidak perlu ada kolom password
 * plaintext di database. Yang disimpan tetap hash bcrypt seperti biasa.
 *
 * Suffix yang diubah = semua password crew lama langsung tidak bisa ditebak
 * kembali, jadi hati-hati: pola ini harus stabil.
 */
export const CREW_PASSWORD_SUFFIX = '1123'

export function crewPassword(username: string): string {
  return `${username}${CREW_PASSWORD_SUFFIX}`
}
