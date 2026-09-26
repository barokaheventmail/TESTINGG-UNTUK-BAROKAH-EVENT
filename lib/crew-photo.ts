import { mkdir, rm, writeFile } from 'fs/promises'
import { join, resolve } from 'path'

const ALLOWED = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])
export const MAX_CREW_PHOTO_BYTES = 5 * 1024 * 1024

const UPLOAD_REL = join('uploads', 'crew')
export const UPLOAD_URL_PREFIX = '/uploads/crew/'

function uploadPath(): string {
  return resolve(process.cwd(), UPLOAD_REL)
}

/** Hanya hapus file yang benar-benar milik folder foto crew. */
export async function removeCrewPhoto(url: string | null): Promise<void> {
  if (!url || !url.startsWith(UPLOAD_URL_PREFIX)) return
  const filename = url.slice(UPLOAD_URL_PREFIX.length)
  if (!filename || filename.includes('/') || filename.includes('..')) return
  await rm(join(uploadPath(), filename), { force: true })
}

/**
 * Validasi + simpan file foto crew ke `uploads/crew/`.
 * Mengembalikan `{ url }` atau `{ error }`; pembersihan file lama/batal
 * sepenuhnya urusan pemanggil agar rapi dengan transaksi DB.
 */
export async function saveCrewPhoto(file: File): Promise<{ url: string } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Pilih file gambar terlebih dahulu.' }
  }
  if (file.size > MAX_CREW_PHOTO_BYTES) {
    return { error: 'Ukuran file maksimal 5 MB.' }
  }
  const ext = ALLOWED.get(file.type)
  if (!ext) {
    return { error: 'Hanya mendukung gambar JPG, PNG, atau WebP.' }
  }

  const filename = `${crypto.randomUUID()}.${ext}`
  await mkdir(uploadPath(), { recursive: true })
  await writeFile(join(uploadPath(), filename), Buffer.from(await file.arrayBuffer()))

  return { url: `${UPLOAD_URL_PREFIX}${filename}` }
}