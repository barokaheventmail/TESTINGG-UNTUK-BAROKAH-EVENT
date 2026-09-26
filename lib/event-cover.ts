const COVER_PHOTOS = [
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1566559532224-6d65e9fc0f37?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1587651687979-77cf05d1b841?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1703769605314-18648cfc3428?auto=format&fit=crop&w=1000&q=75',
]

/**
 * Cover untuk kartu event: pakai gambar yang diunggah admin bila ada,
 * jika belum ada pakai foto cadangan dari daftar di atas. Pilihan foto dibuat dari
 * hash id event supaya hasilnya stabil di setiap render (aman untuk SSR) dan
 * tiap event mendapat foto yang berbeda.
 */
export function eventCoverUrl(id: string, imageUrl?: string | null): string {
  const uploaded = imageUrl?.trim()
  if (uploaded) return uploaded

  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return COVER_PHOTOS[hash % COVER_PHOTOS.length]
}
