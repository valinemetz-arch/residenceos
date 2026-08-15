-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "assignedToContractorId" TEXT,
ADD COLUMN     "assignedById" TEXT,
ADD COLUMN     "assignedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "tasks_assignedToUserId_idx" ON "tasks"("assignedToUserId");

-- CreateIndex
CREATE INDEX "tasks_assignedToContractorId_idx" ON "tasks"("assignedToContractorId");

-- CreateIndex
CREATE INDEX "tasks_assignedById_idx" ON "tasks"("assignedById");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToContractorId_fkey" FOREIGN KEY ("assignedToContractorId") REFERENCES "contractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
