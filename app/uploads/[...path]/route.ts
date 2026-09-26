import { createReadStream } from 'fs'
import { open, stat } from 'fs/promises'
import { resolve, sep } from 'path'
import { Readable } from 'stream'

/**
 * Menyajikan file yang diunggah lewat admin.
 *
 * Next.js hanya melayani `public/` secara otomatis, sedangkan
 * `POST /api/admin/events/[id]/image` menulis ke `uploads/` di root project.
 * Tanpa route ini, URL `/uploads/events/<nama>` balas 404 padahal filenya ada,
 * jadi cover event tidak pernah tampil. Folder `uploads/` sengaja tidak
 * diletakkan di `public/` supaya tidak ikut ter-*bundle* saat build dan tetap
 * diabaikan oleh git.
 */

export const dynamic = 'force-dynamic'

const ROOT = resolve(process.cwd(), 'uploads')

// Hanya format yang boleh diunggah oleh route image. Daftar ini sekaligus
// membatasi apa yang boleh dibaca lewat URL publik ini.
const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function contentType(filename: string): string | null {
  const dot = filename.lastIndexOf('.')
  if (dot < 0) return null
  return CONTENT_TYPES[filename.slice(dot).toLowerCase()] ?? null
}

/**
 * Cocokkan isi file dengan ekstensinya. `POST .../image` hanya memercayai
 * `file.type` yang dikirim browser, dan itu dikendalikan klien, jadi nama
 * `.png` belum tentu berisi gambar. Tanpa cek ini, berkas apa pun yang
 * kebetulan mendarat di `uploads/` akan bisa diunduh lewat URL publik ini.
 */
function isRealImage(head: Buffer, type: string): boolean {
  if (type === 'image/png') {
    return head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  if (type === 'image/jpeg') {
    return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
  }
  if (type === 'image/webp') {
    return (
      head.length >= 12 &&
      head.subarray(0, 4).toString('ascii') === 'RIFF' &&
      head.subarray(8, 12).toString('ascii') === 'WEBP'
    )
  }
  return false
}

type Params = { params: Promise<{ path: string[] }> }

export async function GET(_request: Request, { params }: Params) {
  const { path: segments } = await params

  const notFound = () => new Response('Not found', { status: 404 })

  if (!Array.isArray(segments) || segments.length === 0) return notFound()

  // Tolak segmen yang bisa keluar dari ROOT, sebelum path-nya dirakit.
  for (const segment of segments) {
    if (
      !segment ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('\0') ||
      segment.includes('/') ||
      segment.includes('\\')
    ) {
      return notFound()
    }
  }

  const type = contentType(segments[segments.length - 1])
  if (!type) return notFound()

  const target = resolve(ROOT, ...segments)
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return notFound()

  let info
  try {
    info = await stat(target)
  } catch {
    return notFound()
  }
  if (!info.isFile()) return notFound()

  const handle = await open(target, 'r')
  try {
    const head = Buffer.alloc(12)
    const { bytesRead } = await handle.read(head, 0, 12, 0)
    if (!isRealImage(head.subarray(0, bytesRead), type)) return notFound()
  } finally {
    await handle.close()
  }

  const stream = Readable.toWeb(createReadStream(target)) as ReadableStream<Uint8Array>

  return new Response(stream, {
    headers: {
      'Content-Type': type,
      'Content-Length': String(info.size),
      // Nama file berupa UUID yang tidak pernah dipakai ulang, jadi aman
      // di-cache lama: begitu gambar diganti, URL-nya juga sudah berganti.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  })
}
