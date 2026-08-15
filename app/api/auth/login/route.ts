import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, hashPassword } from "@/lib/auth";
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

    // First-time login for the property owner: provision a real owner
    // account instead of relying on a fake, non-database "demo-user" id.
    // (That fake id used to break every admin-only endpoint, since they
    // all look the logged-in user up by id.) This only fires when no
    // account exists yet for this email, so it can never override a real
    // account's password.
    const isOwnerFirstLogin =
      !user &&
      normalizedEmail === "vali@legacyandlandgroup.com" &&
      normalizedPassword === "demo123";

    if (isOwnerFirstLogin) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: await hashPassword(normalizedPassword),
          name: "Vali Nemetz",
          role: "owner",
        },
      });
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
      successResponse({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("Login failed"),
      { status: 500 }
    );
  }
}