import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ log: ['query', 'error'] })
async function main() {
  try {
    await prisma.$transaction(async (tx) => {
      const e = await tx.event.create({
        data: { title: 'Test Event', date: new Date() }
      })
      await tx.bus.create({
        data: { eventId: e.id, name: 'Bus 1' }
      })
      console.log('TX SUCCESS')
      throw new Error('Rollback')
    })
  } catch (err) {
    console.error('TX FAILED', err)
  }
}
main().finally(() => prisma.$disconnect())
