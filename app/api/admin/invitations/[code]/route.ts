import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const invitation = await prisma.adminInvitation.findUnique({
      where: { code },
      select: {
        email: true,
        expiresAt: true,
        usedAt: true
      }
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

    return NextResponse.json(
      {
        email: invitation.email,
        isValid: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json(
      { error: "Failed to verify invitation" },
      { status: 500 }
    );
  }
}
