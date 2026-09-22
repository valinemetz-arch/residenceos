-- AlterTable
ALTER TABLE "bids" ADD COLUMN "includesInstallation" BOOLEAN;
ALTER TABLE "bids" ADD COLUMN "installEstimate" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "gateCode" TEXT;
ALTER TABLE "projects" ADD COLUMN "phase" TEXT;

-- CreateTable
CREATE TABLE "project_timeline_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dateLabel" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_timeline_steps_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_contacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "plan_sets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "projectId" TEXT,
    "documentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'rendering',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "plan_sets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "plan_sets_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plan_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planSetId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_pages_planSetId_fkey" FOREIGN KEY ("planSetId") REFERENCES "plan_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "takeoff_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planSetId" TEXT NOT NULL,
    "planPageId" TEXT,
    "tradeId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "confidence" TEXT NOT NULL,
    "sourceNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "takeoff_items_planSetId_fkey" FOREIGN KEY ("planSetId") REFERENCES "plan_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "takeoff_items_planPageId_fkey" FOREIGN KEY ("planPageId") REFERENCES "plan_pages" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "takeoff_items_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contractor_trades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contractor_trades_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contractor_trades_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_trades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_trades_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_trades_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admin_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "sku" TEXT,
    "finish" TEXT,
    "size" TEXT,
    "cost" REAL,
    "vendor" TEXT,
    "purchaseDate" DATETIME,
    "installDate" DATETIME,
    "warrantyMonths" INTEGER,
    "warrantyExpires" DATETIME,
    "manualUrl" TEXT,
    "replacementParts" TEXT,
    "spaceId" TEXT NOT NULL,
    "systemId" TEXT,
    "tradeId" TEXT,
    "barcode" TEXT,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assets_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assets_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "assets_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_assets" ("barcode", "cost", "createdAt", "finish", "id", "installDate", "manualUrl", "manufacturer", "model", "name", "notes", "purchaseDate", "qrCode", "replacementParts", "sku", "spaceId", "status", "systemId", "updatedAt", "vendor", "warrantyExpires", "warrantyMonths") SELECT "barcode", "cost", "createdAt", "finish", "id", "installDate", "manualUrl", "manufacturer", "model", "name", "notes", "purchaseDate", "qrCode", "replacementParts", "sku", "spaceId", "status", "systemId", "updatedAt", "vendor", "warrantyExpires", "warrantyMonths" FROM "assets";
DROP TABLE "assets";
ALTER TABLE "new_assets" RENAME TO "assets";
CREATE TABLE "new_contractors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "role" TEXT NOT NULL DEFAULT 'contractor',
    "website" TEXT,
    "logo" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" DATETIME,
    "licenseDocument" TEXT,
    "insuranceExpiry" DATETIME,
    "insuranceDocument" TEXT,
    "lastAccessedAt" DATETIME,
    "lastReminderSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_contractors" ("address", "companyName", "contactName", "createdAt", "email", "id", "insuranceDocument", "insuranceExpiry", "lastAccessedAt", "lastReminderSentAt", "licenseDocument", "licenseExpiry", "licenseNumber", "logo", "password", "phone", "updatedAt", "website") SELECT "address", "companyName", "contactName", "createdAt", "email", "id", "insuranceDocument", "insuranceExpiry", "lastAccessedAt", "lastReminderSentAt", "licenseDocument", "licenseExpiry", "licenseNumber", "logo", "password", "phone", "updatedAt", "website" FROM "contractors";
DROP TABLE "contractors";
ALTER TABLE "new_contractors" RENAME TO "contractors";
CREATE UNIQUE INDEX "contractors_email_key" ON "contractors"("email");
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" DATETIME,
    "completedDate" DATETIME,
    "spaceId" TEXT,
    "systemId" TEXT,
    "tradeId" TEXT,
    "assignedToUserId" TEXT,
    "assignedToContractorId" TEXT,
    "assignedById" TEXT,
    "assignedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_assignedToContractorId_fkey" FOREIGN KEY ("assignedToContractorId") REFERENCES "contractors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("category", "completedDate", "createdAt", "description", "dueDate", "id", "notes", "priority", "spaceId", "status", "systemId", "title", "updatedAt") SELECT "category", "completedDate", "createdAt", "description", "dueDate", "id", "notes", "priority", "spaceId", "status", "systemId", "title", "updatedAt" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "company" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "trades_name_key" ON "trades"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plan_pages_planSetId_pageNumber_key" ON "plan_pages"("planSetId", "pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "contractor_trades_contractorId_tradeId_key" ON "contractor_trades"("contractorId", "tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "project_trades_projectId_tradeId_key" ON "project_trades"("projectId", "tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invitations_email_key" ON "admin_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invitations_code_key" ON "admin_invitations"("code");
