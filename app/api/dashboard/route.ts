import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/dashboard - Dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const [
      totalSpaces,
      totalAssets,
      totalSystems,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalBudget,
      spentBudget,
      recentPhotos,
      recentDocuments,
    ] = await Promise.all([
      prisma.space.count(),
      prisma.asset.count(),
      prisma.system.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: "completed" } }),
      prisma.task.count({ where: { status: "pending" } }),
      prisma.budgetItem.aggregate({
        _sum: { budgetedAmount: true },
      }),
      prisma.budgetItem.aggregate({
        _sum: { actualAmount: true },
      }),
      prisma.photo.findMany({
        take: 6,
        orderBy: { takeDate: "desc" },
      }),
      prisma.document.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const stats = {
      spaces: totalSpaces,
      assets: totalAssets,
      systems: totalSystems,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completionRate: Math.round(
          ((completedTasks / (totalTasks || 1)) * 100)
        ),
      },
      budget: {
        budgeted: totalBudget._sum.budgetedAmount || 0,
        spent: spentBudget._sum.actualAmount || 0,
        remaining:
          (totalBudget._sum.budgetedAmount || 0) -
          (spentBudget._sum.actualAmount || 0),
      },
      recentPhotos,
      recentDocuments,
    };

    return NextResponse.json(successResponse(stats));
  } catch (error) {
    return NextResponse.json(
      errorResponse("Failed to fetch dashboard stats"),
      { status: 500 }
    );
  }
}