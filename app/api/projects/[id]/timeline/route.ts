import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/projects/[id]/timeline - List timeline steps for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const steps = await prisma.projectTimelineStep.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(successResponse(steps));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch timeline"), {
      status: 500,
    });
  }
}

// POST /api/projects/[id]/timeline - Add a timeline step
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.label || !body.dateLabel) {
      return NextResponse.json(
        errorResponse("label and dateLabel are required"),
        { status: 400 }
      );
    }

    const step = await prisma.projectTimelineStep.create({
      data: {
        projectId: id,
        label: body.label,
        dateLabel: body.dateLabel,
        order: body.order ?? 0,
      },
    });

    return NextResponse.json(successResponse(step, "Timeline step added"), {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to add timeline step"), {
      status: 500,
    });
  }
}
