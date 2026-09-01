-- Tag assets with a Trade so contractors can be shown only the scope
-- relevant to the trade(s) they bid (assets, takeoffs, selections).
ALTER TABLE "assets" ADD COLUMN "tradeId" TEXT;

ALTER TABLE "assets" ADD CONSTRAINT "assets_tradeId_fkey"
  FOREIGN KEY ("tradeId") REFERENCES "trades" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "assets_tradeId_idx" ON "assets" ("tradeId");

-- Let a bid clarify whether the price includes installation labor and
-- roughly how long installation will take.
ALTER TABLE "bids" ADD COLUMN "includesInstallation" BOOLEAN;
ALTER TABLE "bids" ADD COLUMN "installEstimate" TEXT;
