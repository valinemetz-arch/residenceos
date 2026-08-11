import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkAdminAccess, checkOwnerAccess } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(auth.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(auth.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent non-owner from changing owner roles
    if (id !== auth.userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true }
      });

      if (targetUser?.role === "owner") {
        const isOwner = await checkOwnerAccess(auth.userId);
        if (!isOwner) {
          return NextResponse.json(
            { error: "Only owner can modify owner accounts" },
            { status: 403 }
          );
        }
      }
    }

    const { name, role, company, isActive } = await req.json();

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role && ["admin", "viewer"].includes(role)) {
      updateData.role = role;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = await checkOwnerAccess(auth.userId);
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent self-deletion
    if (id === auth.userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user is owner
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (targetUser?.role === "owner") {
      return NextResponse.json(
        { error: "Cannot delete owner account" },
        { status: 400 }
      );
    }

    // Soft delete by marking inactive
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true }
    });

    return NextResponse.json(
      { message: "User deactivated", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
