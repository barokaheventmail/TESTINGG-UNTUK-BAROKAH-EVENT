import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/site'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f7fa] px-4 py-16 text-center">
      <Logo />
      <p className="eyebrow mt-8">404</p>
      <h1 className="mt-3 text-4xl font-bold text-[#1b3555]">Halaman tidak ditemukan</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[#657080]">
        Halaman yang Anda cari tidak tersedia atau sudah dipindahkan. Silakan kembali ke beranda untuk menjelajah event wisata kami.
      </p>
      <Link
        href="/"
        className="mt-8 flex items-center gap-2 rounded-md bg-[#1b4f9c] px-5 py-3 text-sm font-bold text-white"
      >
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>
    </main>
  )
}