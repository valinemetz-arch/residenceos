-- Floor-plan takeoff extraction: PlanSet (uploaded PDF), PlanPage (rendered
-- sheet image), TakeoffItem (staged AI-extracted or manual line item), plus
-- tagging Tasks with a Trade so bid-readiness gaps can be assigned per trade.

CREATE TABLE "plan_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT,
    "documentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'rendering',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_pages" (
    "id" TEXT NOT NULL,
    "planSetId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "takeoff_items" (
    "id" TEXT NOT NULL,
    "planSetId" TEXT NOT NULL,
    "planPageId" TEXT,
    "tradeId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "confidence" TEXT NOT NULL,
    "sourceNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "takeoff_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_pages_planSetId_pageNumber_key" ON "plan_pages" ("planSetId", "pageNumber");

ALTER TABLE "plan_sets" ADD CONSTRAINT "plan_sets_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_sets" ADD CONSTRAINT "plan_sets_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "plan_pages" ADD CONSTRAINT "plan_pages_planSetId_fkey"
  FOREIGN KEY ("planSetId") REFERENCES "plan_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "takeoff_items" ADD CONSTRAINT "takeoff_items_planSetId_fkey"
  FOREIGN KEY ("planSetId") REFERENCES "plan_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "takeoff_items" ADD CONSTRAINT "takeoff_items_planPageId_fkey"
  FOREIGN KEY ("planPageId") REFERENCES "plan_pages" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "takeoff_items" ADD CONSTRAINT "takeoff_items_tradeId_fkey"
  FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "plan_sets_projectId_idx" ON "plan_sets" ("projectId");
CREATE INDEX "plan_pages_planSetId_idx" ON "plan_pages" ("planSetId");
CREATE INDEX "takeoff_items_planSetId_idx" ON "takeoff_items" ("planSetId");
CREATE INDEX "takeoff_items_tradeId_idx" ON "takeoff_items" ("tradeId");

-- Tag Tasks with a Trade (mirrors Asset.tradeId) so bid-readiness gap tasks
-- can be assigned to the trade that needs attention.
ALTER TABLE "tasks" ADD COLUMN "tradeId" TEXT;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tradeId_fkey"
  FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "tasks_tradeId_idx" ON "tasks" ("tradeId");
