import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContractSignedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log("DocuSign webhook received:", event.event);

    // Handle different DocuSign events
    if (event.event === "envelope-completed" || event.event === "envelope-signed") {
      const envelopeId = event.data?.envelopeId;

      if (!envelopeId) {
        return NextResponse.json(
          { success: false, message: "Missing envelope ID" },
          { status: 400 }
        );
      }

      // Find contract by envelope ID
      const contract = await prisma.contract.findUnique({
        where: { envelopeId },
        include: {
          contractor: true,
          project: true,
        },
      });

      if (!contract) {
        console.log(`Contract not found for envelope: ${envelopeId}`);
        return NextResponse.json(
          { success: true, message: "Envelope processed" },
          { status: 200 }
        );
      }

      // Update contract status
      const status = event.event === "envelope-completed" ? "completed" : "signed";

      const updatedContract = await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status,
          signedAt: new Date(),
          completedAt: event.event === "envelope-completed" ? new Date() : null,
        },
      });

      // Send notification email to owner
      // Get owner email from project or use default
      const ownerEmail = process.env.FROM_EMAIL || "noreply@residenceos.com";

      try {
        await sendContractSignedEmail(
          ownerEmail,
          contract.signerName,
          (contract.projectDetails as Record<string, string | number>)?.projectName ||
            "Project",
          contract.projectId || ""
        );
      } catch (emailError) {
        console.error("Failed to send contract signed email:", emailError);
        // Continue - contract was updated successfully
      }

      console.log(`Contract ${contract.id} updated to ${status}`);

      return NextResponse.json(
        {
          success: true,
          message: `Contract ${status}`,
        },
        { status: 200 }
      );
    }

    // Handle other events or unknown events
    return NextResponse.json(
      { success: true, message: "Event received" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing DocuSign webhook:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}
