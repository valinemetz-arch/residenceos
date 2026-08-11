import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { sendMessageNotification } from "@/lib/email";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "projectId is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { projectId },
      include: { contractor: { select: { companyName: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get token from cookie to identify sender
    const token = req.cookies.get("token")?.value;
    const body = await req.json();
    const { projectId, message } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { success: false, message: "projectId and message are required" },
        { status: 400 }
      );
    }

    let senderType = "owner";
    let contractorId = null;
    let senderName = "Project Owner";

    // If token exists, this is a contractor message
    if (token) {
      try {
        const verified = await jwtVerify(token, JWT_SECRET);
        const contractorIdFromToken = verified.payload.sub;

        if (contractorIdFromToken) {
          const contractor = await prisma.contractor.findUnique({
            where: { id: contractorIdFromToken as string },
          });

          if (contractor) {
            senderType = "contractor";
            contractorId = contractor.id;
            senderName = contractor.companyName;
          }
        }
      } catch (e) {
        // Token verification failed, treat as owner
      }
    }

    const newMessage = await prisma.message.create({
      data: {
        projectId,
        contractorId,
        senderType,
        senderName,
        message,
      },
      include: { contractor: { select: { companyName: true, email: true } } },
    });

    // Send email notification to recipient
    (async () => {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });

        if (senderType === "contractor" && project) {
          // Send email to project owner (you can store owner email in project model later)
          // For now, we'll just log it
          console.log(
            `Would send email to project owner about message from ${senderName}`
          );
        } else if (senderType === "owner" && newMessage.contractor?.email) {
          // Send email to contractor
          await sendMessageNotification(
            newMessage.contractor.email,
            senderName || "Project Owner",
            project?.name || "Your Project",
            message,
            projectId
          );
        }
      } catch (error) {
        console.error("Error sending notification email:", error);
      }
    })();

    return NextResponse.json(
      {
        success: true,
        data: newMessage,
        message: "Message sent successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}
