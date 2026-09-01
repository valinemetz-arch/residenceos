import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

async function getContractorId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return (verified.payload.sub as string) || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const contractorId = await getContractorId(req);
    if (!contractorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trades = await prisma.contractorTrade.findMany({
      where: { contractorId },
      include: { trade: true },
    });

    return NextResponse.json(
      {
        trades: trades.map((ct) => ({
          id: ct.trade.id,
          name: ct.trade.name,
        })),
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
    const contractorId = await getContractorId(req);
    if (!contractorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tradeIds } = await req.json();
    if (!Array.isArray(tradeIds)) {
      return NextResponse.json(
        { error: "tradeIds must be an array" },
        { status: 400 }
      );
    }

    // Replace this contractor's trades - never another contractor's, since
    // contractorId comes only from the verified session token above.
    await prisma.contractorTrade.deleteMany({ where: { contractorId } });

    if (tradeIds.length > 0) {
      const validTrades = await prisma.trade.findMany({
        where: { id: { in: tradeIds } },
      });

      if (validTrades.length > 0) {
        await prisma.contractorTrade.createMany({
          data: validTrades.map((trade) => ({
            contractorId,
            tradeId: trade.id,
          })),
        });
      }
    }

    const updatedTrades = await prisma.contractorTrade.findMany({
      where: { contractorId },
      include: { trade: true },
    });

    return NextResponse.json(
      {
        message: "Trades updated successfully",
        trades: updatedTrades.map((ct) => ({
          id: ct.trade.id,
          name: ct.trade.name,
        })),
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
