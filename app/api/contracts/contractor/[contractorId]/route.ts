import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractorId: string }> }
) {
  try {
    const { contractorId } = await params;

    if (!contractorId) {
      return NextResponse.json(
        { success: false, message: "Contractor ID is required" },
        { status: 400 }
      );
    }

    // Get all contracts for the contractor
    const contracts = await prisma.contract.findMany({
      where: { contractorId },
      include: {
        contractor: {
          select: {
            id: true,
            email: true,
            companyName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error("Error fetching contractor contracts:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch contracts",
      },
      { status: 500 }
    );
  }
}
