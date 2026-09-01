import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

// Document types safe to hand to bidding contractors - manufacturer specs
// and submittals they need to bid accurately, never financial/internal docs
// like invoices or other contractors' bids.
const CONTRACTOR_DOC_TYPES = ["spec_sheet", "submittal", "plan", "report", "other"];

// Scope-only fields for bidding contractors - never cost/vendor, which are
// internal budget data (see plan: "scope only, no $" decision).
const SCOPE_SELECT = {
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
    where: { type: { in: CONTRACTOR_DOC_TYPES } },
    select: { id: true, name: true, type: true, fileUrl: true, fileName: true, fileType: true },
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let contractorId: string;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      contractorId = verified.payload.sub as string;
    } catch {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedTradeIds = searchParams.get("tradeIds")?.split(",").filter(Boolean);

    let tradeIds = requestedTradeIds;
    if (!tradeIds || tradeIds.length === 0) {
      const contractorTrades = await prisma.contractorTrade.findMany({
        where: { contractorId },
        select: { tradeId: true },
      });
      tradeIds = contractorTrades.map((ct) => ct.tradeId);
    }

    if (tradeIds.length === 0) {
      return NextResponse.json({ success: true, data: { trades: [], assets: [] } });
    }

    const [trades, assets, takeoffItems, planSets] = await Promise.all([
      prisma.trade.findMany({ where: { id: { in: tradeIds } }, select: { id: true, name: true } }),
      prisma.asset.findMany({
        where: {
          space: { projectId },
          tradeId: { in: tradeIds },
        },
        select: SCOPE_SELECT,
        orderBy: { name: "asc" },
      }),
      // Confirmed, AI-extracted scope items from a floor-plan takeoff - only
      // ones the owner has reviewed and confirmed (never pending/rejected).
      prisma.takeoffItem.findMany({
        where: {
          status: "confirmed",
          tradeId: { in: tradeIds },
          planSet: { projectId },
        },
        select: {
          id: true,
          description: true,
          quantity: true,
          unit: true,
          planPageId: true,
          trade: { select: { id: true, name: true } },
        },
        orderBy: { description: "asc" },
      }),
      // Rendered floor-plan pages, so contractors can see exactly where
      // their scope is located before bidding.
      prisma.planSet.findMany({
        where: { projectId, status: "ready" },
        select: {
          id: true,
          name: true,
          pages: {
            select: { id: true, pageNumber: true, imageUrl: true },
            orderBy: { pageNumber: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ success: true, data: { trades, assets, takeoffItems, planSets } });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to load project scope" },
      { status: 500 }
    );
  }
}
