import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContractFromTemplate, getSigningUrl } from "@/lib/docusign";
import { sendContractSigningEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      contractorId,
      contractorEmail,
      contractorName,
      projectDetails,
    } = body;

    // Validate required fields
    if (!contractorId || !contractorEmail || !contractorName || !projectDetails) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get project info
    const project = projectId
      ? await prisma.project.findUnique({
          where: { id: projectId },
        })
      : null;

    // Send contract via DocuSign
    const { envelopeId, status } = await sendContractFromTemplate(
      contractorEmail,
      contractorName,
      projectDetails
    );

    // Get signing URL
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contractor/contracts/${envelopeId}/status`;
    const signingUrl = await getSigningUrl(
      envelopeId,
      contractorEmail,
      contractorName,
      returnUrl
    );

    // Create contract record in database
    const contract = await prisma.contract.create({
      data: {
        projectId: projectId || null,
        contractorId,
        envelopeId,
        signingUrl,
        signerEmail: contractorEmail,
        signerName: contractorName,
        projectDetails: projectDetails,
        status: "sent",
        sentAt: new Date(),
      },
      include: {
        contractor: true,
        project: true,
      },
    });

    // Send signing email to contractor
    try {
      await sendContractSigningEmail(
        contractorEmail,
        contractorName,
        projectDetails.projectName,
        signingUrl
      );
    } catch (emailError) {
      console.error("Failed to send signing email:", emailError);
      // Continue - contract was created successfully
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          contractId: contract.id,
          envelopeId,
          status,
          signingUrl,
        },
        message: "Contract sent successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending contract:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to send contract",
      },
      { status: 500 }
    );
  }
}
