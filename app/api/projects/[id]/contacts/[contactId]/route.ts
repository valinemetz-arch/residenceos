import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// PATCH /api/projects/[id]/contacts/[contactId] - Update a contact
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    for (const key of ["name", "role", "phone", "order"] as const) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const contact = await prisma.projectContact.update({
      where: { id: contactId },
      data,
    });

    return NextResponse.json(successResponse(contact, "Contact updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update contact"), {
      status: 500,
    });
  }
}

// DELETE /api/projects/[id]/contacts/[contactId] - Remove a contact
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;
    await prisma.projectContact.delete({ where: { id: contactId } });
    return NextResponse.json(successResponse(null, "Contact deleted"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to delete contact"), {
      status: 500,
    });
  }
}
