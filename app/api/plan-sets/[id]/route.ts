import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const planSet = await prisma.planSet.findUnique({
      where: { id },
      include: {
        pages: { orderBy: { pageNumber: "asc" } },
        items: {
          include: { trade: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!planSet) {
      return NextResponse.json(errorResponse("Plan set not found"), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(planSet));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch plan set"), {
      status: 500,
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.planSet.delete({ where: { id } });
    return NextResponse.json(successResponse(null, "Plan set deleted"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to delete plan set"), {
      status: 500,
    });
  }
}
