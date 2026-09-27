import { describe, expect, it } from 'vitest'
import { normalizeDatabaseUrl } from './database-url'

describe('normalisasi DATABASE_URL', () => {
  it('tidak mengubah URL yang sudah benar', () => {
    const url = 'postgresql://postgres.abc:secret@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
    expect(normalizeDatabaseUrl(url)).toBe(url)
  })

  it('membuang tanda kutip dan spasi di sekeliling nilai', () => {
    expect(normalizeDatabaseUrl('  "postgresql://u:p@host:5432/db"  ')).toBe('postgresql://u:p@host:5432/db')
    expect(normalizeDatabaseUrl("'postgresql://u:p@host:5432/db'\n")).toBe('postgresql://u:p@host:5432/db')
  })

  it('meng-encode spasi yang membuat Prisma gagal parse host', () => {
    expect(normalizeDatabaseUrl('postgresql://u:p@ host:5432/db')).toBe('postgresql://u:p@%20host:5432/db')
    expect(normalizeDatabaseUrl('postgresql://u:p@host .example.com:5432/db')).toBe(
      'postgresql://u:p@host%20.example.com:5432/db',
    )
  })

  it('meng-encode karakter terlarang lain di host', () => {
    expect(normalizeDatabaseUrl('postgresql://u:p@ho|st:5432/db')).toBe('postgresql://u:p@ho%7Cst:5432/db')
    expect(normalizeDatabaseUrl('postgresql://u:p@ho^st:5432/db')).toBe('postgresql://u:p@ho%5Est:5432/db')
  })

  it('meng-encode spasi di password tanpa merusak username pooler', () => {
    expect(normalizeDatabaseUrl('postgresql://postgres.abc:rahasia admin@host:5432/db')).toBe(
      'postgresql://postgres.abc:rahasia%20admin@host:5432/db',
    )
  })

  it('tidak meng-encode dua kali escape yang sudah ada', () => {
    expect(normalizeDatabaseUrl('postgresql://u:rahasia%23123@host:5432/db')).toBe('postgresql://u:rahasia%23123@host:5432/db')
  })

  it('membuang port yang bukan angka supaya tidak menggagalkan parse', () => {
    expect(normalizeDatabaseUrl('postgresql://u:p@host: 5432/db')).toBe('postgresql://u:p@host/db')
  })

  it('mempertahankan host kosong untuk koneksi via socket', () => {
    expect(normalizeDatabaseUrl('postgresql:///barokah?host=/var/run/postgresql')).toBe(
      'postgresql:///barokah?host=/var/run/postgresql',
    )
  })

  it('mengembalikan undefined untuk nilai kosong', () => {
    expect(normalizeDatabaseUrl('')).toBeUndefined()
    expect(normalizeDatabaseUrl('   ')).toBeUndefined()
    expect(normalizeDatabaseUrl(undefined)).toBeUndefined()
    expect(normalizeDatabaseUrl(null)).toBeUndefined()
  })

  it('membiarkan nilai yang bukan URL apa adanya', () => {
    expect(normalizeDatabaseUrl('  postgres://u:p@host:5432/db  ')).toBe('postgres://u:p@host:5432/db')
    expect(normalizeDatabaseUrl('bukan-url')).toBe('bukan-url')
  })
})
