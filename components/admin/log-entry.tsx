import type { ReactNode } from 'react'
import { formatWaktuLengkap } from '@/lib/dates'
import { formatLogDetail, groupLog, labelLog, type LogDetail } from '@/lib/log-labels'

export type LogEntryItem = {
  id: string
  action: string
  detail: unknown
  createdAt: Date
  user?: { username: string } | null
  event?: { title: string } | null
}

export function LogEntry({
  log,
  showEvent = true,
  className = '',
}: {
  log: LogEntryItem
  showEvent?: boolean
  className?: string
}) {
  const g = groupLog(log.action)
  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${className}`}>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${g.cls}`}>{g.group}</span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-bold text-[#1b3555]">{labelLog(log.action)}</p>
        <p className="text-xs leading-relaxed text-[#657080]">
          {formatLogDetail(log.action, log.detail as unknown as LogDetail)}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs">
        <p className="whitespace-nowrap font-semibold text-[#657080]">{formatWaktuLengkap(new Date(log.createdAt))}</p>
        <p className="mt-0.5 whitespace-nowrap text-[#9aa3af]">
          {showEvent && log.event?.title ? `${log.event.title} · ` : ''}
          {log.user?.username ?? '—'}
        </p>
      </div>
    </li>
  )
}