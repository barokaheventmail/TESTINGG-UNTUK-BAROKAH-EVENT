import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

for (const file of ['.env', 'prisma/.env']) {
  if (existsSync(file)) {
    process.loadEnvFile(file)
    break
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.mjs',
  },
})
