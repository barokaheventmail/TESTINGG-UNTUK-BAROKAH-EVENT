import { PrismaClient } from '@prisma/client'
import { normalizeDatabaseUrl } from './database-url'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)

export const prisma =
  globalForPrisma.prisma ?? (databaseUrl ? new PrismaClient({ datasourceUrl: databaseUrl }) : new PrismaClient())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Query publik yang aman gagal. Halaman yang di-prerender (`revalidate`)
 * menjalankan query ini saat `next build`, jadi URL DB rusak atau koneksi
 * ditolak tidak boleh menggagalkan seluruh build. Nilai cadangan dipakai
 * supaya situs tetap tampil dan akan di-refresh saat revalidate berikutnya.
 */
export async function safeQuery<T>(label: string, query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query()
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').trim()
    console.error(`[db] ${label} gagal, pakai nilai cadangan: ${message.slice(0, 300)}`)
    return fallback
  }
}
