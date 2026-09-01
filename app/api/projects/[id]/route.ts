import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        spaces: true,
        documents: true,
        timelineSteps: { orderBy: { order: "asc" } },
        contacts: { orderBy: { order: "asc" } },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project fields, including Site Info
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    for (const key of [
      "name",
      "address",
      "description",
      "budget",
      "status",
      "gateCode",
      "phase",
    ] as const) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const project = await prisma.project.update({ where: { id }, data });

    return NextResponse.json(successResponse(project, "Project updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update project"), {
      status: 500,
    });
  }
}
