-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "building" TEXT NOT NULL DEFAULT 'Main Residence',
    "floor" TEXT,
    "squareFootage" REAL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "sku" TEXT,
    "finish" TEXT,
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
    "barcode" TEXT,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assets_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assets_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "systems" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "specifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "csiDivision" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "revisionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" TEXT,
    "systemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "specifications_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "specifications_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
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
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "revisionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "spaceId" TEXT,
    "assetId" TEXT,
    "systemId" TEXT,
    "taskId" TEXT,
    "specificationId" TEXT,
    "milestoneId" TEXT,
    "maintenanceId" TEXT,
    "description" TEXT,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documents_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "specifications" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "takeDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "constructionPhase" TEXT,
    "spaceId" TEXT,
    "assetId" TEXT,
    "systemId" TEXT,
    "taskId" TEXT,
    "specificationId" TEXT,
    "milestoneId" TEXT,
    "notes" TEXT,
    "maintenanceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "photos_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "specifications" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budgetedAmount" REAL NOT NULL,
    "actualAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "spaceId" TEXT,
    "assetId" TEXT,
    "systemId" TEXT,
    "vendor" TEXT,
    "dueDate" DATETIME,
    "paidDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "budget_items_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "budget_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "budget_items_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "interval" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "systemId" TEXT,
    "instructions" TEXT,
    "lastCompleted" DATETIME,
    "nextDue" DATETIME,
    "vendor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "maintenance_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phase" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startDate" DATETIME,
    "completedDate" DATETIME,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_SpaceToSystem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SpaceToSystem_A_fkey" FOREIGN KEY ("A") REFERENCES "spaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SpaceToSystem_B_fkey" FOREIGN KEY ("B") REFERENCES "systems" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AssetToSpecification" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AssetToSpecification_A_fkey" FOREIGN KEY ("A") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AssetToSpecification_B_fkey" FOREIGN KEY ("B") REFERENCES "specifications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_SpaceToSystem_AB_unique" ON "_SpaceToSystem"("A", "B");

-- CreateIndex
CREATE INDEX "_SpaceToSystem_B_index" ON "_SpaceToSystem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AssetToSpecification_AB_unique" ON "_AssetToSpecification"("A", "B");

-- CreateIndex
CREATE INDEX "_AssetToSpecification_B_index" ON "_AssetToSpecification"("B");
