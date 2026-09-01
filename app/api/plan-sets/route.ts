import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { renderPdfToPngPages } from "@/lib/pdf-render";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const planSets = await prisma.planSet.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        _count: { select: { pages: true, items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(planSets));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch plan sets"), {
      status: 500,
    });
  }
}

// POST /api/plan-sets - finalize a plan PDF that's already been uploaded to
// Blob (see /api/plan-sets/upload-token - the browser uploads the file
// directly to Blob storage, bypassing Vercel's 4.5MB Function body limit).
// This route fetches the bytes back from Blob, renders every page to an
// image, and stages it for AI takeoff extraction (driven page-by-page
// afterward via /api/plan-sets/[id]/extract-page, to keep each request
// short).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blobUrl, fileName, fileSize, projectId } = body;
    const name = body.name || fileName;

    if (!blobUrl || !fileName) {
      return NextResponse.json(
        errorResponse("blobUrl and fileName are required"),
        { status: 400 }
      );
    }

    const pdfRes = await fetch(blobUrl);
    if (!pdfRes.ok) {
      return NextResponse.json(
        errorResponse("Failed to retrieve uploaded PDF from storage"),
        { status: 500 }
      );
    }
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    const document = await prisma.document.create({
      data: {
        name: name || fileName,
        type: "plan",
        fileUrl: blobUrl,
        fileName,
        fileSize: fileSize || pdfBuffer.byteLength,
        fileType: "pdf",
        projectId: projectId || null,
      },
    });

    const planSet = await prisma.planSet.create({
      data: {
        name: name || fileName,
        projectId: projectId || null,
        documentId: document.id,
        status: "rendering",
      },
    });

    let renderedPages;
    try {
      renderedPages = await renderPdfToPngPages(pdfBuffer);
    } catch (renderError) {
      console.error("PDF render failed:", renderError);
      await prisma.planSet.update({
        where: { id: planSet.id },
        data: { status: "failed" },
      });
      return NextResponse.json(
        errorResponse("Failed to render PDF pages"),
        { status: 500 }
      );
    }

    for (const page of renderedPages) {
      const pageBlob = await put(
        `plan-sets/${planSet.id}/page-${page.pageNumber}.png`,
        page.pngBuffer,
        { access: "public", addRandomSuffix: true, contentType: "image/png" }
      );

      await prisma.planPage.create({
        data: {
          planSetId: planSet.id,
          pageNumber: page.pageNumber,
          imageUrl: pageBlob.url,
          status: "pending",
        },
      });
    }

    const updated = await prisma.planSet.update({
      where: { id: planSet.id },
      data: { status: "extracting" },
      include: { pages: true },
    });

    return NextResponse.json(
      successResponse(updated, "Plan set uploaded and rendered"),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to create plan set"), {
      status: 500,
    });
  }
}
