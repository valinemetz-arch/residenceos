import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

interface SpaceInput {
  name: string;
  floor: string | null;
  building: string | null;
  squareFootage: number | null;
  description: string | null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { spaces } = body;

    if (!Array.isArray(spaces) || spaces.length === 0) {
      return NextResponse.json(
        errorResponse("Invalid request: spaces array required"),
        { status: 400 }
      );
    }

    // Validate all spaces have required fields
    for (const space of spaces) {
      if (!space.name) {
        return NextResponse.json(
          errorResponse(
            "All spaces must have a name"
          ),
          { status: 400 }
        );
      }
    }

    // Create all spaces in bulk
    const createdSpaces = await Promise.all(
      spaces.map((space: SpaceInput) =>
        prisma.space.create({
          data: {
            name: space.name,
            building: space.building || "Main Residence",
            floor: space.floor || null,
            squareFootage: space.squareFootage || null,
            description: space.description || null,
            status: "planned",
          },
          include: {
            _count: {
              select: { assets: true, tasks: true, photos: true },
            },
          },
        })
      )
    );

    return NextResponse.json(
      successResponse(
        createdSpaces,
        `Successfully created ${createdSpaces.length} space(s)`
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk create error:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to create spaces"
      ),
      { status: 500 }
    );
  }
}
