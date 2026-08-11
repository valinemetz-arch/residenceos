import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        errorResponse("Email and password are required"),
        { status: 400 }
      );
    }

    // Find contractor
    const contractor = await prisma.contractor.findUnique({
      where: { email },
    });

    if (!contractor) {
      console.log(`Contractor not found: ${email}`);
      return NextResponse.json(
        errorResponse("Invalid email or password"),
        { status: 401 }
      );
    }

    console.log(`Contractor found: ${contractor.id}`);

    // Verify password
    const passwordMatch = await bcrypt.compare(password, contractor.password);
    if (!passwordMatch) {
      return NextResponse.json(
        errorResponse("Invalid email or password"),
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      sub: contractor.id,
      email: contractor.email,
      role: "contractor",
      type: "contractor",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Create response with cookie
    const response = NextResponse.json(
      successResponse(
        {
          id: contractor.id,
          email: contractor.email,
          companyName: contractor.companyName,
          role: "contractor",
        },
        "Login successful"
      )
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Failed to login"),
      { status: 500 }
    );
  }
}
