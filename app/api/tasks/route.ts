import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        space: { select: { id: true, name: true } },
        system: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(successResponse(tasks));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch tasks"), {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        category: body.category || "general",
        spaceId: body.spaceId || null,
        systemId: body.systemId || null,
        priority: body.priority || "medium",
        status: body.status || "pending",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null,
      },
      include: {
        space: { select: { id: true, name: true } },
        system: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(successResponse(task, "Task created"), {
      status: 201,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to create task"), {
      status: 500,
    });
  }
}
