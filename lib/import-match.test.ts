import { describe, expect, it } from 'vitest'
import { conflictSummary, normalizeNameKey, planImport, type ExistingParticipant, type ImportRow } from './import-match'

function ex(id: string, order: number, name: string, phone: string | null = null): ExistingParticipant {
  return { id, order, name, phone }
}

const row = (order: number, name: string, phone: string | null = null): ImportRow => ({ order, name, phone })

describe('planImport', () => {
  it('armada kosong: semua baris jadi peserta baru di nomor dari file', () => {
    const plan = planImport({
      existing: [],
      rows: [row(1, 'Ahmad Fauzi', '085812345678'), row(2, 'Siti Rahmawati', '085812345679')],
    })
    expect(plan.created).toBe(2)
    expect(plan.updated).toBe(0)
    expect(plan.conflicts).toHaveLength(0)
    expect(plan.decisions.map((d) => (d.kind === 'create' ? d.slot : null))).toEqual([1, 2])
  })

  it('import ulang file yang sama idempoten dan tidak menggeser urutan', () => {
    const existing = [ex('a', 1, 'Ahmad Fauzi', '085812345678'), ex('b', 2, 'Siti Rahmawati', '085812345679')]
    const rows = [row(1, 'Ahmad Fauzi', '085812345678'), row(2, 'Siti Rahmawati', '085812345679')]
    const plan = planImport({ existing, rows })
    expect(plan.created).toBe(0)
    expect(plan.updated).toBe(2)
    expect(plan.conflicts).toHaveLength(0)
    expect(plan.decisions.every((d) => d.kind === 'update' && d.by === 'nama+hp')).toBe(true)
  })

  it('reproduksi bug A1: baris disisipkan di tengah tidak menukar identitas', () => {
    // Di sistem: No 1 Ahmad (sudah scan), No 2 Budi, No 3 Citra.
    const existing = [
      ex('ahmad', 1, 'Ahmad Fauzi', '085812345678'),
      ex('budi', 2, 'Budi Santoso', '085812345679'),
      ex('citra', 3, 'Citra Dewi', '085812345680'),
    ]
    // Admin menyisipkan Zeta di baris pertama, semua nomor ikut bergeser.
    const rows = [
      row(1, 'Zeta lestari', '085812345681'),
      row(2, 'Ahmad Fauzi', '085812345678'),
      row(3, 'Budi Santoso', '085812345679'),
      row(4, 'Citra Dewi', '085812345680'),
    ]
    const plan = planImport({ existing, rows })

    expect(plan.conflicts).toHaveLength(1)
    expect(plan.conflicts[0]).toMatchObject({ name: 'Zeta lestari', occupiedBy: 'Ahmad Fauzi', reason: 'slot' })
    // Tiga peserta lama tetap milik dirinya sendiri (bukan tertukar dengan Zeta/Budi).
    expect(plan.decisions.filter((d) => d.kind === 'update').map((d) => (d as { id: string }).id)).toEqual([
      'ahmad',
      'budi',
      'citra',
    ])
    expect(plan.created).toBe(0)
    expect(plan.updated).toBe(3)
  })

  it('reproduksi bug A2: baris duplikat di file tidak menimpa peserta lain', () => {
    const existing = [ex('budi', 2, 'Budi Santoso'), ex('citra', 3, 'Citra Dewi')]
    const plan = planImport({ existing, rows: [row(2, 'Budi Santoso'), row(3, 'Budi Santoso')] })
    expect(plan.duplicates).toBe(1)
    expect(plan.conflicts).toHaveLength(0)
    // Citra tidak pernah jadi target update.
    expect(plan.decisions.map((d) => d.kind)).toEqual(['update', 'duplicate'])
    expect((plan.decisions[0] as { id: string }).id).toBe('budi')
  })

  it('menambah peserta di akhir memakai nomor dari file', () => {
    const existing = [ex('a', 1, 'Ahmad Fauzi'), ex('b', 2, 'Siti Rahmawati')]
    const plan = planImport({ existing, rows: [row(1, 'Ahmad Fauzi'), row(2, 'Siti Rahmawati'), row(3, 'Dewi Lestari')] })
    expect(plan.created).toBe(1)
    expect(plan.conflicts).toHaveLength(0)
    expect((plan.decisions[2] as { slot: number; moved: boolean }).slot).toBe(3)
  })

  it('peserta yang sama pindah nomor tetap ikut, urutannya tidak digeser', () => {
    const existing = [ex('a', 1, 'Ahmad Fauzi'), ex('b', 2, 'Budi Santoso')]
    const plan = planImport({ existing, rows: [row(1, 'Budi Santoso'), row(2, 'Ahmad Fauzi')] })
    expect(plan.updated).toBe(2)
    expect(plan.conflicts).toHaveLength(0)
    expect(plan.decisions.map((d) => (d.kind === 'update' ? d.by : null))).toEqual(['nama', 'nama'])
  })

  it('nama dengan huruf/spasi berbeda tetap dianggap orang yang sama', () => {
    const existing = [ex('a', 1, 'Ahmad  Fauzi')]
    const plan = planImport({ existing, rows: [row(1, ' ahmad fauzi ')] })
    expect(plan.updated).toBe(1)
    expect(plan.conflicts).toHaveLength(0)
    expect(normalizeNameKey('  Ahmad   Fauzi ')).toBe('ahmad fauzi')
  })

  it('forceByOrder mengembalikan perilaku lama dan dihitung terpisah', () => {
    const existing = [ex('a', 1, 'Ahmad Fauzi'), ex('b', 2, 'Budi Santoso')]
    const plan = planImport({ existing, rows: [row(1, 'Zeta Lestari'), row(2, 'Budi Santoso')], forceByOrder: true })
    expect(plan.conflicts).toHaveLength(0)
    expect(plan.forced).toBe(1)
    expect(plan.updated).toBe(2)
  })

  it('nama dobel di sistem tidak ditebak, ditandai ambigu', () => {
    const existing = [ex('b1', 1, 'Budi Santoso'), ex('b2', 2, 'Budi Santoso'), ex('c', 3, 'Citra Dewi')]
    // Baris "Budi Santoso" datang di No 5: tidak ada occupant, dan namanya menunjuk
    // ke dua peserta sekaligus, jadi tidak boleh ditebak.
    const plan = planImport({ existing, rows: [row(5, 'Budi Santoso'), row(3, 'Citra Dewi')] })
    expect(plan.conflicts.map((c) => c.reason)).toEqual(['ambigu'])
    expect(plan.conflicts[0].message).toContain('lebih dari satu')
    // Peserta yang namanya unik tetap ikut diperbarui.
    expect(plan.updated).toBe(1)
  })

  it('nama dobel yang nomornya sama dengan occupant yang cocok tetap aman', () => {
    const existing = [ex('b1', 1, 'Budi Santoso'), ex('b2', 2, 'Budi Santoso')]
    const plan = planImport({ existing, rows: [row(2, 'Budi Santoso')] })
    expect(plan.conflicts).toHaveLength(0)
    expect((plan.decisions[0] as { id: string; by: string }).id).toBe('b2')
    expect((plan.decisions[0] as { by: string }).by).toBe('nomor')
  })

  it('satu peserta tidak bisa dipakai dua baris berbeda di file yang sama', () => {
    const existing = [ex('a', 1, 'Ahmad Fauzi'), ex('z', 2, 'Zeta Lestari')]
    // Baris 1 "Ahmad Fauzi" (no HP) dan baris 2 "Ahmad Fauzi" juga tanpa HP tapi beda
    // nama_normalized tetap sama -> harus jadi duplikat, bukan update participant lain.
    const plan = planImport({ existing, rows: [row(1, 'Ahmad Fauzi'), row(2, 'ahmad fauzi')] })
    expect(plan.duplicates).toBe(1)
    expect(plan.updated).toBe(1)
  })

  it('nomor di file yang sudah terpakai baris lain di file yang sama placement di nomor kosong berikutnya', () => {
    const existing = [ex('a', 1, 'Ahmad Fauzi')]
    // Dua baris baru sama-sama minta No 2 (mis. setelah parser gagal merapikan).
    const plan = planImport({ existing, rows: [row(2, 'Budi Santoso'), row(2, 'Citra Dewi')] })
    const slots = plan.decisions.filter((d) => d.kind === 'create').map((d) => (d as { slot: number }).slot)
    expect(slots).toEqual([2, 3])
    expect((plan.decisions[1] as { moved: boolean }).moved).toBe(true)
  })

  it('conflictSummary menjelaskan jumlahnya tanpa menyebut data ditimpa', () => {
    const existing = [ex('a', 1, 'Ahmad Fauzi')]
    const plan = planImport({
      existing,
      rows: [row(1, 'Ahmad Fauzi'), row(1, 'Ahmad'), row(5, 'Budi Santoso'), row(5, 'Budi Santoso')],
    })
    const out = conflictSummary(plan.conflicts, plan.duplicates)
    expect(out.some((s) => s.includes('tidak ada peserta yang ditimpa'))).toBe(true)
    expect(out.some((s) => s.includes('duplikat'))).toBe(true)
  })
})
