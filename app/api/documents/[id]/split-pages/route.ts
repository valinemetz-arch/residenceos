import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { renderPdfToPngPages } from "@/lib/pdf-render";

// POST /api/documents/[id]/split-pages - splits an already-uploaded spec /
// interior-elevation PDF (a Document row that already has a fileUrl) into
// one rendered PNG per page, staged as DocumentPage rows for AI tagging
// (see /api/documents/[id]/tag-page, driven one page at a time afterward -
// same two-step pattern as /api/plan-sets + /api/plan-sets/[id]/extract-page).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      return NextResponse.json(errorResponse("Document not found"), { status: 404 });
    }

    const existingPages = await prisma.documentPage.count({ where: { documentId } });
    if (existingPages > 0) {
      return NextResponse.json(
        errorResponse("This document has already been split into pages"),
        { status: 400 }
      );
    }

    const pdfRes = await fetch(document.fileUrl);
    if (!pdfRes.ok) {
      return NextResponse.json(
        errorResponse("Failed to retrieve the document's PDF from storage"),
        { status: 500 }
      );
    }
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    let renderedPages;
    try {
      renderedPages = await renderPdfToPngPages(pdfBuffer);
    } catch (renderError) {
      console.error("PDF render failed:", renderError);
      return NextResponse.json(errorResponse("Failed to render PDF pages"), { status: 500 });
    }

    for (const page of renderedPages) {
      const pageBlob = await put(
        `document-pages/${documentId}/page-${page.pageNumber}.png`,
        page.pngBuffer,
        { access: "public", addRandomSuffix: true, contentType: "image/png" }
      );

      await prisma.documentPage.create({
        data: {
          documentId,
          pageNumber: page.pageNumber,
          imageUrl: pageBlob.url,
          status: "pending",
        },
      });
    }

    return NextResponse.json(
      successResponse({ pageCount: renderedPages.length }, "Document split into pages"),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to split document into pages"), {
      status: 500,
    });
  }
}
