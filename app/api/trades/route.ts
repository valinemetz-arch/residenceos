import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkAdminAccess } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    });

    return NextResponse.json({ trades }, { status: 200 });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

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

    const { name, description } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Trade name is required" },
        { status: 400 }
      );
    }

    const trade = await prisma.trade.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Trade already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating trade:", error);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 }
    );
  }
}
