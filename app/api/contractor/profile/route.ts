import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function PUT(req: NextRequest) {
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

    const body = await req.json();

    const contractor = await prisma.contractor.update({
      where: { id: contractorId as string },
      data: {
        contactName: body.contactName || undefined,
        phone: body.phone || undefined,
        address: body.address || undefined,
        website: body.website || undefined,
        logo: body.logo || undefined,
        licenseNumber: body.licenseNumber || undefined,
        licenseExpiry: body.licenseExpiry
          ? new Date(body.licenseExpiry)
          : undefined,
        licenseDocument: body.licenseDocument || undefined,
        insuranceExpiry: body.insuranceExpiry
          ? new Date(body.insuranceExpiry)
          : undefined,
        insuranceDocument: body.insuranceDocument || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: contractor,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
