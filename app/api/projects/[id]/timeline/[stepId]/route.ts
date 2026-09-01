import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// PATCH /api/projects/[id]/timeline/[stepId] - Update a timeline step
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    for (const key of ["label", "dateLabel", "order"] as const) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const step = await prisma.projectTimelineStep.update({
      where: { id: stepId },
      data,
    });

    return NextResponse.json(successResponse(step, "Timeline step updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update timeline step"), {
      status: 500,
    });
  }
}

// DELETE /api/projects/[id]/timeline/[stepId] - Remove a timeline step
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params;
    await prisma.projectTimelineStep.delete({ where: { id: stepId } });
    return NextResponse.json(successResponse(null, "Timeline step deleted"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to delete timeline step"), {
      status: 500,
    });
  }
}
