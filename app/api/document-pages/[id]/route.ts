import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// PATCH /api/document-pages/[id] - confirm (or correct) a page's Space/Trade
// tag. Only confirmed pages appear on the Field Reference page. Passing
// confirmedSpaceId/confirmedTradeId explicitly (including null) lets an
// admin accept the AI suggestion as-is, override it, or clear a tag.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.confirmedSpaceId !== undefined) data.confirmedSpaceId = body.confirmedSpaceId || null;
    if (body.confirmedTradeId !== undefined) data.confirmedTradeId = body.confirmedTradeId || null;
    if (body.confirmed !== undefined) data.confirmed = !!body.confirmed;

    const page = await prisma.documentPage.update({
      where: { id },
      data,
      select: {
        id: true,
        pageNumber: true,
        confirmed: true,
        confirmedSpace: { select: { id: true, name: true } },
        confirmedTrade: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(successResponse(page, "Page updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update page"), { status: 500 });
  }
}
