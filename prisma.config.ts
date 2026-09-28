import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Begitu prisma.config.ts ada, Prisma CLI BERHENTI memuat .env* sendiri
// ("Prisma config detected, skipping environment variable loading"), sehingga
// prisma migrate/db seed/db deploy gagal menemukan DATABASE_URL. Muat manual dengan
// urutan prioritas yang sama seperti Next.js (@next/env); file pertama menang.
const nodeEnv = process.env.NODE_ENV ?? "development";

config({
  path: [
    `.env.${nodeEnv}.local`,
    ".env.local",
    `.env.${nodeEnv}`,
    ".env",
  ],
  quiet: true,
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
});
