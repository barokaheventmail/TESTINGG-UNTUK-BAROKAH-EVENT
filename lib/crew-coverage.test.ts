import { describe, expect, it } from 'vitest'
import { armadasTanpaCrew, totalPesertaTanpaCrew } from './crew-coverage'

const bus = (name: string, count: number, workerCount: number) => ({ name, count, workerCount })

describe('cakupan crew per armada', () => {
  it('menandai armada berpeserta yang belum ada crewnya', () => {
    const hasil = armadasTanpaCrew([bus('Bus 1', 40, 2), bus('Bus 2', 25, 0)])
    expect(hasil).toEqual([{ name: 'Bus 2', count: 25 }])
  })

  it('mengabaikan armada kosong dan armada yang sudah ada crewnya', () => {
    const hasil = armadasTanpaCrew([bus('Bus 1', 40, 2), bus('Bus 3', 0, 0)])
    expect(hasil).toEqual([])
  })

  it('aman untuk daftar armada kosong', () => {
    expect(armadasTanpaCrew([])).toEqual([])
  })

  it('melaporkan semua armada bermasalah sekaligus', () => {
    const hasil = armadasTanpaCrew([bus('Bus 1', 10, 0), bus('Bus 2', 5, 1), bus('Bus 3', 7, 0)])
    expect(hasil.map((b) => b.name)).toEqual(['Bus 1', 'Bus 3'])
    expect(totalPesertaTanpaCrew(hasil)).toBe(17)
  })
})
