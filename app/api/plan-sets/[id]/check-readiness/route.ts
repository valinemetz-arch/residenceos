import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";

// Scans a plan set's staged takeoff items and creates one Task per real gap
// (a clarifying question the AI couldn't answer, a measurement that needs a
// manual number, or a trade whose extracted items haven't been reviewed
// yet) - so there's a concrete checklist before the project goes out to
// bid. Safe to re-run: never creates a duplicate of an already-open task
// for the same gap.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planSetId } = await params;

    const planSet = await prisma.planSet.findUnique({ where: { id: planSetId } });
    if (!planSet) {
      return NextResponse.json(errorResponse("Plan set not found"), { status: 404 });
    }

    const items = await prisma.takeoffItem.findMany({
      where: { planSetId },
      include: { trade: { select: { id: true, name: true } } },
    });

    const tasksCreated: string[] = [];
    const tasksSkipped: string[] = [];

    async function createIfNotOpen(title: string, description: string, tradeId: string | null) {
      const existing = await prisma.task.findFirst({
        where: { title, status: { not: "completed" } },
      });
      if (existing) {
        tasksSkipped.push(title);
        return;
      }
      await prisma.task.create({
        data: {
          title,
          description,
          category: "design",
          priority: "high",
          tradeId,
        },
      });
      tasksCreated.push(title);
    }

    // 1. needs_info items still pending - one task per specific question.
    for (const item of items.filter((i) => i.confidence === "needs_info" && i.status === "pending")) {
      await createIfNotOpen(
        `Clarify: ${item.description}`,
        item.sourceNote || "The floor plan takeoff needs clarification on this item before it can be confirmed.",
        item.tradeId
      );
    }

    // 2. manual_required items still pending - one task per measurement needed.
    for (const item of items.filter((i) => i.confidence === "manual_required" && i.status === "pending")) {
      await createIfNotOpen(
        `Provide measurement: ${item.trade?.name || item.description}`,
        item.sourceNote || `This item needs a manually confirmed quantity: ${item.description}`,
        item.tradeId
      );
    }

    // 3. Trades with extracted items that are all still unreviewed (nothing
    // confirmed yet) - one aggregate task per trade to go review them.
    const byTrade = new Map<string, { name: string; items: typeof items }>();
    for (const item of items) {
      if (!item.tradeId || !item.trade) continue;
      if (item.confidence === "needs_info" || item.confidence === "manual_required") continue;
      const bucket = byTrade.get(item.tradeId) || { name: item.trade.name, items: [] };
      bucket.items.push(item);
      byTrade.set(item.tradeId, bucket);
    }
    for (const [tradeId, bucket] of byTrade) {
      const hasConfirmed = bucket.items.some((i) => i.status === "confirmed");
      const hasPending = bucket.items.some((i) => i.status === "pending");
      if (!hasConfirmed && hasPending) {
        await createIfNotOpen(
          `Review takeoff items: ${bucket.name}`,
          `${bucket.items.length} extracted item(s) for ${bucket.name} are still awaiting your review/confirmation before this project goes out to bid.`,
          tradeId
        );
      }
    }

    return NextResponse.json(
      successResponse({ tasksCreated, tasksSkipped }, `Created ${tasksCreated.length} task(s)`)
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to check bid readiness"), {
      status: 500,
    });
  }
}
