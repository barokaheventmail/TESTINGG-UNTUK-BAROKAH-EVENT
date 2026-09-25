-- CreateIndex
CREATE UNIQUE INDEX "Participant_eventId_busId_order_key" ON "Participant"("eventId", "busId", "order");