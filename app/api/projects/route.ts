import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "active" },
      include: {
        spaces: { select: { id: true, name: true } },
        bids: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(projects));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Failed to fetch projects"),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const project = await prisma.project.create({
      data: {
        name: body.name,
        address: body.address || null,
        description: body.description || null,
        budget: body.budget || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json(
      successResponse(project, "Project created"),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      errorResponse("Failed to create project"),
      { status: 500 }
    );
  }
}
