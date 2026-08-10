import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.pathname.split("/").pop();

  if (!taskId) {
    return NextResponse.json(errorResponse("Task ID is required"), {
      status: 400,
    });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        space: { select: { id: true, name: true } },
        system: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return NextResponse.json(errorResponse("Task not found"), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(task));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch task"), {
      status: 500,
    });
  }
}

export async function PUT(req: NextRequest) {
  const taskId = req.nextUrl.pathname.split("/").pop();

  if (!taskId) {
    return NextResponse.json(errorResponse("Task ID is required"), {
      status: 400,
    });
  }

  try {
    const body = await req.json();

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title,
        description: body.description || null,
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

    return NextResponse.json(successResponse(task, "Task updated"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to update task"), {
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const taskId = req.nextUrl.pathname.split("/").pop();

  if (!taskId) {
    return NextResponse.json(errorResponse("Task ID is required"), {
      status: 400,
    });
  }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json(successResponse(null, "Task deleted"));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to delete task"), {
      status: 500,
    });
  }
}
