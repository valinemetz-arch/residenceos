import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, companyName, contactName, phone } = body;

    console.log("Signup request:", { email, companyName });

    if (!email || !password || !companyName) {
      return NextResponse.json(
        { success: false, message: "Email, password, and company name are required" },
        { status: 400 }
      );
    }

    const existingContractor = await prisma.contractor.findUnique({
      where: { email },
    });

    if (existingContractor) {
      return NextResponse.json(
        { success: false, message: "Contractor with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Creating contractor...");
    const contractor = await prisma.contractor.create({
      data: {
        email,
        password: hashedPassword,
        companyName,
        contactName: contactName || null,
        phone: phone || null,
      },
    });
    console.log("Contractor created:", contractor.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: contractor.id,
          email: contractor.email,
          companyName: contractor.companyName,
        },
        message: "Contractor registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to register contractor", error: String(error) },
      { status: 500 }
    );
  }
}
