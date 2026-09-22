-- Field Reference feature: lets a contractor (once assigned a trade) or the
-- homeowner/GC pull up a space or a trade and see every asset + spec/
-- elevation sheet that applies, toggling between the two.

-- Direct trade tag on Document, for spec/elevation sheets that aren't tied
-- to one specific Asset. visibleToAll covers the third case (everyone) -
-- documents.contractorId already existed for "one specific contractor".
ALTER TABLE "documents" ADD COLUMN "tradeId" TEXT;
ALTER TABLE "documents" ADD COLUMN "visibleToAll" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "documents"
  ADD CONSTRAINT "documents_tradeId_fkey"
  FOREIGN KEY ("tradeId") REFERENCES "trades"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- One rendered page from a multi-page spec/interior-elevation PDF, split
-- page-by-page (same approach as plan_pages) and tagged with the Space +
-- Trade it depicts, AI-suggested then admin-confirmed.
CREATE TABLE "document_pages" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "pageNumber" INTEGER NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "suggestedSpaceId" TEXT,
  "suggestedTradeId" TEXT,
  "suggestedNote" TEXT,
  "confirmedSpaceId" TEXT,
  "confirmedTradeId" TEXT,
  "confirmed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "document_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_pages_documentId_pageNumber_key" ON "document_pages"("documentId", "pageNumber");

ALTER TABLE "document_pages"
  ADD CONSTRAINT "document_pages_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "documents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_pages"
  ADD CONSTRAINT "document_pages_suggestedSpaceId_fkey"
  FOREIGN KEY ("suggestedSpaceId") REFERENCES "spaces"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_pages"
  ADD CONSTRAINT "document_pages_suggestedTradeId_fkey"
  FOREIGN KEY ("suggestedTradeId") REFERENCES "trades"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_pages"
  ADD CONSTRAINT "document_pages_confirmedSpaceId_fkey"
  FOREIGN KEY ("confirmedSpaceId") REFERENCES "spaces"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_pages"
  ADD CONSTRAINT "document_pages_confirmedTradeId_fkey"
  FOREIGN KEY ("confirmedTradeId") REFERENCES "trades"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
