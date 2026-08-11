import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBidReminderEmail, sendIncompleteSubmissionReminderEmail } from "@/lib/email";

// Verify the request is from a cron service (you'll set this up)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    let remindersSent = 0;

    // 1. Find contractors who accessed portal but haven't submitted bid
    // (accessed in last 24 hours, no bid submitted, no reminder sent recently)
    const contractorsWithoutBids = await prisma.contractor.findMany({
      where: {
        lastAccessedAt: {
          gte: oneDayAgo,
        },
        bids: {
          none: {},
        },
        OR: [
          { lastReminderSentAt: null },
          { lastReminderSentAt: { lt: twoDaysAgo } },
        ],
      },
    });

    for (const contractor of contractorsWithoutBids) {
      // Get projects they viewed (you'd need to track project views)
      // For now, send general reminder
      await sendIncompleteSubmissionReminderEmail(
        contractor.email,
        contractor.companyName,
        "a project",
        "multiple",
        ["Your bid amount", "Any relevant notes"]
      );

      // Update last reminder sent time
      await prisma.contractor.update({
        where: { id: contractor.id },
        data: { lastReminderSentAt: now },
      });

      remindersSent++;
    }

    // 2. Find bids that were started but not submitted (created > 3 days ago, still pending)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const staleBids = await prisma.bid.findMany({
      where: {
        status: "pending",
        createdAt: {
          lt: threeDaysAgo,
        },
      },
      include: {
        contractor: true,
        project: true,
      },
    });

    for (const bid of staleBids) {
      const daysElapsed = Math.floor(
        (now.getTime() - bid.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      await sendBidReminderEmail(
        bid.contractor.email,
        bid.contractor.companyName,
        bid.project.name,
        bid.projectId,
        daysElapsed
      );

      remindersSent++;
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${remindersSent} reminder emails`,
      data: {
        contractorsWithoutBids: contractorsWithoutBids.length,
        staleBids: staleBids.length,
        total: remindersSent,
      },
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Cron job failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
