import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BookOpen, CalendarDays, Clock3, MapPin, Phone } from 'lucide-react'
import { prisma } from '@/lib/db'
import { parseItinerary, groupItineraryByDay } from '@/lib/itinerary'
import { BackLink } from '@/components/site'
import { EventNavbar } from '@/components/event-navbar'
import { PublicSeatMap } from '@/components/public-seat-map'

export const dynamic = 'force-dynamic'

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const FIXED_RULES: { text: string; items?: string[] }[] = [
  { text: 'Bawalah selalu catatan ini agar sewaktu-waktu diperlukan, peserta dapat lebih mudah menyesuaikan selama perjalanan.' },
  { text: 'Peserta wajib hadir tepat waktu di lokasi keberangkatan. Keterlambatan dapat mengganggu kenyamanan peserta lain dan berpotensi menyebabkan peserta tertinggal rombongan.' },
  {
    text: 'Peserta disarankan membawa tas kecil yang mudah diakses untuk menyimpan kebutuhan penting selama perjalanan tanpa membuka koper, seperti:',
    items: [
      'Dompet dan identitas pribadi',
      'Obat-obatan pribadi',
      'Peralatan ibadah',
      'Payung lipat atau jas hujan',
      'Snack ringan dan minuman pribadi',
      'Plastik serbaguna',
      'Pakaian ganti',
      'Peralatan mandi',
      'Jaket, syal, kupluk, sarung tangan, atau kaos kaki (antisipasi cuaca dingin)',
      'Aksesoris tambahan: kacamata, topi, kipas portable',
    ],
  },
  { text: 'Peserta wajib mematuhi jadwal, tata tertib, dan instruksi Tour Leader/Team Leader selama kegiatan berlangsung.' },
  { text: 'Peserta disarankan dalam kondisi sehat sebelum mengikuti perjalanan.' },
  { text: 'Peserta tidak diperkenankan meninggalkan rombongan tanpa izin dari Tour Leader/Team Leader.' },
  { text: 'Barang bawaan pribadi menjadi tanggung jawab masing-masing peserta. Hindari membawa barang berharga atau perhiasan berlebihan.' },
  { text: 'Peserta wajib menaati aturan yang berlaku dan menjaga kebersihan di setiap destinasi wisata maupun penginapan yang digunakan selama perjalanan.' },
  { text: 'Apabila peserta memiliki riwayat penyakit tertentu, disarankan untuk menginformasikan kepada Tour Leader sebelum keberangkatan.' },
]

function formatDate(date: Date): string {
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    select: { id: true, title: true, date: true, location: true, panduanItinerary: true, crewName: true, crewPhone: true, crewPhotoUrl: true },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id)
  return { title: `Panduan Peserta – ${event?.title ?? 'Event'} | Barokah Tour and Travel`, robots: { index: false } }
}

