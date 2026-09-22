-- Trade Access: an additive "also visible to this trade" grant layered on
-- top of a resource's primary trade tag, so the owner can hand-pick extra
-- assets/specs a trade should see from the Trade Access admin page.

CREATE TABLE "trade_resource_access" (
  "id" TEXT NOT NULL,
  "tradeId" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "trade_resource_access_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trade_resource_access_tradeId_resourceType_resourceId_key"
  ON "trade_resource_access"("tradeId", "resourceType", "resourceId");

ALTER TABLE "trade_resource_access"
  ADD CONSTRAINT "trade_resource_access_tradeId_fkey"
  FOREIGN KEY ("tradeId") REFERENCES "trades"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
