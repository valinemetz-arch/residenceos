import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkAdminAccess } from "@/lib/auth";
import { sendAdminInvitationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(auth.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check if invitation already exists and is not expired
    const existingInvitation = await prisma.adminInvitation.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 409 }
      );
    }

    // Generate invitation code
    const code = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.adminInvitation.create({
      data: {
        email: email.toLowerCase(),
        code,
        invitedBy: auth.userId,
        expiresAt
      }
    });

    // Send email
    try {
      const inviteUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/signup/${code}`;
      await sendAdminInvitationEmail(email, inviteUrl);
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Continue anyway - invitation was created
    }

    return NextResponse.json(
      {
        message: "Invitation sent successfully",
        invitation: {
          email: invitation.email,
          expiresAt: invitation.expiresAt,
          code: invitation.code
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
