import type { Metadata } from 'next'
import { Check, Phone } from 'lucide-react'
import { BannerSlideshow } from '@/components/banner-slideshow'
import { Footer, Navbar, TrustStrip } from '@/components/site'
import { SearchTabs } from '@/components/search-tabs'
import { PackageCard } from '@/components/package-card'

export const metadata: Metadata = {
  title: 'Barokah Tour and Travel | Paket Wisata & Perjalanan dari Sukabumi',
  description:
    'Paket wisata domestik & mancanegara, study tour, persewaan transportasi wisata, dan tiket. Agen resmi Ancol dan mitra ASITA dari Sukabumi.',
  openGraph: {
    title: 'Barokah Tour and Travel | Jelajahi Indonesia',
    description: 'Rencanakan perjalanan nyaman dan berkesan bersama Barokah Tour and Travel dari Sukabumi.',
    type: 'website',
  },
}

const layanan = [
  'Tour Package Domestik dan Mancanegara',
  'Study Tour, Study Banding, Kunjungan Kerja, KKL, MICE, EO, atau WO',
  'Wisata Nusantara dan Mancanegara',
  'Persewaan Transportasi Wisata',
  'Transport Organizer',
  'Tiket Pesawat / Kereta Api',
  'Agen Resmi PT. Taman Impian Jaya Ancol',
]

const packages = [
  {
    title: 'Open Trip Ancol–Dufan',
    href: '/paket/open-trip-ancol-dufan',
    duration: '1 Hari',
    price: 'Rp 425.000',
    badge: 'Paling diminati',
    location: 'Jakarta',
    rating: '4.9',
    image:
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=80',
    keywords: ['ancol', 'dufan', 'jakarta'],
    highlights: ['Tiket masuk Dufan', 'Transportasi AC', 'Makan siang'],
  },
  {
    title: 'Open Trip Yogyakarta',
    href: '/paket/open-trip-yogyakarta',
    duration: '3D2N',
    price: 'Rp 1.450.000',
    badge: 'Pilihan keluarga',
    location: 'DI Yogyakarta',
    rating: '4.8',
    image:
      'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=900&q=80',
    keywords: ['yogyakarta', 'jogja', 'borobudur', 'malioboro'],
    highlights: ['Transportasi wisata', 'Hotel & sarapan', 'Wisata pilihan'],
  },
]

