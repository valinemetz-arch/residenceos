import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contractorId from a custom header or from the request
    const contractorId = req.headers.get("x-contractor-id");
    if (!contractorId) {
      return NextResponse.json(
        { error: "Contractor ID is required" },
        { status: 400 }
      );
    }

    const trades = await prisma.contractorTrade.findMany({
      where: { contractorId },
      include: { trade: true }
    });

    return NextResponse.json(
      {
        trades: trades.map((ct: any) => ({
          id: ct.trade.id,
          name: ct.trade.name
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching contractor trades:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { contractorId, tradeIds } = await req.json();

    if (!contractorId || !Array.isArray(tradeIds)) {
      return NextResponse.json(
        { error: "Contractor ID and trade IDs are required" },
        { status: 400 }
      );
    }

    // Verify contractor exists
    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId }
    });

    if (!contractor) {
      return NextResponse.json(
        { error: "Contractor not found" },
        { status: 404 }
      );
    }

    // Remove existing trades
    await prisma.contractorTrade.deleteMany({
      where: { contractorId }
    });

    // Add new trades
    if (tradeIds.length > 0) {
      const validTrades = await prisma.trade.findMany({
        where: { id: { in: tradeIds } }
      });

      if (validTrades.length > 0) {
        await prisma.contractorTrade.createMany({
          data: validTrades.map((trade: any) => ({
            contractorId,
            tradeId: trade.id
          }))
        });
      }
    }

    const updatedTrades = await prisma.contractorTrade.findMany({
      where: { contractorId },
      include: { trade: true }
    });

    return NextResponse.json(
      {
        message: "Trades updated successfully",
        trades: updatedTrades.map((ct: any) => ({
          id: ct.trade.id,
          name: ct.trade.name
        }))
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating contractor trades:", error);
    return NextResponse.json(
      { error: "Failed to update trades" },
      { status: 500 }
    );
  }
}