export default async function EventPanduanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const event = await getEvent(id)
  if (!event) notFound()

  const participantToken = (sp.token ?? '').trim().slice(0, 200)
  const participant = participantToken
    ? await prisma.participant.findUnique({
        where: { token: participantToken },
        select: { id: true, eventId: true, busId: true, seat: true, name: true },
      })
    : null
  const ownBus = participant && participant.eventId === id ? participant : null

  const buses = await prisma.bus.findMany({
    where: { eventId: id },
    select: { id: true, name: true },
    orderBy: { order: 'asc' },
  })

  const itinerary = parseItinerary(event.panduanItinerary)
  const isEmpty = itinerary.length === 0
  const dayGroups = groupItineraryByDay(itinerary)
  const multiDay = dayGroups.length > 1

  return (
    <main className="min-h-screen bg-[#f4f7fa] pb-12">
      <EventNavbar eventId={event.id} variant="panduan" />

      {isEmpty ? (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e3e8ee]">
            <BookOpen size={26} className="text-[#657080]" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-[#1b3555]">Panduan Belum Tersedia</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#657080]">
            Panduan untuk {event.title} akan segera hadir. Hubungi panitia bila ada pertanyaan.
          </p>
          <div className="mt-6">
            <BackLink href={`/event/${event.id}`} label="Kembali ke Event" />
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-[#dfe4e8] px-4 py-10">
            <div className="mx-auto max-w-2xl">
              <p className="eyebrow">Perjalanan Anda</p>
              <h1 className="mt-2 text-3xl font-bold text-[#1b3555]">{event.title}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#657080]">
                <span className="flex items-center gap-1">
                  <Clock3 size={15} className="text-[#2ca84a]" /> {formatDate(event.date)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={15} className="text-[#2ca84a]" /> {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-2xl space-y-4 px-4 py-7">
            {itinerary.length > 0 && (
              <section className="border border-[#dfe4e8] bg-white p-5">
                <h2 className="text-xl font-bold text-[#1b3555]">Itinerary Perjalanan</h2>
                <div className="mt-4 space-y-6">
                  {dayGroups.map((group) => (
                    <div key={group.day}>
                      {multiDay && (
                        <h3 className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-bold text-[#1b4f9c]">
                          <CalendarDays size={13} /> Day {group.day}
                        </h3>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#dfe4e8] text-[11px] font-bold uppercase tracking-wide text-[#657080]">
                              <th className="px-2 py-2">Waktu</th>
                              <th className="px-2 py-2">Agenda</th>
                              <th className="px-2 py-2">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.rows.map((item, i) => (
                              <tr key={`${group.day}-${item.time}-${i}`} className="border-b border-[#dfe4e8] last:border-0">
                                <td className="whitespace-nowrap px-2 py-2.5 font-bold text-[#1b4f9c]">{item.time}</td>
                                <td className="px-2 py-2.5 font-semibold text-[#1b3555]">{item.agenda}</td>
                                <td className="px-2 py-2.5 text-[#657080]">{item.keterangan || '–'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {event.crewName && (
              <section className="border border-[#dfe4e8] bg-white p-5">
                <h2 className="text-xl font-bold text-[#1b3555]">Crew on Duty</h2>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dcebe0] text-xl font-bold text-[#2ca84a]">
                    {event.crewPhotoUrl ? (
                      <img src={event.crewPhotoUrl} alt={event.crewName} className="h-full w-full object-cover" />
                    ) : (
                      event.crewName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <strong className="block">{event.crewName}</strong>
                    {event.crewPhone && (
                      <a href={`tel:${event.crewPhone.replace(/\D/g, '')}`} className="mt-1 flex items-center gap-1 text-sm font-bold text-[#1b4f9c]">
                        <Phone size={13} /> {event.crewPhone}
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-6 border border-[#dfe4e8] bg-white p-5">
              <div>
                <h2 className="text-xl font-bold text-[#1b3555]">Doa Bepergian Jauh</h2>
                <p className="mt-3 text-right text-lg leading-loose text-[#1b3555]" dir="rtl" lang="ar">
                  سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ ۝ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#657080]">
                  “Mahasuci Allah yang telah menundukkan semua ini bagi kami, padahal kami sebelumnya tidak mampu
                  menguasainya. Dan sesungguhnya kami akan kembali kepada Tuhan kami.”
                </p>
                <p className="mt-4 text-right text-lg leading-loose text-[#1b3555]" dir="rtl" lang="ar">
                  اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى،
                  اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي
                  السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#657080]">
                  “Ya Allah, kami memohon kepada-Mu kebaikan dan ketakwaan dalam perjalanan ini, serta amal yang Engkau
                  ridhai. Ya Allah, mudahkanlah perjalanan kami ini dan dekatkanlah jaraknya. Ya Allah, Engkaulah teman
                  dalam perjalanan dan penjaga keluarga kami.”
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#1b3555]">Tata Cara Salat Jamak</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#1b3555]">
                  Salat jamak adalah menggabungkan dua salat fardu dalam satu waktu karena sedang dalam perjalanan
                  (safar). Salat yang boleh dijamak adalah Zuhur dengan Asar, serta Maghrib dengan Isya.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#1b3555]">
                  <strong>Jamak takdim</strong> — menggabungkan dua salat pada waktu salat yang pertama (misalnya Zuhur
                  dan Asar dikerjakan di waktu Zuhur). <br />
                  <strong>Jamak takhir</strong> — menggabungkan dua salat pada waktu salat yang kedua (misalnya Zuhur
                  dan Asar dikerjakan di waktu Asar).
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#657080]">
                  Dalam safar, salat juga boleh di<strong>qashar</strong>, yaitu meringkas salat yang berjumlah empat
                  rakaat (Zuhur, Asar, Isya) menjadi dua rakaat.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#1b3555]">Tata Cara Salat Jamak Takdim</h2>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Niat Salat Zuhur</h3>
                <p className="mt-1 text-right text-lg leading-loose text-[#1b3555]" dir="rtl" lang="ar">
                  أُصَلِّي فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مَجْمُوعًا إِلَيْهِ الْعَصْرُ أَدَاءً لِلَّهِ تَعَالَى
                </p>
                <p className="mt-0.5 text-sm italic leading-relaxed text-[#57606e]" dir="ltr">
                  Ushalli fardhas-zuhri arba‘a raka‘atin majmu‘an ilaihil-ashru adaa-an lillahi ta‘aala
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#657080]">
                  “Aku berniat salat fardu Zuhur empat rakaat yang dijamak dengan Asar, karena Allah Ta’ala.”
                </p>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Niat Salat Asar</h3>
                <p className="mt-1 text-right text-lg leading-loose text-[#1b3555]" dir="rtl" lang="ar">
                  أُصَلِّي فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ مَجْمُوعًا إِلَى الظُّهْرِ أَدَاءً لِلَّهِ تَعَالَى
                </p>
                <p className="mt-0.5 text-sm italic leading-relaxed text-[#57606e]" dir="ltr">
                  Ushalli fardhal-ashri arba‘a raka‘atin majmu‘an ilaz-zuhri adaa-an lillahi ta‘aala
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#657080]">
                  “Aku berniat salat fardu Asar empat rakaat yang dijamak dengan Zuhur, karena Allah Ta’ala.”
                </p>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Urutan Mengerjakan</h3>
                <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm leading-relaxed text-[#1b3555]">
                  <li>Berniat salat Zuhur jamak takdim.</li>
                  <li>Kerjakan salat Zuhur empat rakaat lalu salam.</li>
                  <li>Berniat salat Asar jamak takdim.</li>
                  <li>Kerjakan salat Asar empat rakaat lalu salam.</li>
                </ol>
                <p className="mt-2 text-xs italic text-[#657080]">Keduanya dikerjakan berurutan pada waktu Zuhur.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#1b3555]">Tata Cara Salat Jamak Takdim dengan Qashar</h2>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Niat Salat Zuhur</h3>
                <p className="mt-1 text-right text-lg leading-loose text-[#1b3555]" dir="rtl" lang="ar">
                  أُصَلِّي فَرْضَ الظُّهْرِ رَكْعَتَيْنِ قَصْرًا مَجْمُوعًا إِلَى الْعَصْرِ أَدَاءً لِلَّهِ تَعَالَى
                </p>
                <p className="mt-0.5 text-sm italic leading-relaxed text-[#57606e]" dir="ltr">
                  Ushalli fardhas-zuhri rak‘ataini qashran majmu‘an ilal-ashri adaa-an lillahi ta‘aala
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#657080]">
                  “Aku berniat salat fardu Zuhur dua rakaat qashar yang dijamak dengan Asar, karena Allah Ta’ala.”
                </p>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Niat Salat Asar</h3>
                <p className="mt-1 text-right text-lg leading-loose text-[#1b3555]" dir="rtl" lang="ar">
                  أُصَلِّي فَرْضَ الْعَصْرِ رَكْعَتَيْنِ قَصْرًا مَجْمُوعًا إِلَى الظُّهْرِ أَدَاءً لِلَّهِ تَعَالَى
                </p>
                <p className="mt-0.5 text-sm italic leading-relaxed text-[#57606e]" dir="ltr">
                  Ushalli fardhal-ashri rak‘ataini qashran majmu‘an ilaz-zuhri adaa-an lillahi ta‘aala
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#657080]">
                  “Aku berniat salat fardu Asar dua rakaat qashar yang dijamak dengan Zuhur, karena Allah Ta’ala.”
                </p>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Urutan Mengerjakan</h3>
                <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm leading-relaxed text-[#1b3555]">
                  <li>Berniat salat Zuhur qashar jamak takdim.</li>
                  <li>Kerjakan salat Zuhur dua rakaat lalu salam.</li>
                  <li>Berniat salat Asar qashar jamak takdim.</li>
                  <li>Kerjakan salat Asar dua rakaat lalu salam.</li>
                </ol>
                <p className="mt-2 text-xs italic text-[#657080]">
                  Keduanya dikerjakan berurutan pada waktu Zuhur, masing-masing dua rakaat.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#1b3555]">Tata Cara Salat Jamak Takhir dengan Qashar</h2>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Niat Salat Zuhur</h3>
                <p className="mt-1 text-right text-lg leading-loose text-[#1b3555]" dir="rtl" lang="ar">
                  أُصَلِّي فَرْضَ الظُّهْرِ رَكْعَتَيْنِ قَصْرًا مَجْمُوعًا مَعَ الْعَصْرِ أَدَاءً لِلَّهِ تَعَالَى
                </p>
                <p className="mt-0.5 text-sm italic leading-relaxed text-[#57606e]" dir="ltr">
                  Ushalli fardhas-zuhri rak‘ataini qashran majmu‘an ma‘al-ashri adaa-an lillahi ta‘aala
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#657080]">
                  “Aku berniat salat fardu Zuhur dua rakaat qashar yang dijamak dengan Asar, karena Allah Ta’ala.”
                </p>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Niat Salat Asar</h3>
                <p className="mt-1 text-right text-lg leading-loose text-[#1b3555]" dir="rtl" lang="ar">
                  أُصَلِّي فَرْضَ الْعَصْرِ رَكْعَتَيْنِ قَصْرًا مَجْمُوعًا إِلَى الظُّهْرِ أَدَاءً لِلَّهِ تَعَالَى
                </p>
                <p className="mt-0.5 text-sm italic leading-relaxed text-[#57606e]" dir="ltr">
                  Ushalli fardhal-ashri rak‘ataini qashran majmu‘an ilaz-zuhri adaa-an lillahi ta‘aala
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#657080]">
                  “Aku berniat salat fardu Asar dua rakaat qashar yang dijamak dengan Zuhur, karena Allah Ta’ala.”
                </p>
                <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">Urutan Mengerjakan</h3>
                <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm leading-relaxed text-[#1b3555]">
                  <li>Berniat salat Zuhur qashar jamak takhir.</li>
                  <li>Kerjakan salat Zuhur dua rakaat lalu salam.</li>
                  <li>Berniat salat Asar qashar jamak takhir.</li>
                  <li>Kerjakan salat Asar dua rakaat lalu salam.</li>
                </ol>
                <p className="mt-2 text-xs italic text-[#657080]">
                  Keduanya dikerjakan berurutan pada waktu Asar, masing-masing dua rakaat.
                </p>
              </div>
            </section>

            <section className="border border-[#dfe4e8] bg-white p-5">
              <h2 className="text-xl font-bold text-[#1b3555]">Tata Tertib</h2>
              <ol className="mt-4 space-y-3">
                {FIXED_RULES.map((rule, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2ca84a] text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="leading-relaxed">{rule.text}</p>
                      {rule.items && (
                        <ul className="mt-2 space-y-1.5">
                          {rule.items.map((item, j) => (
                            <li key={item} className="flex gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#e3e8ee] text-[11px] font-bold text-[#1b3555]">
                                {String.fromCharCode(97 + j)}
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {buses.length > 0 && (
              <section className="border border-[#dfe4e8] bg-white p-5">
                <h2 className="text-xl font-bold text-[#1b3555]">Peta Kursi &amp; Daftar Nama</h2>
                <p className="mt-1 text-xs leading-relaxed text-[#657080]">
                  Cek posisi kursi di armada Anda sebelum keberangkatan. Kursi hijau menandakan sudah terisi penumpang.
                  Gunakan tombol panah untuk berpindah armada.
                </p>
                <PublicSeatMap
                  eventId={id}
                  buses={buses}
                  initialBusId={ownBus?.busId ?? null}
                  highlightSeat={ownBus?.seat ?? null}
                />
              </section>
            )}

            </div>
        </>
      )}
    </main>
  )
}