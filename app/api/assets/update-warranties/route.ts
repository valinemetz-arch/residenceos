import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

interface WarrantyUpdate {
  assetId: string;
  warrantyType: string | null;
  warrantyDuration: number | null;
  vendor: string | null;
  unitPrice: number | null;
}

interface NewAssetWithWarranty {
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
  warrantyType: string | null;
  warrantyDuration: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates = [], newAssets = [] } = body;

    if (!Array.isArray(updates) && !Array.isArray(newAssets)) {
      return NextResponse.json(
        errorResponse("Invalid request: updates and/or newAssets array required"),
        { status: 400 }
      );
    }

    const results = {
      updatedAssets: 0,
      createdAssets: 0,
      createdWarranties: 0,
    };

    // Update existing assets with warranty info
    for (const update of updates) {
      const { assetId, warrantyType, warrantyDuration, vendor, unitPrice } =
        update as WarrantyUpdate;

      if (!assetId) {
        continue;
      }

      // Update asset with cost and vendor if provided
      await prisma.asset.update({
        where: { id: assetId },
        data: {
          vendor: vendor || undefined,
          cost: unitPrice || undefined,
        },
      });

      results.updatedAssets++;

      // Create warranty record if warranty info provided
      if (warrantyType || warrantyDuration) {
        const startDate = new Date();
        const endDate = new Date();

        if (warrantyDuration) {
          endDate.setMonth(endDate.getMonth() + warrantyDuration);
        } else {
          // Default to 1 year if only type is provided
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Check if warranty already exists for this asset
        const existingWarranty = await prisma.warranty.findFirst({
          where: { assetId },
        });

        if (existingWarranty) {
          // Update existing warranty
          await prisma.warranty.update({
            where: { id: existingWarranty.id },
            data: {
              title: `${warrantyType || "Warranty"} - ${new Date().getFullYear()}`,
              description: warrantyType,
              coverageScope: warrantyType?.includes("limited")
                ? "Limited"
                : "Full",
              startDate,
              endDate,
              months: warrantyDuration,
              status: "active",
            },
          });
        } else {
          // Create new warranty
          await prisma.warranty.create({
            data: {
              title: `${warrantyType || "Warranty"} - ${new Date().getFullYear()}`,
              description: warrantyType,
              coverageScope: warrantyType?.includes("limited")
                ? "Limited"
                : "Full",
              startDate,
              endDate,
              months: warrantyDuration,
              assetId,
              status: "active",
            },
          });
        }

        results.createdWarranties++;
      }
    }

    // Create new assets with warranty info
    for (const newAsset of newAssets) {
      const {
        name,
        manufacturer,
        model,
        sku,
        vendor,
        cost,
        status,
        notes,
        spaceId,
        systemId,
        warrantyType,
        warrantyDuration,
      } = newAsset as NewAssetWithWarranty;

      if (!name || !spaceId) {
        continue;
      }

      // Create asset
      const createdAsset = await prisma.asset.create({
        data: {
          name,
          manufacturer: manufacturer || null,
          model: model || null,
          sku: sku || null,
          vendor: vendor || null,
          cost: cost || null,
          status: status || "pending",
          notes: notes || null,
          spaceId,
          systemId: systemId || null,
        },
      });

      results.createdAssets++;

      // Create warranty record if warranty info provided
      if (warrantyType || warrantyDuration) {
        const startDate = new Date();
        const endDate = new Date();

        if (warrantyDuration) {
          endDate.setMonth(endDate.getMonth() + warrantyDuration);
        } else {
          // Default to 1 year if only type is provided
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        await prisma.warranty.create({
          data: {
            title: `${warrantyType || "Warranty"} - ${new Date().getFullYear()}`,
            description: warrantyType,
            coverageScope: warrantyType?.includes("limited")
              ? "Limited"
              : "Full",
            startDate,
            endDate,
            months: warrantyDuration,
            assetId: createdAsset.id,
            status: "active",
          },
        });

        results.createdWarranties++;
      }
    }

    return NextResponse.json(
      successResponse(
        results,
        `Updated ${results.updatedAssets} asset(s) and created ${results.createdAssets} new asset(s) with ${results.createdWarranties} warranty record(s)`
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error("Update warranties error:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to update warranties"
      ),
      { status: 500 }
    );
  }
}
