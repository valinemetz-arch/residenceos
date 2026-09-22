import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// TRADE ACCESS: the inventory behind the owner's "which assets/resources
// should be available per trade" admin page. For a given trade, returns
// every Asset, direct-tagged Document, and confirmed spec/elevation
// DocumentPage in the house, each flagged `granted` - true if the resource's
// primary trade tag already matches, or if an additive TradeResourceAccess
// grant exists. Toggling in the UI (POST below) only ever adds/removes the
// additive grant; it never touches the primary tag set on the Asset/Document
// edit form or during spec-page review.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tradeId = searchParams.get("tradeId");
    if (!tradeId) {
      return NextResponse.json(errorResponse("tradeId is required"), { status: 400 });
    }

    const [grants, assets, documents, pages] = await Promise.all([
      prisma.tradeResourceAccess.findMany({ where: { tradeId } }),
      prisma.asset.findMany({
        select: {
          id: true,
          name: true,
          tradeId: true,
          space: { select: { name: true } },
        },
        orderBy: [{ space: { name: "asc" } }, { name: "asc" }],
      }),
      prisma.document.findMany({
        where: { pages: { none: {} } },
        select: { id: true, name: true, tradeId: true, fileName: true },
        orderBy: { name: "asc" },
      }),
      prisma.documentPage.findMany({
        where: { confirmed: true },
        select: {
          id: true,
          pageNumber: true,
          suggestedNote: true,
          confirmedTradeId: true,
          document: { select: { name: true } },
          confirmedSpace: { select: { name: true } },
        },
        orderBy: { pageNumber: "asc" },
      }),
    ]);

    const grantedSet = new Set(grants.map((g) => `${g.resourceType}:${g.resourceId}`));
    const isGranted = (type: string, id: string, primaryTradeId: string | null) =>
      primaryTradeId === tradeId || grantedSet.has(`${type}:${id}`);

    return NextResponse.json(
      successResponse({
        assets: assets.map((a) => ({
          id: a.id,
          label: `${a.name} — ${a.space.name}`,
          isPrimary: a.tradeId === tradeId,
          granted: isGranted("asset", a.id, a.tradeId),
        })),
        documents: documents.map((d) => ({
          id: d.id,
          label: d.name || d.fileName,
          isPrimary: d.tradeId === tradeId,
          granted: isGranted("document", d.id, d.tradeId),
        })),
        pages: pages.map((p) => ({
          id: p.id,
          label: `${p.document.name} — p.${p.pageNumber}${p.confirmedSpace ? ` (${p.confirmedSpace.name})` : ""}${p.suggestedNote ? ` — ${p.suggestedNote}` : ""}`,
          isPrimary: p.confirmedTradeId === tradeId,
          granted: isGranted("documentPage", p.id, p.confirmedTradeId),
        })),
      })
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to load trade access"), { status: 500 });
  }
}

// POST { tradeId, resourceType, resourceId, granted } - add/remove an
// additive grant. Has no effect on (and never removes) a resource's primary
// trade tag - if granted=false and this resource's primary tag IS this
// trade, the grant row (which likely never existed) is simply left alone;
// the resource stays visible via its primary tag until that's changed
// elsewhere.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tradeId, resourceType, resourceId, granted } = body;

    if (!tradeId || !resourceType || !resourceId || typeof granted !== "boolean") {
      return NextResponse.json(
        errorResponse("tradeId, resourceType, resourceId, and granted are required"),
        { status: 400 }
      );
    }
    if (!["asset", "document", "documentPage"].includes(resourceType)) {
      return NextResponse.json(errorResponse("Invalid resourceType"), { status: 400 });
    }

    if (granted) {
      await prisma.tradeResourceAccess.upsert({
        where: { tradeId_resourceType_resourceId: { tradeId, resourceType, resourceId } },
        create: { tradeId, resourceType, resourceId },
        update: {},
      });
    } else {
      await prisma.tradeResourceAccess.deleteMany({
        where: { tradeId, resourceType, resourceId },
      });
    }

    return NextResponse.json(successResponse({ tradeId, resourceType, resourceId, granted }));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update trade access"), { status: 500 });
  }
}
