import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const system = await prisma.system.findUnique({
      where: { id },
      include: { spaces: { select: { id: true, name: true } }, assets: { select: { id: true, name: true } }, _count: { select: { assets: true, tasks: true } } },
    });

    if (!system) return NextResponse.json(errorResponse("System not found"), { status: 404 });

    return NextResponse.json(successResponse(system));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch system"), { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.systemType !== undefined) data.systemType = body.systemType || body.name;
    if (body.description !== undefined) data.description = body.description || null;

    const updated = await prisma.system.update({ where: { id }, data });
    return NextResponse.json(successResponse(updated, "System updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update system"), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const system = await prisma.system.findUnique({ where: { id }, include: { spaces: { select: { id: true } } } });
    if (!system) return NextResponse.json(errorResponse("System not found"), { status: 404 });

    // Disconnect system from spaces
    for (const space of system.spaces) {
      await prisma.system.update({ where: { id }, data: { spaces: { disconnect: { id: space.id } } } });
    }

    // Delete documents/photos tied to system
    await prisma.photo.deleteMany({ where: { systemId: id } });
    await prisma.document.deleteMany({ where: { systemId: id } });

    // Delete warranties linked to system
    await prisma.warranty.deleteMany({ where: { systemId: id } });

    // Finally delete the system
    await prisma.system.delete({ where: { id } });

    return NextResponse.json(successResponse(null, "System deleted"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to delete system"), { status: 500 });
  }
}
