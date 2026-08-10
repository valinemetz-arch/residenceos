import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { space: true, system: true, _count: { select: { photos: true, documents: true } } },
    });

    if (!asset) return NextResponse.json(errorResponse("Asset not found"), { status: 404 });

    return NextResponse.json(successResponse(asset));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch asset"), { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.manufacturer !== undefined) data.manufacturer = body.manufacturer || null;
    if (body.model !== undefined) data.model = body.model || null;
    if (body.sku !== undefined) data.sku = body.sku || null;
    if (body.finish !== undefined) data.finish = body.finish || null;
    if (body.cost !== undefined) data.cost = body.cost || null;
    if (body.vendor !== undefined) data.vendor = body.vendor || null;
    if (body.purchaseDate !== undefined) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    if (body.installDate !== undefined) data.installDate = body.installDate ? new Date(body.installDate) : null;
    if (body.warrantyMonths !== undefined) data.warrantyMonths = body.warrantyMonths || null;
    if (body.spaceId !== undefined) data.spaceId = body.spaceId;
    if (body.systemId !== undefined) data.systemId = body.systemId || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const updated = await prisma.asset.update({
      where: { id },
      data,
      include: { space: true, system: true },
    });

    return NextResponse.json(successResponse(updated, "Asset updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update asset"), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.asset.delete({ where: { id } });
    return NextResponse.json(successResponse(null, "Asset deleted"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to delete asset"), { status: 500 });
  }
}
