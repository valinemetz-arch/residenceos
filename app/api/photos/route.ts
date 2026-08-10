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
    const { url, fileUrl, caption, spaceId, assetId, taskId, budgetItemId } =
      body;

    if (!fileUrl) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "File URL required" },
        { status: 400 }
      );
    }

    const data: any = {
      url: fileUrl,
      caption: caption || null,
    };

    if (spaceId) data.space = { connect: { id: spaceId } };
    if (assetId) data.asset = { connect: { id: assetId } };
    if (taskId) data.task = { connect: { id: taskId } };
    if (budgetItemId) data.budgetItem = { connect: { id: budgetItemId } };

    const photo = await prisma.photo.create({ data });

    return NextResponse.json<ApiResponse<typeof photo>>(
      { success: true, data: photo },
      { status: 201 }
    );
  } catch (error) {
    console.error("Photo creation error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Failed to create photo record";
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("id");

    if (!photoId) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "Photo ID required" },
        { status: 400 }
      );
    }

    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json<ApiResponse<unknown>>(
      { success: true }
    );
  } catch (error) {
    console.error("Photo deletion error:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
