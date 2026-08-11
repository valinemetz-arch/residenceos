-- AlterTable
ALTER TABLE "contractors" ADD COLUMN "insuranceDocument" TEXT;
ALTER TABLE "contractors" ADD COLUMN "lastAccessedAt" DATETIME;
ALTER TABLE "contractors" ADD COLUMN "lastReminderSentAt" DATETIME;
ALTER TABLE "contractors" ADD COLUMN "licenseDocument" TEXT;
ALTER TABLE "contractors" ADD COLUMN "logo" TEXT;
ALTER TABLE "contractors" ADD COLUMN "website" TEXT;

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractorId" TEXT,
    "senderType" TEXT NOT NULL,
    "senderName" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "messages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
