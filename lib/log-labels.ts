export type LogDetail = Record<string, unknown> | null

export type LogGroup = 'Import' | 'Kelola Event' | 'Armada' | 'Peserta' | 'Kehadiran' | 'Scan' | 'Keamanan' | 'Lainnya'

const GROUP_STYLE: Record<LogGroup, string> = {
  Import: 'bg-[#e6f4ea] text-[#2ca84a]',
  'Kelola Event': 'bg-[#eef3fb] text-[#1b4f9c]',
  Armada: 'bg-[#f3ecfb] text-[#7b3fd4]',
  Peserta: 'bg-[#e8f4fb] text-[#0d7bb5]',
  Kehadiran: 'bg-[#fff7e0] text-[#b98a12]',
  Scan: 'bg-[#eff1f4] text-[#657080]',
  Keamanan: 'bg-[#fdeaea] text-[#c0392b]',
  Lainnya: 'bg-[#eff1f4] text-[#657080]',
}

const ACTION_GROUP: Record<string, LogGroup> = {
  'event.import': 'Import',
  'event.create': 'Kelola Event',
  'event.update': 'Kelola Event',
  'event.delete': 'Kelola Event',
  'event.clearData': 'Kelola Event',
  'bus.create': 'Armada',
  'bus.update': 'Armada',
  'bus.delete': 'Armada',
  'participant.create': 'Peserta',
  'participant.update': 'Peserta',
  'participant.delete': 'Peserta',
  'attendance.reset': 'Kehadiran',
  'attendance.set': 'Kehadiran',
  'attendance.clear': 'Kehadiran',
  'scan.attended': 'Scan',
  'scan.duplicate': 'Scan',
  'auth.login.success': 'Keamanan',
  'auth.login.failed': 'Keamanan',
  'auth.logout': 'Keamanan',
}

export const LOG_ACTIONS: { group: LogGroup; actions: { value: string; label: string }[] }[] = [
  {
    group: 'Import',
    actions: [{ value: 'event.import', label: 'Impor data (Excel)' }],
  },
  {
    group: 'Kelola Event',
    actions: [
      { value: 'event.create', label: 'Buat event' },
      { value: 'event.update', label: 'Ubah event' },
      { value: 'event.delete', label: 'Hapus event' },
      { value: 'event.clearData', label: 'Hapus data bus & peserta' },
    ],
  },
  {
    group: 'Armada',
    actions: [
      { value: 'bus.create', label: 'Tambah bus' },
      { value: 'bus.update', label: 'Ubah bus' },
      { value: 'bus.delete', label: 'Hapus bus' },
    ],
  },
  {
    group: 'Peserta',
    actions: [
      { value: 'participant.create', label: 'Tambah peserta' },
      { value: 'participant.update', label: 'Ubah peserta' },
      { value: 'participant.delete', label: 'Hapus peserta' },
    ],
  },
  {
    group: 'Kehadiran',
    actions: [
      { value: 'attendance.set', label: 'Tandai hadir (manual)' },
      { value: 'attendance.clear', label: 'Batalkan hadir (manual)' },
      { value: 'attendance.reset', label: 'Reset kehadiran' },
    ],
  },
  {
    group: 'Scan',
    actions: [
      { value: 'scan.attended', label: 'Scan — hadir' },
      { value: 'scan.duplicate', label: 'Scan — sudah hadir' },
    ],
  },
  {
    group: 'Keamanan',
    actions: [
      { value: 'auth.login.success', label: 'Login berhasil' },
      { value: 'auth.login.failed', label: 'Percobaan login gagal' },
      { value: 'auth.logout', label: 'Logout' },
    ],
  },
]

export function getValue(d: LogDetail, key: string): string | number | null {
  const v = d && (d[key] as unknown)
  return typeof v === 'string' || typeof v === 'number' ? v : null
}

export function labelLog(action: string): string {
  for (const g of LOG_ACTIONS) {
    const f = g.actions.find((a) => a.value === action)
    if (f) return f.label
  }
  return action
}

export function groupLog(action: string): { group: LogGroup; cls: string } {
  const group = ACTION_GROUP[action] ?? 'Lainnya'
  return { group, cls: GROUP_STYLE[group] }
}

