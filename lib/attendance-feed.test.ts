import { describe, expect, it } from 'vitest'
import { parseSince, resolveAttendanceFeed } from './attendance-feed'

const t = (hour: number, minute = 0) => new Date(2026, 8, 27, hour, minute)

describe('feed kehadiran publik', () => {
  it('pemuatan awal tidak menandai reset dan memakai scan terakhir', () => {
    const feed = resolveAttendanceFeed({ since: null, latestLogAt: t(7, 40), latestResetAt: t(6) })
    expect(feed).toEqual({ seq: t(7, 40).toISOString(), reset: false })
  })

  it('menandai reset ketika reset terjadi setelah seq klien', () => {
    const feed = resolveAttendanceFeed({ since: t(7), latestLogAt: t(7, 40), latestResetAt: t(8) })
    expect(feed).toEqual({ seq: t(8).toISOString(), reset: true })
  })

  it('tidak menandai reset yang sudah lama (sudah tercermin di seq klien)', () => {
    const feed = resolveAttendanceFeed({ since: t(8), latestLogAt: t(8, 30), latestResetAt: t(8) })
    expect(feed).toEqual({ seq: t(8, 30).toISOString(), reset: false })
  })

  it('memakai waktu reset sebagai seq supaya tick berikutnya menerima scan pasca-reset', () => {
    // Scan jam 9 terjadi SETELAH reset jam 8, tapi delta tick ini sengaja
    // dikosongkan. Seq dipatok ke jam 8 agar tick berikutnya mengirim
    // scan jam 9 (bukan scan lama sebelum reset).
    const feed = resolveAttendanceFeed({ since: t(7), latestLogAt: t(9), latestResetAt: t(8) })
    expect(feed).toEqual({ seq: t(8).toISOString(), reset: true })
  })

  it('event tanpa aktivitas apa pun menghasilkan seq null', () => {
    expect(resolveAttendanceFeed({ since: null, latestLogAt: null, latestResetAt: null })).toEqual({
      seq: null,
      reset: false,
    })
  })

  it('parseSince menolak nilai rusak agar tidak jadi query error', () => {
    expect(parseSince('bukan-tanggal')).toBeNull()
    expect(parseSince(null)).toBeNull()
    expect(parseSince(t(7).toISOString())?.getHours()).toBe(7)
  })
})
