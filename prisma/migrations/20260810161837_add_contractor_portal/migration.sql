-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "budget" REAL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "contractors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" DATETIME,
    "insuranceExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" DATETIME,
    "documentSnapshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bids_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bids_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bidId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "docusignEnvelopeId" TEXT,
    "docusignSigningUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "signedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contracts_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contracts_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "change_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "originalCost" REAL,
    "adjustmentAmount" REAL NOT NULL,
    "newCost" REAL,
    "scheduleImpact" INTEGER,
    "reason" TEXT,
    "requestedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "change_orders_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_spaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "building" TEXT NOT NULL DEFAULT 'Main Residence',
    "floor" TEXT,
    "squareFootage" REAL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "spaces_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_spaces" ("building", "createdAt", "description", "floor", "id", "name", "notes", "squareFootage", "status", "updatedAt") SELECT "building", "createdAt", "description", "floor", "id", "name", "notes", "squareFootage", "status", "updatedAt" FROM "spaces";
DROP TABLE "spaces";
ALTER TABLE "new_spaces" RENAME TO "spaces";
CREATE TABLE "new_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "revisionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,
    "changeNotes" TEXT,
    "spaceId" TEXT,
    "assetId" TEXT,
    "systemId" TEXT,
    "taskId" TEXT,
    "specificationId" TEXT,
    "milestoneId" TEXT,
    "maintenanceId" TEXT,
    "budgetItemId" TEXT,
    "warrantyId" TEXT,
    "projectId" TEXT,
    "bidId" TEXT,
    "contractId" TEXT,
    "contractorId" TEXT,
    "changeOrderId" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documents_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "specifications" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "warranties" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_changeOrderId_fkey" FOREIGN KEY ("changeOrderId") REFERENCES "change_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_documents" ("assetId", "budgetItemId", "createdAt", "description", "fileName", "fileSize", "fileType", "fileUrl", "id", "maintenanceId", "milestoneId", "name", "revisionDate", "spaceId", "specificationId", "systemId", "taskId", "type", "updatedAt", "uploadedBy", "versionNumber", "warrantyId") SELECT "assetId", "budgetItemId", "createdAt", "description", "fileName", "fileSize", "fileType", "fileUrl", "id", "maintenanceId", "milestoneId", "name", "revisionDate", "spaceId", "specificationId", "systemId", "taskId", "type", "updatedAt", "uploadedBy", "versionNumber", "warrantyId" FROM "documents";
DROP TABLE "documents";
ALTER TABLE "new_documents" RENAME TO "documents";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "contractors_email_key" ON "contractors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_bidId_key" ON "contracts"("bidId");
