import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/budget-items - List all budget items
export async function GET(req: NextRequest) {
  try {
    const budgetItems = await prisma.budgetItem.findMany({
      include: {
        space: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true } },
        system: { select: { id: true, name: true } },
        photos: true,
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(budgetItems));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Failed to fetch budget items"),
      { status: 500 }
    );
  }
}

// POST /api/budget-items - Create new budget item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const budgetItem = await prisma.budgetItem.create({
      data: {
        category: body.category || "other",
        description: body.description,
        budgetedAmount: body.budgetedAmount || 0,
        actualAmount: body.actualAmount || null,
        status: body.status || "pending",
        spaceId: body.spaceId || null,
        assetId: body.assetId || null,
        systemId: body.systemId || null,
        vendor: body.vendor || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        paidDate: body.paidDate ? new Date(body.paidDate) : null,
        notes: body.notes || null,
      },
      include: {
        space: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true } },
        system: { select: { id: true, name: true } },
        photos: true,
        documents: true,
      },
    });

    return NextResponse.json(
      successResponse(budgetItem, "Budget item created"),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Failed to create budget item"),
      { status: 500 }
    );
  }
}
