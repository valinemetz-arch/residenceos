import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function POST(req: NextRequest) {
  try {
    // Get token from cookie
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token
    const verified = await jwtVerify(token, JWT_SECRET);
    const contractorId = verified.payload.sub;

    if (!contractorId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update last accessed time
    await prisma.contractor.update({
      where: { id: contractorId as string },
      data: { lastAccessedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Access tracked",
    });
  } catch (error) {
    console.error("Error tracking access:", error);
    // Don't return error - this shouldn't block the contractor
    return NextResponse.json(
      { success: false, message: "Failed to track access" },
      { status: 500 }
    );
  }
}
