-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "BusWorker" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusWorker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusWorker_busId_idx" ON "BusWorker"("busId");

-- CreateIndex
CREATE UNIQUE INDEX "BusWorker_busId_userId_key" ON "BusWorker"("busId", "userId");

-- AddForeignKey
ALTER TABLE "BusWorker" ADD CONSTRAINT "BusWorker_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusWorker" ADD CONSTRAINT "BusWorker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
