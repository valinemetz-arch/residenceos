import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const contractorId = searchParams.get("contractorId");
    const status = searchParams.get("status");

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (contractorId) where.contractorId = contractorId;
    if (status) where.status = status;

    const bids = await prisma.bid.findMany({
      where,
      include: {
        project: true,
        contractor: true,
        contract: {
          select: {
            id: true,
            status: true,
            sentAt: true,
            signedAt: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: bids,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bids" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, contractorId, amount, notes } = body;

    // Get contractor ID from auth if not provided
    let finalContractorId = contractorId;
    if (!finalContractorId) {
      // Try to get from token/session - for now, we'll require it to be passed
      return NextResponse.json(
        { success: false, message: "Contractor ID is required" },
        { status: 400 }
      );
    }

    if (!projectId || !amount) {
      return NextResponse.json(
        { success: false, message: "projectId and amount are required" },
        { status: 400 }
      );
    }

    // Check if contractor already bid on this project
    const existingBid = await prisma.bid.findFirst({
      where: {
        projectId,
        contractorId: finalContractorId,
      },
    });

    if (existingBid) {
      return NextResponse.json(
        { success: false, message: "You have already submitted a bid for this project" },
        { status: 400 }
      );
    }

    const bid = await prisma.bid.create({
      data: {
        projectId,
        contractorId: finalContractorId,
        amount: parseFloat(amount),
        notes: notes || null,
        submittedAt: new Date(),
        status: "pending",
      },
      include: {
        project: true,
        contractor: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: bid,
        message: "Bid submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to submit bid" },
      { status: 500 }
    );
  }
}