export function formatLogDetail(action: string, detail: LogDetail): string {
  switch (action) {
    case 'event.import': {
      const busesRaw = detail?.buses
      const buses = Array.isArray(busesRaw) ? busesRaw.length : typeof busesRaw === 'number' ? busesRaw : null
      const created = detail && typeof detail.created === 'number' ? detail.created : 0
      const updated = detail && typeof detail.updated === 'number' ? detail.updated : 0
      return `${buses ?? '?'} bus · ${created.toLocaleString('id-ID')} baru · ${updated.toLocaleString('id-ID')} diperbarui`
    }
    case 'event.create': {
      const t = getValue(detail, 'title')
      return `Event "${t ?? '??? '}" dibuat`
    }
    case 'event.update': {
      const t = getValue(detail, 'title')
      return `Pengaturan event "${t ?? '??? '}" diubah`
    }
    case 'event.delete': {
      const t = getValue(detail, 'title')
      return `Event "${t ?? '??? '}" dihapus`
    }
    case 'event.clearData': {
      const buses = detail && typeof detail.buses === 'number' ? detail.buses : 0
      const participants = detail && typeof detail.participants === 'number' ? detail.participants : 0
      return `${buses.toLocaleString('id-ID')} bus & ${participants.toLocaleString('id-ID')} peserta dihapus`
    }
    case 'bus.create': {
      const n = getValue(detail, 'name')
      return `Bus baru "${n ?? '??? '}"`
    }
    case 'bus.update': {
      const from = getValue(detail, 'from')
      const to = getValue(detail, 'to')
      return `${from ?? '???'} → ${to ?? '???'}`
    }
    case 'bus.delete': {
      const n = getValue(detail, 'name')
      const p = detail && typeof detail.participants === 'number' ? detail.participants : null
      return `Bus "${n ?? '???'}" dihapus${p !== null ? ` (${p.toLocaleString('id-ID')} peserta)` : ''}`
    }
    case 'participant.create': {
      const n = getValue(detail, 'name')
      const bus = getValue(detail, 'bus')
      return `Peserta "${n ?? '???'}" ditambahkan${bus ? ` ke ${bus}` : ''}`
    }
    case 'participant.update': {
      const n = getValue(detail, 'name')
      return `Data peserta "${n ?? '???'}" diperbarui`
    }
    case 'participant.delete': {
      const n = getValue(detail, 'name')
      return `Peserta "${n ?? '???'}" dihapus`
    }
    case 'attendance.set': {
      const n = getValue(detail, 'name')
      return `${n ?? '???'} ditandai hadir (manual)`
    }
    case 'attendance.clear': {
      const n = getValue(detail, 'name')
      return `Kehadiran ${n ?? '???'} dibatalkan (manual)`
    }
    case 'attendance.reset': {
      const c =
        (detail && typeof detail.participants === 'number' ? detail.participants : null) ??
        (detail && typeof detail.count === 'number' ? detail.count : null)
      return `Kehadiran direset${c !== null ? ` (${c.toLocaleString('id-ID')} peserta)` : ''}`
    }
    case 'scan.attended': {
      const n = getValue(detail, 'name')
      return `Scan: ${n ?? '???'} — hadir`
    }
    case 'scan.duplicate': {
      const n = getValue(detail, 'name')
      return `Scan: ${n ?? '???'} — sudah hadir`
    }
    case 'auth.login.success': {
      const n = getValue(detail, 'username')
      const role = getValue(detail, 'role')
      return `Login berhasil${n ? ` • ${n}` : ''}${role ? ` (${String(role).toLowerCase()})` : ''}`
    }
    case 'auth.login.failed': {
      const n = getValue(detail, 'username')
      return `Percobaan login gagal${n ? ` • ${n}` : ''}`
    }
    case 'auth.logout': {
      const n = getValue(detail, 'username')
      return `Logout${n ? ` • ${n}` : ''}`
    }
    default: {
      if (!detail || Object.keys(detail).length === 0) return '—'
      const s = JSON.stringify(detail)
      return s.length > 120 ? `${s.slice(0, 117)}…` : s
    }
  }
}