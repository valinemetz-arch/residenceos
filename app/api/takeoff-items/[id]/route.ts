import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.description !== undefined) data.description = body.description;
    if (body.quantity !== undefined) data.quantity = body.quantity;
    if (body.unit !== undefined) data.unit = body.unit || null;
    if (body.tradeId !== undefined) data.tradeId = body.tradeId || null;
    if (body.status !== undefined) data.status = body.status; // pending, confirmed, rejected

    const updated = await prisma.takeoffItem.update({
      where: { id },
      data,
      include: { trade: { select: { id: true, name: true } } },
    });

    return NextResponse.json(successResponse(updated, "Takeoff item updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update takeoff item"), {
      status: 500,
    });
  }
}
