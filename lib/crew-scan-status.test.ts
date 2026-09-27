import { describe, expect, it } from 'vitest'
import { scanStatusUi } from './crew-scan-status'

describe('label status scan riwayat crew', () => {
  it('menandai kehadiran baru sebagai "Hadir"', () => {
    expect(scanStatusUi('attended').label).toBe('Hadir')
  })

  it('menandai scan ulang sebagai "Sudah hadir"', () => {
    expect(scanStatusUi('already').label).toBe('Sudah hadir')
  })

  it('tidak lagi melabeli pembatalan sebagai "Sudah hadir" (regression F4)', () => {
    const status = scanStatusUi('unattended')
    expect(status.label).toBe('Kehadiran dicabut')
    expect(status.label).not.toBe('Sudah hadir')
  })

  it('memberi warna berbeda agar tidak disalahbaca sebagai hadir', () => {
    expect(scanStatusUi('attended').badgeClass).not.toBe(scanStatusUi('unattended').badgeClass)
  })

  it('status tak dikenal tetap punya label netral', () => {
    expect(scanStatusUi('misterius').label).toBe('Riwayat')
  })
})
