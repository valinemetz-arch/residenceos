import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { code, name, password, passwordConfirm } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Verify invitation
    const invitation = await prisma.adminInvitation.findUnique({
      where: { code }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.usedAt) {
      return NextResponse.json(
        { error: "Invitation already used" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Create admin user
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        name: name.trim(),
        role: "admin"
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Mark invitation as used
    await prisma.adminInvitation.update({
      where: { code },
      data: { usedAt: new Date() }
    });

    return NextResponse.json(
      {
        message: "Admin account created successfully",
        user
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating admin account:", error);
    return NextResponse.json(
      { error: "Failed to create admin account" },
      { status: 500 }
    );
  }
}
