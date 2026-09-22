import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/documents/[id]/pages - list every split page of a Document, with
// its AI suggestion and (if set) confirmed tag, for the review screen.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    const pages = await prisma.documentPage.findMany({
      where: { documentId },
      select: {
        id: true,
        pageNumber: true,
        imageUrl: true,
        status: true,
        suggestedNote: true,
        confirmed: true,
        suggestedSpace: { select: { id: true, name: true } },
        suggestedTrade: { select: { id: true, name: true } },
        confirmedSpace: { select: { id: true, name: true } },
        confirmedTrade: { select: { id: true, name: true } },
      },
      orderBy: { pageNumber: "asc" },
    });

    return NextResponse.json(successResponse(pages));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch document pages"), { status: 500 });
  }
}
