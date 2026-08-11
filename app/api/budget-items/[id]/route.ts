import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/budget-items/[id] - Get a single budget item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const budgetItem = await prisma.budgetItem.findUnique({
      where: { id },
      include: {
        space: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true } },
        system: { select: { id: true, name: true } },
        photos: true,
        documents: true,
      },
    });

    if (!budgetItem) {
      return NextResponse.json(errorResponse("Budget item not found"), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(budgetItem));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Failed to fetch budget item"),
      { status: 500 }
    );
  }
}

// PUT /api/budget-items/[id] - Update a budget item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const budgetItem = await prisma.budgetItem.update({
      where: { id },
      data: {
        category: body.category,
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

    return NextResponse.json(successResponse(budgetItem, "Budget item updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Failed to update budget item"),
      { status: 500 }
    );
  }
}

// DELETE /api/budget-items/[id] - Delete a budget item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Delete related photos and documents
    await prisma.photo.deleteMany({ where: { budgetItemId: id } });
    await prisma.document.deleteMany({ where: { budgetItemId: id } });

    // Delete the budget item
    await prisma.budgetItem.delete({ where: { id } });

    return NextResponse.json(
      successResponse(null, "Budget item deleted successfully")
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Failed to delete budget item"),
      { status: 500 }
    );
  }
}
