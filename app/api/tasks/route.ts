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
// explicit empty string clears the assignment.
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
  try {
    const assignedToUserId = req.nextUrl.searchParams.get("assignedToUserId");
    const assignedToContractorId = req.nextUrl.searchParams.get(
      "assignedToContractorId"
    );
    const unassigned = req.nextUrl.searchParams.get("unassigned");

    const where: any = {};
    if (assignedToUserId) where.assignedToUserId = assignedToUserId;
    if (assignedToContractorId) where.assignedToContractorId = assignedToContractorId;
    if (unassigned === "true") {
      where.assignedToUserId = null;
      where.assignedToContractorId = null;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
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
    const auth = await requireAuth(req);
    const assignmentData = buildAssignmentData(body);

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
        ...assignmentData,
        assignedById:
          "assignedAt" in assignmentData && assignmentData.assignedAt
            ? auth?.userId || null
            : null,
      },
      include: taskInclude,
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
