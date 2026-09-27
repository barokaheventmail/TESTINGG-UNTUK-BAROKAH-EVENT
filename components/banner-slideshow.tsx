'use client'

import { useEffect, useState } from 'react'

// Gambar dioptimasi: ukuran lebih kecil (1200px), kualitas 75, format WebP otomatis via Next.js
const BANNERS = [
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1566559532224-6d65e9fc0f37?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1587651687979-77cf05d1b841?auto=format&fit=crop&w=1200&q=70',
]

export function BannerSlideshow() {
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState<boolean[]>(Array(BANNERS.length).fill(false))

  useEffect(() => {
    // Preload hanya gambar pertama saat mount
    const img = new Image()
    img.src = BANNERS[0]
    img.onload = () => setLoaded((prev) => { const next = [...prev]; next[0] = true; return next })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % BANNERS.length
        // Preload gambar berikutnya saat slide berganti
        const img = new Image()
        img.src = BANNERS[next]
        img.onload = () => setLoaded((prev) => { const n = [...prev]; n[next] = true; return n })
        return next
      })
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Warna fallback saat gambar belum load */}
      <div className="absolute inset-0 bg-[#091f44]" />
      {BANNERS.map((url, i) => (
        <div
          key={url}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            i === index && loaded[i] ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: loaded[i]
              ? `linear-gradient(90deg, rgba(9,31,68,.82), rgba(9,31,68,.25)), url('${url}')`
              : undefined,
          }}
        />
      ))}
    </div>
  )
}