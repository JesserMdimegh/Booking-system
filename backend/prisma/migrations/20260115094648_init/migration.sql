/*
  Warnings:

  - A unique constraint covering the columns `[slotId]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "appointments_slotId_key" ON "appointments"("slotId");

-- CreateIndex
CREATE INDEX "slots_startTime_endTime_idx" ON "slots"("startTime", "endTime");
