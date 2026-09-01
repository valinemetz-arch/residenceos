import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/projects/[id]/contacts - List contacts for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contacts = await prisma.projectContact.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(successResponse(contacts));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch contacts"), {
      status: 500,
    });
  }
}

// POST /api/projects/[id]/contacts - Add a contact
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.name || !body.role || !body.phone) {
      return NextResponse.json(
        errorResponse("name, role and phone are required"),
        { status: 400 }
      );
    }

    const contact = await prisma.projectContact.create({
      data: {
        projectId: id,
        name: body.name,
        role: body.role,
        phone: body.phone,
        order: body.order ?? 0,
      },
    });

    return NextResponse.json(successResponse(contact, "Contact added"), {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to add contact"), {
      status: 500,
    });
  }
}
