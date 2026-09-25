-- AlterTable
ALTER TABLE "Participant" ADD COLUMN "ticketCode" TEXT;

-- Backfill existing rows with the canonical uppercase ticket code.
UPDATE "Participant" AS pt
SET "ticketCode" = 'BTH-'
    || LPAD(MOD(EXTRACT(YEAR FROM ev."date")::int, 100)::text, 2, '0')
    || '-'
    || UPPER(RIGHT(pt."token", 5))
FROM "Event" AS ev
WHERE ev."id" = pt."eventId";

-- AlterTable
ALTER TABLE "Participant" ALTER COLUMN "ticketCode" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Participant_ticketCode_idx" ON "Participant"("ticketCode");