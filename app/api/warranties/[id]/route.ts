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
    const warranty = await prisma.warranty.findUnique({
      where: { id },
      include: {
        asset: { select: { id: true, name: true } },
        space: { select: { id: true, name: true } },
      },
    });

    if (!warranty) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "Warranty not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof warranty>>({
      success: true,
      data: warranty,
    });
  } catch (error) {
    console.error("Error fetching warranty:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to fetch warranty" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const {
      title,
      description,
      coverageScope,
      startDate,
      endDate,
      months,
      assetId,
      spaceId,
      provider,
      phone,
      email,
      website,
      claimProcess,
      serialNumber,
      status,
    } = body;

    const warranty = await prisma.warranty.update({
      where: { id },
      data: {
        title,
        description,
        coverageScope,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        months,
        status,
        provider,
        phone,
        email,
        website,
        claimProcess,
        serialNumber,
        isExpired: new Date(endDate) < new Date(),
        ...(assetId !== undefined && assetId !== null
          ? { asset: { connect: { id: assetId } } }
          : { asset: { disconnect: true } }),
        ...(spaceId !== undefined && spaceId !== null
          ? { space: { connect: { id: spaceId } } }
          : { space: { disconnect: true } }),
      },
      include: {
        asset: { select: { id: true, name: true } },
        space: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json<ApiResponse<typeof warranty>>({
      success: true,
      data: warranty,
    });
  } catch (error) {
    console.error("Error updating warranty:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to update warranty" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.warranty.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting warranty:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to delete warranty" },
      { status: 500 }
    );
  }
}
