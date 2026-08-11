import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

interface AssetInput {
  name: string;
  manufacturer: string | null;
  model: string | null;
  sku: string | null;
  vendor: string | null;
  cost: number | null;
  status: string;
  notes: string | null;
  spaceId: string;
  systemId: string | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assets } = body;

    if (!Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        errorResponse("Invalid request: assets array required"),
        { status: 400 }
      );
    }

    // Validate all assets have required fields
    for (const asset of assets) {
      if (!asset.name || !asset.spaceId) {
        return NextResponse.json(
          errorResponse(
            "All assets must have a name and spaceId"
          ),
          { status: 400 }
        );
      }
    }

    // Create all assets in bulk
    const createdAssets = await Promise.all(
      assets.map((asset: AssetInput) =>
        prisma.asset.create({
          data: {
            name: asset.name,
            manufacturer: asset.manufacturer || null,
            model: asset.model || null,
            sku: asset.sku || null,
            finish: null,
            cost: asset.cost || null,
            vendor: asset.vendor || null,
            purchaseDate: null,
            installDate: null,
            warrantyMonths: null,
            spaceId: asset.spaceId,
            systemId: asset.systemId || null,
            status: asset.status || "pending",
            notes: asset.notes || null,
            qrCode: null,
          },
          include: {
            space: { select: { id: true, name: true } },
            system: { select: { id: true, name: true } },
          },
        })
      )
    );

    return NextResponse.json(
      successResponse(
        createdAssets,
        `Successfully created ${createdAssets.length} asset(s)`
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk create error:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to create assets"
      ),
      { status: 500 }
    );
  }
}
