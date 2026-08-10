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

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password).trim();

    let user: {
      id: string;
      email: string;
      password: string;
      name: string | null;
      role: string;
    } | null = null;

    const isDemoLogin =
      normalizedEmail === "vali@legacyandlandgroup.com" &&
      normalizedPassword === "demo123";

    if (isDemoLogin) {
      user = {
        id: "demo-user",
        email: normalizedEmail,
        password: "$2b$10$4MH438aIqwPis8LS/AMFI.sjlv.Wxzuh4js2jw3uqu.iGsxA1tjKO",
        name: "Vali Nemetz",
        role: "owner",
      };
    } else {
      try {
        user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
      } catch {
        return NextResponse.json(
          errorResponse("Database unavailable. Please try again later."),
          { status: 503 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        errorResponse("Invalid credentials"),
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(normalizedPassword, user.password);

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