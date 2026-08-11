import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/spaces - List all spaces
export async function GET(req: NextRequest) {
  try {
    const spaces = await prisma.space.findMany({
      include: {
        assets: { select: { id: true, name: true } },
        systems: { select: { id: true, name: true } },
        _count: {
          select: { assets: true, tasks: true, photos: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(successResponse(spaces));
  } catch (error) {
    return NextResponse.json(
      errorResponse("Failed to fetch spaces"),
      { status: 500 }
    );
  }
}

// POST /api/spaces - Create new space
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const space = await prisma.space.create({
      data: {
        name: body.name,
        building: body.building || "Main Residence",
        floor: body.floor != null ? String(body.floor) : null,
        squareFootage: body.squareFootage || null,
        description: body.description || null,
      },
      include: {
        _count: {
          select: { assets: true, tasks: true, photos: true },
        },
      },
    });

    return NextResponse.json(successResponse(space, "Space created"), {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      errorResponse("Failed to create space"),
      { status: 500 }
    );
  }
}