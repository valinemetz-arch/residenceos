/*
  Warnings:

  - You are about to drop the column `docusignEnvelopeId` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `docusignSigningUrl` on the `contracts` table. All the data in the column will be lost.
  - Added the required column `signerEmail` to the `contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signerName` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "bidId" TEXT,
    "contractorId" TEXT NOT NULL,
    "envelopeId" TEXT,
    "signingUrl" TEXT,
    "signerEmail" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "projectDetails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" DATETIME,
    "completedAt" DATETIME,
    "documentUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contracts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_contracts" ("bidId", "contractorId", "createdAt", "id", "sentAt", "signedAt", "status", "updatedAt") SELECT "bidId", "contractorId", "createdAt", "id", coalesce("sentAt", CURRENT_TIMESTAMP) AS "sentAt", "signedAt", "status", "updatedAt" FROM "contracts";
DROP TABLE "contracts";
ALTER TABLE "new_contracts" RENAME TO "contracts";
CREATE UNIQUE INDEX "contracts_bidId_key" ON "contracts"("bidId");
CREATE UNIQUE INDEX "contracts_envelopeId_key" ON "contracts"("envelopeId");
CREATE INDEX "contracts_contractorId_idx" ON "contracts"("contractorId");
CREATE INDEX "contracts_envelopeId_idx" ON "contracts"("envelopeId");
CREATE INDEX "contracts_status_idx" ON "contracts"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
