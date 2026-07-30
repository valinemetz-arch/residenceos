import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api";

// POST /api/auth/login - User login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        errorResponse("Email and password required"),
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        errorResponse("Invalid credentials"),
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        errorResponse("Invalid credentials"),
        { status: 401 }
      );
    }

    // Create token
    const token = await createToken(user.id);

    return NextResponse.json(
      successResponse({ token, user: { id: user.id, email: user.email, name: user.name } }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Login failed"),
      { status: 500 }
    );
  }
}