import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// Returns the people a task can be assigned to: internal team members
// (owners/admins) and registered contractors. Used to populate the
// assignee picker on the task form.
//
// Note: like the existing /api/tasks and /api/spaces endpoints, this is
// not gated behind server-side auth yet — the app doesn't currently wire
// an Authorization header through from the logged-in session on any
// internal page. Tightening that is a separate piece of work (see the
// Admin User Management phase).
export async function GET() {
  try {
    const [users, contractors] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: ["owner", "admin"] }, isActive: true },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      }),
      prisma.contractor.findMany({
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          trades: { select: { trade: { select: { name: true } } } },
        },
        orderBy: { companyName: "asc" },
      }),
    ]);

    const contractorsWithTrades = contractors.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      contactName: c.contactName,
      email: c.email,
      trades: c.trades.map((t) => t.trade.name),
    }));

    return NextResponse.json(
      successResponse({ users, contractors: contractorsWithTrades })
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to fetch assignees"), {
      status: 500,
    });
  }
}
