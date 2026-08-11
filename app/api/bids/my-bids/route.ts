import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    // Verify token
    const verified = await jwtVerify(token, JWT_SECRET);
    const contractorId = verified.payload.sub;

    if (!contractorId) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    // Get contractor's bids
    const bids = await prisma.bid.findMany({
      where: { contractorId: contractorId as string },
      include: {
        project: { select: { id: true, name: true, address: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(bids));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch bids"), {
      status: 500,
    });
  }
}
