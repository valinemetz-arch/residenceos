import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const photos = await prisma.photo.findMany({
      where: { spaceId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<ApiResponse<typeof photos>>({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}
