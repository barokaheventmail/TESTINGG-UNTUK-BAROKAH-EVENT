'use client'

import { useEffect, useState } from 'react'

const BANNERS = [
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1566559532224-6d65e9fc0f37?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1587651687979-77cf05d1b841?auto=format&fit=crop&w=1800&q=85',
  'https://images.unsplash.com/photo-1703769605314-18648cfc3428?auto=format&fit=crop&w=1800&q=85',
]

export function BannerSlideshow() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % BANNERS.length), 10000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {BANNERS.map((url, i) => (
        <div
          key={url}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(9,31,68,.82), rgba(9,31,68,.25)), url('${url}')`,
          }}
        />
      ))}
    </div>
  )
}