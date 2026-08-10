import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/assets - List all assets
export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        space: { select: { id: true, name: true } },
        system: { select: { id: true, name: true } },
        _count: {
          select: { photos: true, documents: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(successResponse(assets));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch assets"), { status: 500 });
  }
}

// POST /api/assets - Create new asset
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const asset = await prisma.asset.create({
      data: {
        name: body.name,
        manufacturer: body.manufacturer || null,
        model: body.model || null,
        sku: body.sku || null,
        finish: body.finish || null,
        cost: body.cost || null,
        vendor: body.vendor || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        installDate: body.installDate ? new Date(body.installDate) : null,
        warrantyMonths: body.warrantyMonths || null,
        spaceId: body.spaceId,
        systemId: body.systemId || null,
        status: body.status || "pending",
        notes: body.notes || null,
        qrCode: null,
      },
      include: {
        space: true,
        system: true,
      },
    });

    return NextResponse.json(successResponse(asset, "Asset created"), {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to create asset"), { status: 500 });
  }
}
