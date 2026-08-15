import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

// Lets a contractor update the status/notes on a task assigned to them.
// They cannot reassign it, change other task fields, or touch tasks
// assigned to someone else.
export async function PUT(req: NextRequest) {
  const taskId = req.nextUrl.pathname.split("/").pop();

  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const verified = await jwtVerify(token, JWT_SECRET);
    const contractorId = verified.payload.sub as string | undefined;

    if (!contractorId || !taskId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const existing = await prisma.task.findUnique({ where: { id: taskId } });

    if (!existing || existing.assignedToContractorId !== contractorId) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const allowedStatuses = ["pending", "in_progress", "completed", "blocked"];
    const status = allowedStatuses.includes(body.status)
      ? body.status
      : existing.status;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedDate: status === "completed" ? new Date() : null,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
      message: "Task updated",
    });
  } catch (error) {
    console.error("Error updating contractor task:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update task" },
      { status: 500 }
    );
  }
}
