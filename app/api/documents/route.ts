import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // projectId scopes to the contractor bidding/contract subsystem's
    // documents. Omitting it (the Owner Dashboard / Contractor Portal
    // "Project" tab) returns every house document, with the relations
    // needed to group by room and trade-scope by specification.
    const documents = await prisma.document.findMany({
      where: projectId ? { projectId } : {},
      include: {
        space: { select: { id: true, name: true } },
        specification: { select: { id: true, trade: true } },
      },
      orderBy: { revisionDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create a Document record for an already-uploaded
// file (call /api/upload first to get fileUrl/fileName/fileSize/fileType).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.fileUrl || !body.fileName) {
      return NextResponse.json(
        errorResponse("name, fileUrl, and fileName are required"),
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        name: body.name,
        type: body.type || "other",
        fileUrl: body.fileUrl,
        fileName: body.fileName,
        fileSize: body.fileSize || null,
        fileType: body.fileType || null,
        description: body.description || null,
        spaceId: body.spaceId || null,
        assetId: body.assetId || null,
        systemId: body.systemId || null,
        taskId: body.taskId || null,
        specificationId: body.specificationId || null,
        milestoneId: body.milestoneId || null,
        maintenanceId: body.maintenanceId || null,
        budgetItemId: body.budgetItemId || null,
        warrantyId: body.warrantyId || null,
        projectId: body.projectId || null,
        bidId: body.bidId || null,
        contractId: body.contractId || null,
        contractorId: body.contractorId || null,
        changeOrderId: body.changeOrderId || null,
        tradeId: body.tradeId || null,
        visibleToAll: !!body.visibleToAll,
      },
    });

    return NextResponse.json(successResponse(document, "Document created"), {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to create document"), {
      status: 500,
    });
  }
}
