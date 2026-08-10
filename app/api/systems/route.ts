import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/systems - List all building systems
export async function GET() {
  try {
    const systems = await prisma.system.findMany({
      include: {
        assets: { select: { id: true, name: true } },
        spaces: { select: { id: true, name: true } },
        _count: {
          select: { assets: true, tasks: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(successResponse(systems));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch systems"), {
      status: 500,
    });
  }
}

// POST /api/systems - Create new system
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const system = await prisma.system.create({
      data: {
        name: body.name,
        systemType: body.systemType || body.name,
        description: body.description || null,
      },
    });

    return NextResponse.json(successResponse(system, "System created"), {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to create system"), {
      status: 500,
    });
  }
}
