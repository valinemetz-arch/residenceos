import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

const taskInclude = {
  space: { select: { id: true, name: true } },
  system: { select: { id: true, name: true } },
  assignedToUser: { select: { id: true, name: true, email: true, role: true } },
  assignedToContractor: {
    select: { id: true, companyName: true, contactName: true, email: true },
  },
  assignedByUser: { select: { id: true, name: true, email: true } },
} as const;

// Normalizes assignment fields: a task can be assigned to a user OR a
// contractor, never both. Whichever one is provided wins; passing an
// explicit empty string clears the assignment. If neither key is present
// in the body, the existing assignment is left untouched.
function buildAssignmentData(body: any): {
  assignedToUserId?: string | null;
  assignedToContractorId?: string | null;
  assignedAt?: Date | null;
} {
  const hasUserAssignment = "assignedToUserId" in body;
  const hasContractorAssignment = "assignedToContractorId" in body;

  if (!hasUserAssignment && !hasContractorAssignment) {
    return {};
  }

  const assignedToUserId = hasUserAssignment
    ? body.assignedToUserId || null
    : null;
  const assignedToContractorId = hasContractorAssignment
    ? body.assignedToContractorId || null
    : null;

  const isAssigning = !!(assignedToUserId || assignedToContractorId);

  return {
    assignedToUserId,
    assignedToContractorId,
    assignedAt: isAssigning ? new Date() : null,
  };
}

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
      include: taskInclude,
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
    const auth = await requireAuth(req);
    const assignmentData = buildAssignmentData(body);
    const isReassigning = "assignedAt" in assignmentData;

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
        ...assignmentData,
        ...(isReassigning
          ? {
              assignedById: assignmentData.assignedAt
                ? auth?.userId || null
                : null,
            }
          : {}),
      },
      include: taskInclude,
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
