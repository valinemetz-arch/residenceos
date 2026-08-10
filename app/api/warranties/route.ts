import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function GET(request: Request) {
  try {
    const warranties = await prisma.warranty.findMany({
      include: {
        asset: { select: { id: true, name: true } },
        space: { select: { id: true, name: true } },
      },
      orderBy: { endDate: "asc" },
    });

    return NextResponse.json<ApiResponse<typeof warranties>>({
      success: true,
      data: warranties,
    });
  } catch (error) {
    console.error("Error fetching warranties:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to fetch warranties" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    if (!title || !startDate || !endDate) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "Title, start date, and end date are required" },
        { status: 400 }
      );
    }

    const warranty = await prisma.warranty.create({
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
        ...(assetId && { asset: { connect: { id: assetId } } }),
        ...(spaceId && { space: { connect: { id: spaceId } } }),
      },
      include: {
        asset: { select: { id: true, name: true } },
        space: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json<ApiResponse<typeof warranty>>(
      { success: true, data: warranty },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating warranty:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      { success: false, error: "Failed to create warranty" },
      { status: 500 }
    );
  }
}
