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

    // Get contractor
    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId as string },
      select: {
        id: true,
        email: true,
        companyName: true,
        contactName: true,
        phone: true,
      },
    });

    if (!contractor) {
      return NextResponse.json(errorResponse("Contractor not found"), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(contractor));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch contractor"), {
      status: 500,
    });
  }
}
