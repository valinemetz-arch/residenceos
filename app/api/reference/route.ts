import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

// FIELD REFERENCE: what a contractor sees after being assigned a trade, or
// what the homeowner/GC sees for any trade or space - every installed-product
// Asset, spec/interior-elevation sheet, confirmed takeoff quantity, and the
// house floor plan, toggled by Trade ("everything a plumber needs, every
// space") or by Space ("everything installed in the Primary Bathroom, every
// trade").
//
// ?mode=trade&tradeId=X or ?mode=space&spaceId=Y
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const tradeId = searchParams.get("tradeId");
    const spaceId = searchParams.get("spaceId");

    if (mode !== "trade" && mode !== "space") {
      return NextResponse.json(errorResponse("mode must be 'trade' or 'space'"), { status: 400 });
    }
    if (mode === "trade" && !tradeId) {
      return NextResponse.json(errorResponse("tradeId is required for mode=trade"), { status: 400 });
    }
    if (mode === "space" && !spaceId) {
      return NextResponse.json(errorResponse("spaceId is required for mode=space"), { status: 400 });
    }

    // A contractor may only pull up their own assigned trade(s) this way -
    // not gated at all for mode=space, since seeing every trade's work in a
    // room they're standing in is the whole point of that view. Captured
    // here (not just checked) so the document query below can also surface
    // anything uploaded to this contractor specifically.
    const token = req.cookies.get("token")?.value;
    let requestingContractorId: string | null = null;
    if (token) {
      try {
        const verified = await jwtVerify(token, JWT_SECRET);
        requestingContractorId = verified.payload.sub as string;
      } catch {
        // Not a contractor token (or expired) - treat as an internal/admin
        // request, matching the rest of the app's unauthenticated APIs.
      }
    }
    if (mode === "trade" && requestingContractorId) {
      const owns = await prisma.contractorTrade.findFirst({
        where: { contractorId: requestingContractorId, tradeId: tradeId! },
      });
      if (!owns) {
        return NextResponse.json(errorResponse("Not assigned to this trade"), { status: 403 });
      }
    }

    // Additive grants (see Trade Access admin page) layer on top of each
    // resource's primary trade tag - only relevant in mode=trade.
    const grants =
      mode === "trade"
        ? await prisma.tradeResourceAccess.findMany({ where: { tradeId: tradeId! } })
        : [];
    const grantedIds = (type: string) => grants.filter((g) => g.resourceType === type).map((g) => g.resourceId);

    const assetWhere =
      mode === "trade"
        ? { OR: [{ tradeId: tradeId! }, { id: { in: grantedIds("asset") } }] }
        : { spaceId: spaceId! };
    // A Document can be tagged to a Trade (group of contractors), one
    // specific Contractor, or everyone (visibleToAll) - see the upload
    // form's "Visible to" picker. mode=trade shows all three that apply to
    // the requesting trade/contractor; mode=space is unfiltered by "who",
    // same as assets/pages there.
    const documentWhere =
      mode === "trade"
        ? {
            OR: [
              { tradeId: tradeId! },
              { id: { in: grantedIds("document") } },
              { visibleToAll: true },
              ...(requestingContractorId ? [{ contractorId: requestingContractorId }] : []),
            ],
            pages: { none: {} },
          }
        : { spaceId: spaceId!, pages: { none: {} } };
    const pageWhere =
      mode === "trade"
        ? {
            confirmed: true,
            OR: [{ confirmedTradeId: tradeId! }, { id: { in: grantedIds("documentPage") } }],
          }
        : { confirmed: true, confirmedSpaceId: spaceId! };

    const [trade, space, assets, documents, pages, takeoffItems, planSets] = await Promise.all([
      mode === "trade" ? prisma.trade.findUnique({ where: { id: tradeId! }, select: { id: true, name: true } }) : null,
      mode === "space" ? prisma.space.findUnique({ where: { id: spaceId! }, select: { id: true, name: true } }) : null,
      prisma.asset.findMany({
        where: assetWhere,
        select: {
          id: true,
          name: true,
          manufacturer: true,
          model: true,
          finish: true,
          size: true,
          status: true,
          notes: true,
          space: { select: { id: true, name: true } },
          system: { select: { id: true, name: true } },
          trade: { select: { id: true, name: true } },
          documents: {
            select: { id: true, name: true, fileUrl: true, fileName: true, type: true },
          },
        },
        orderBy: [{ space: { name: "asc" } }, { name: "asc" }],
      }),
      prisma.document.findMany({
        where: documentWhere,
        select: { id: true, name: true, fileUrl: true, fileName: true, type: true, description: true },
        orderBy: { name: "asc" },
      }),
      prisma.documentPage.findMany({
        where: pageWhere,
        select: {
          id: true,
          pageNumber: true,
          imageUrl: true,
          suggestedNote: true,
          document: { select: { id: true, name: true, fileUrl: true, fileName: true } },
          confirmedSpace: { select: { id: true, name: true } },
          confirmedTrade: { select: { id: true, name: true } },
        },
        orderBy: { pageNumber: "asc" },
      }),
      // Confirmed AI-extracted takeoff quantities - trade-scoped only
      // (there's no per-space breakdown on a takeoff item), for the
      // downloadable material list.
      mode === "trade"
        ? prisma.takeoffItem.findMany({
            where: { status: "confirmed", tradeId: tradeId! },
            select: { id: true, description: true, quantity: true, unit: true },
            orderBy: { description: "asc" },
          })
        : [],
      // Full house floor plan - shown unfiltered to any assigned trade or
      // space lookup, matching the existing contractor bidding scope view
      // (ProjectScope.tsx), which shows the whole set rather than trying to
      // cut it into per-trade sheets.
      prisma.planSet.findMany({
        where: { status: "ready" },
        select: {
          id: true,
          name: true,
          pages: { select: { id: true, pageNumber: true, imageUrl: true }, orderBy: { pageNumber: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (mode === "trade" && !trade) {
      return NextResponse.json(errorResponse("Trade not found"), { status: 404 });
    }
    if (mode === "space" && !space) {
      return NextResponse.json(errorResponse("Space not found"), { status: 404 });
    }

    return NextResponse.json(
      successResponse({ trade, space, assets, documents, pages, takeoffItems, planSets })
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to load field reference"), { status: 500 });
  }
}
