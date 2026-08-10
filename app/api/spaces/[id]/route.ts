import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/spaces/[id] - Get a single space
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params as any;
    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        assets: { select: { id: true, name: true } },
        systems: { select: { id: true, name: true } },
        _count: {
          select: { assets: true, tasks: true, photos: true },
        },
      },
    });

    if (!space) {
      return NextResponse.json(errorResponse("Space not found"), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(space));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch space"), {
      status: 500,
    });
  }
}

// PUT /api/spaces/[id] - Update a space
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { id } = await params as any;

    const space = await prisma.space.update({
      where: { id },
      data: {
        name: body.name,
        building: body.building || "Main Residence",
        floor: body.floor || null,
        squareFootage: body.squareFootage || null,
        description: body.description || null,
        status: body.status || "planning",
        notes: body.notes || null,
      },
      include: {
        _count: {
          select: { assets: true, tasks: true, photos: true },
        },
      },
    });

    return NextResponse.json(successResponse(space, "Space updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update space"), {
      status: 500,
    });
  }
}

// DELETE /api/spaces/[id] - Delete a space
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the space first to get all systems
    const { id } = await params as any;
    const space = await prisma.space.findUnique({
      where: { id },
      include: { systems: { select: { id: true } } },
    });

    if (!space) {
      return NextResponse.json(errorResponse("Space not found"), {
        status: 404,
      });
    }

    // 1. Disconnect space from all systems
    for (const system of space.systems) {
      await prisma.system.update({
        where: { id: system.id },
        data: {
          spaces: {
            disconnect: { id },
          },
        },
      });
    }

    // 2. Delete task documents and photos
    const tasks = await prisma.task.findMany({
      where: { spaceId: id },
      select: { id: true },
    });
    for (const task of tasks) {
      await prisma.photo.deleteMany({ where: { taskId: task.id } });
      await prisma.document.deleteMany({ where: { taskId: task.id } });
    }

    // 3. Delete tasks
    await prisma.task.deleteMany({
      where: { spaceId: params.id },
    });

    // 4. Delete asset documents and photos
    const assets = await prisma.asset.findMany({
      where: { spaceId: id },
      select: { id: true },
    });
    for (const asset of assets) {
      await prisma.photo.deleteMany({ where: { assetId: asset.id } });
      await prisma.document.deleteMany({ where: { assetId: asset.id } });
    }

    // 5. Delete assets
    await prisma.asset.deleteMany({ where: { spaceId: id } });

    // 6. Delete budget item documents and photos
    const budgetItems = await prisma.budgetItem.findMany({
      where: { spaceId: id },
      select: { id: true },
    });
    for (const item of budgetItems) {
      await prisma.photo.deleteMany({ where: { budgetItemId: item.id } });
      await prisma.document.deleteMany({ where: { budgetItemId: item.id } });
    }

    // 7. Delete budget items
    await prisma.budgetItem.deleteMany({ where: { spaceId: id } });

    // 8. Delete specifications
    await prisma.specification.deleteMany({ where: { spaceId: id } });

    // 9. Delete space documents and photos
    await prisma.photo.deleteMany({ where: { spaceId: id } });
    await prisma.document.deleteMany({ where: { spaceId: id } });

    // 10. Delete warranties
    await prisma.warranty.deleteMany({ where: { spaceId: id } });

    // 11. Finally, delete the space
    await prisma.space.delete({ where: { id } });

    return NextResponse.json(
      successResponse(null, "Space deleted successfully")
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to delete space"), {
      status: 500,
    });
  }
}
