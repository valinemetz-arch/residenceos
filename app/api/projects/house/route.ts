import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateHouseProject } from "@/lib/houseProject";
import { successResponse, errorResponse } from "@/lib/api";

// GET /api/projects/house - The single canonical Project row anchoring
// Site Info + Messages for the Overview/Project/Messages screens. The rest
// of the app (Spaces/Assets/Tasks/etc.) has no projectId of its own; this
// is the one project record those screens hang off of.
export async function GET() {
  try {
    const house = await getOrCreateHouseProject();
    const project = await prisma.project.findUnique({
      where: { id: house.id },
      include: {
        timelineSteps: { orderBy: { order: "asc" } },
        contacts: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(successResponse(project));
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch house project"), {
      status: 500,
    });
  }
}
