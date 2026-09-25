import Link from 'next/link'
import { ArrowRight, Bus, CalendarDays, MapPin, Users } from 'lucide-react'
import { formatTanggalPendek } from '@/lib/dates'

export type EventCardData = {
  id: string
  title: string
  date: Date
  location: string
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
  _count: { buses: number; participants: number }
}

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="group flex flex-col rounded-2xl border border-[#dfe4e8] bg-white p-6 shadow-[0_10px_30px_-18px_rgba(27,53,85,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[#f5b915]/70 hover:shadow-[0_24px_50px_-22px_rgba(27,53,85,0.45)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#eef3fb] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1b4f9c]">
          Event
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-1 text-[11px] font-bold text-[#2ca84a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2ca84a]" /> Aktif
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug text-[#1b3555] group-hover:text-[#1b4f9c]">{event.title}</h3>

      <div className="mt-3 space-y-1.5 text-sm text-[#657080]">
        <p className="flex items-center gap-2">
          <CalendarDays size={15} className="shrink-0 text-[#1b4f9c]" /> {formatTanggalPendek(new Date(event.date))}
        </p>
        {event.location && (
          <p className="flex items-center gap-2">
            <MapPin size={15} className="shrink-0 text-[#1b4f9c]" /> {event.location}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-[#edf0f3] pt-4 text-xs text-[#657080]">
        <span className="flex items-center gap-1.5">
          <Bus size={14} className="text-[#1b4f9c]" /> {event._count.buses} bus
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-[#1b4f9c]" /> {event._count.participants} peserta
        </span>
        <span className="ml-auto flex items-center gap-1 font-bold text-[#1b4f9c] transition-transform duration-200 group-hover:translate-x-1">
          Detail <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  )
}