export default function Home() {
  return (
    <main>
      <section id="beranda" className="relative min-h-[650px] text-white">
        <BannerSlideshow />
        <Navbar />
        <div className="container-wide flex min-h-[650px] items-center pb-12 pt-28">
          <div className="max-w-2xl">
            <p className="animate-fade-up delay-1 eyebrow !text-[#f5b915]">Teman perjalanan keluarga Indonesia</p>
            <h1 className="animate-fade-up delay-2 mt-4 text-5xl font-bold leading-[1.08] md:text-7xl">
              Jelajahi Indonesia, <em className="font-serif italic font-normal text-[#f5b915]">lebih bermakna.</em>
            </h1>
            <p className="animate-fade-up delay-3 mt-5 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
              Rencanakan perjalanan yang nyaman dan berkesan bersama Barokah Tour and Travel dari Sukabumi.
            </p>
            <div className="animate-fade-up delay-4 relative z-50">
              <SearchTabs packages={packages} />
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />

      <section id="paket" className="container-wide py-20">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-2">Pilihan perjalanan</p>
          <h2 className="text-3xl font-bold text-[#1b3555] md:text-4xl">Paket Populer</h2>
          <p className="mt-3 leading-relaxed text-[#657080]">
            Temukan perjalanan yang sudah kami siapkan untuk menemani waktu terbaik Anda.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((item) => (
            <PackageCard key={item.title} item={item} />
          ))}
        </div>
      </section>

      <section id="tentang" className="relative overflow-hidden bg-[#edf5ef] py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse 90% 80% at 100% 0%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0) 78%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 70% at 0% 100%, rgba(44,168,74,0.14) 0%, rgba(44,168,74,0) 72%)' }}
        />
        <div className="container-wide relative grid gap-14 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <div>
              <p className="eyebrow mb-2">Tentang Kami</p>
              <h2 className="text-3xl font-bold leading-tight text-[#1b3555] md:text-4xl">
                Barokah Tour <span className="font-serif italic text-[#2ca84a]">&</span> Travel
              </h2>
            </div>
            <p className="leading-relaxed text-[#657080]">
              Barokah Tour & Travel adalah jasa pariwisata yang berada di bawah naungan PT. Bina Barokah Sejahtera dengan lisensi:
            </p>
            <p className="leading-relaxed text-[#657080]">
              Kami membantu perjalanan wisata, pendidikan, dan perusahaan dengan pelayanan yang amanah dan profesional.
            </p>
            <div className="relative overflow-hidden rounded-2xl border border-[#dce8e1] bg-white/90 p-7 shadow-[0_24px_60px_-32px_rgba(27,53,85,0.4)] backdrop-blur">
              <h3 className="flex items-center gap-3 text-lg font-bold text-[#1b3555]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5ef] text-[#2ca84a]">
                  <Check size={17} />
                </span>
                Lisensi & Data Resmi
              </h3>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed">
                <li className="flex items-start gap-3 text-[#44576d]"><Check size={15} className="mt-0.5 shrink-0 text-[#2ca84a]" /><span><strong className="font-semibold text-[#1b3555]">Penanggung jawab:</strong> Rizal Bahtiar, S.Psi.</span></li>
                <li className="flex items-start gap-3 text-[#44576d]"><Check size={15} className="mt-0.5 shrink-0 text-[#2ca84a]" /><span><strong className="font-semibold text-[#1b3555]">Akta Notaris:</strong> AHU-0045694.AH.01.012018</span></li>
                <li className="flex items-start gap-3 text-[#44576d]"><Check size={15} className="mt-0.5 shrink-0 text-[#2ca84a]" /><span><strong className="font-semibold text-[#1b3555]">SIUP, TDUP, NIB:</strong> 8120004912783</span></li>
                <li className="flex items-start gap-3 text-[#44576d]"><Check size={15} className="mt-0.5 shrink-0 text-[#2ca84a]" /><span><strong className="font-semibold text-[#1b3555]">ASITA:</strong> 0704/IX/DPP/2018</span></li>
                <li className="flex items-start gap-3 text-[#44576d]"><Check size={15} className="mt-0.5 shrink-0 text-[#2ca84a]" /><span><strong className="font-semibold text-[#1b3555]">Alamat:</strong> Graha Barokah Jl. Cisaat Sukamanah, Kec. Cisaat, Kab. Sukabumi (43152)</span></li>
                <li className="flex items-start gap-3 text-[#44576d]"><Check size={15} className="mt-0.5 shrink-0 text-[#2ca84a]" /><span><strong className="font-semibold text-[#1b3555]">No. Telepon:</strong> (0266) 230-408 / 0859 3000 5544</span></li>
                <li className="flex items-start gap-3 text-[#44576d]"><Check size={15} className="mt-0.5 shrink-0 text-[#2ca84a]" /><span><strong className="font-semibold text-[#1b3555]">E-mail:</strong> adminbarokahtour@gmail.com</span></li>
                <li className="flex items-start gap-3 text-[#44576d]"><Check size={15} className="mt-0.5 shrink-0 text-[#2ca84a]" /><span><strong className="font-semibold text-[#1b3555]">Website:</strong> www.barokahtour.com</span></li>
              </ul>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <p className="eyebrow mb-2">Yang kami tawarkan</p>
              <h2 className="text-3xl font-bold leading-tight text-[#1b3555] md:text-4xl">
                Layanan <span className="font-serif italic text-[#1b4f9c]">Kami</span>
              </h2>
            </div>
            <p className="leading-relaxed text-[#657080]">
              Semua kebutuhan perjalanan Anda, dari wisata, edukasi, hingga transportasi, dapat diandalkan bersama kami.
            </p>
            <ul className="grid max-w-[460px] gap-3.5">
              {layanan.map((item) => (
                <li
                  key={item}
                  className="group flex items-start gap-3 rounded-xl border border-[#dce8e1] bg-white/80 px-4 py-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f5b915]/70 hover:shadow-[0_16px_40px_-18px_rgba(27,53,85,0.35)]"
                >
                  <Check size={17} className="mt-0.5 shrink-0" />
                  <p className="text-sm font-semibold leading-relaxed text-[#1b3555]">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#f5b915] py-12">
        <div className="container-wide flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#1b3555]">Butuh Bantuan Merencanakan Perjalanan?</h2>
            <p className="mt-1 text-[#1b3555]/75">Tim Barokah siap membantu menjawab kebutuhan Anda.</p>
          </div>
          <a
            href="https://wa.me/6285930005544"
            className="flex items-center gap-2 bg-[#1b4f9c] px-5 py-3 text-sm font-bold text-white"
          >
            <Phone size={16} /> Chat via WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}