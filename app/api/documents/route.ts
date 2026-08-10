import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      fileName,
      fileUrl,
      fileSize,
      fileType,
      type,
      spaceId,
      assetId,
      taskId,
      budgetItemId,
      description,
    } = body;

    if (!fileUrl || !fileName) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "File URL and name required" },
        { status: 400 }
      );
    }

    const data: any = {
      name: name || fileName,
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      fileType: fileType || "unknown",
      type: type || "other",
      description: description || null,
    };

    if (spaceId) data.space = { connect: { id: spaceId } };
    if (assetId) data.asset = { connect: { id: assetId } };
    if (taskId) data.task = { connect: { id: taskId } };
    if (budgetItemId) data.budgetItem = { connect: { id: budgetItemId } };

    const document = await prisma.document.create({ data });

    return NextResponse.json<ApiResponse<typeof document>>(
      { success: true, data: document },
      { status: 201 }
    );
  } catch (error) {
    console.error("Document creation error:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to create document record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "Document ID required" },
        { status: 400 }
      );
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json<ApiResponse<unknown>>(
      { success: true }
    );
  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
