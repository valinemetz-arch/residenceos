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
    const documents = await prisma.document.findMany({
      where: { assetId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<ApiResponse<typeof documents>>({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching asset documents:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
