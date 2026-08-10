-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_photos" (
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
    "budgetItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "photos_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "specifications" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "photos_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_photos" ("assetId", "caption", "constructionPhase", "createdAt", "id", "maintenanceId", "milestoneId", "notes", "spaceId", "specificationId", "systemId", "takeDate", "taskId", "updatedAt", "url") SELECT "assetId", "caption", "constructionPhase", "createdAt", "id", "maintenanceId", "milestoneId", "notes", "spaceId", "specificationId", "systemId", "takeDate", "taskId", "updatedAt", "url" FROM "photos";
DROP TABLE "photos";
ALTER TABLE "new_photos" RENAME TO "photos";
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
    "spaceId" TEXT,
    "assetId" TEXT,
    "systemId" TEXT,
    "taskId" TEXT,
    "specificationId" TEXT,
    "milestoneId" TEXT,
    "maintenanceId" TEXT,
    "budgetItemId" TEXT,
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
    CONSTRAINT "documents_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_documents" ("assetId", "createdAt", "description", "fileName", "fileSize", "fileType", "fileUrl", "id", "maintenanceId", "milestoneId", "name", "revisionDate", "spaceId", "specificationId", "systemId", "taskId", "type", "updatedAt", "uploadedBy", "versionNumber") SELECT "assetId", "createdAt", "description", "fileName", "fileSize", "fileType", "fileUrl", "id", "maintenanceId", "milestoneId", "name", "revisionDate", "spaceId", "specificationId", "systemId", "taskId", "type", "updatedAt", "uploadedBy", "versionNumber" FROM "documents";
DROP TABLE "documents";
ALTER TABLE "new_documents" RENAME TO "documents";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
