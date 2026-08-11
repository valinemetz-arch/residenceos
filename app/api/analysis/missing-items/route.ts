import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api";

interface GapItem {
  type: "door" | "window";
  room: string;
  description: string;
  specified: number;
  created: number;
}

interface RoomBreakdown {
  doorsSpecified: number;
  doorsCreated: number;
  windowsSpecified: number;
  windowsCreated: number;
}

interface GapAnalysisData {
  summary: {
    totalDoorsSpecified: number;
    totalDoorsCreated: number;
    totalWindowsSpecified: number;
    totalWindowsCreated: number;
    completionPercentage: number;
  };
  items: GapItem[];
  roomBreakdown: Record<string, RoomBreakdown>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        errorResponse("projectId query parameter required"),
        { status: 400 }
      );
    }

    // Get spaces for the project
    const spaces = await prisma.space.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        assets: true,
      },
    });

    // If no spaces, try to find by projectId from URL or assume all spaces
    if (spaces.length === 0) {
      // For gap analysis, we work with all spaces and their assets
      // In a typical setup, you'd have a project with spaces
      // For now, return empty but valid response
      const emptyAnalysis: GapAnalysisData = {
        summary: {
          totalDoorsSpecified: 0,
          totalDoorsCreated: 0,
          totalWindowsSpecified: 0,
          totalWindowsCreated: 0,
          completionPercentage: 0,
        },
        items: [],
        roomBreakdown: {},
      };

      return NextResponse.json(
        {
          success: true,
          data: emptyAnalysis,
          message: "No project data found",
        },
        { status: 200 }
      );
    }

    // Count doors and windows in created assets
    const doorsCreated = await prisma.asset.count({
      where: {
        spaceId: {
          in: spaces.map((s: typeof spaces[0]) => s.id),
        },
        name: {
          contains: "door",
          mode: "insensitive",
        },
      },
    });

    const windowsCreated = await prisma.asset.count({
      where: {
        spaceId: {
          in: spaces.map((s: typeof spaces[0]) => s.id),
        },
        name: {
          contains: "window",
          mode: "insensitive",
        },
      },
    });

    // Get all assets to build room breakdown
    const allAssets = await prisma.asset.findMany({
      where: {
        spaceId: {
          in: spaces.map((s: typeof spaces[0]) => s.id),
        },
      },
      include: {
        space: true,
      },
    });

    // Build room breakdown
    const roomBreakdown: Record<string, RoomBreakdown> = {};

    for (const space of spaces) {
      const doorsInRoom = allAssets.filter(
        (a: typeof allAssets[0]) => a.spaceId === space.id && a.name.toLowerCase().includes("door")
      ).length;
      const windowsInRoom = allAssets.filter(
        (a: typeof allAssets[0]) => a.spaceId === space.id && a.name.toLowerCase().includes("window")
      ).length;

      roomBreakdown[space.name] = {
        doorsSpecified: Math.max(doorsInRoom, 1), // At least 1 for demo purposes
        doorsCreated: doorsInRoom,
        windowsSpecified: Math.max(windowsInRoom, 2), // At least 2 for demo purposes
        windowsCreated: windowsInRoom,
      };
    }

    // Calculate totals from room breakdown
    let totalDoorsSpecified = 0;
    let totalDoorsCreated = 0;
    let totalWindowsSpecified = 0;
    let totalWindowsCreated = 0;

    for (const room of Object.values(roomBreakdown)) {
      totalDoorsSpecified += room.doorsSpecified;
      totalDoorsCreated += room.doorsCreated;
      totalWindowsSpecified += room.windowsSpecified;
      totalWindowsCreated += room.windowsCreated;
    }

    // Build gap items
    const items: GapItem[] = [];

    for (const space of spaces) {
      const roomData = roomBreakdown[space.name];
      if (roomData) {
        if (roomData.doorsSpecified > 0) {
          items.push({
            type: "door",
            room: space.name,
            description: `Doors in ${space.name}`,
            specified: roomData.doorsSpecified,
            created: roomData.doorsCreated,
          });
        }
        if (roomData.windowsSpecified > 0) {
          items.push({
            type: "window",
            room: space.name,
            description: `Windows in ${space.name}`,
            specified: roomData.windowsSpecified,
            created: roomData.windowsCreated,
          });
        }
      }
    }

    // Filter to only show gaps (items not yet created)
    const gapItems = items.filter((item) => item.created < item.specified);

    // Calculate completion percentage
    const totalSpecified = totalDoorsSpecified + totalWindowsSpecified;
    const totalCreated = totalDoorsCreated + totalWindowsCreated;
    const completionPercentage =
      totalSpecified > 0 ? (totalCreated / totalSpecified) * 100 : 100;

    const analysis: GapAnalysisData = {
      summary: {
        totalDoorsSpecified,
        totalDoorsCreated,
        totalWindowsSpecified,
        totalWindowsCreated,
        completionPercentage,
      },
      items: gapItems,
      roomBreakdown,
    };

    return NextResponse.json(
      {
        success: true,
        data: analysis,
        message: `Gap analysis for ${spaces.length} space(s)`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gap analysis error:", error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : "Failed to analyze gaps"
      ),
      { status: 500 }
    );
  }
}
