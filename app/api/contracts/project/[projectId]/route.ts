import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get all contracts for the project
    const contracts = await prisma.contract.findMany({
      where: { projectId },
      include: {
        contractor: {
          select: {
            id: true,
            email: true,
            companyName: true,
            contactName: true,
          },
        },
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error("Error fetching project contracts:", error);
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
