import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEnvelopeStatus } from "@/lib/docusign";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ envelopeId: string }> }
) {
  try {
    const { envelopeId } = await params;

    if (!envelopeId) {
      return NextResponse.json(
        { success: false, message: "Envelope ID is required" },
        { status: 400 }
      );
    }

    // Get contract from database
    const contract = await prisma.contract.findUnique({
      where: { envelopeId },
      include: {
        contractor: true,
        project: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, message: "Contract not found" },
        { status: 404 }
      );
    }

    // Get current status from DocuSign
    const docusignStatus = await getEnvelopeStatus(envelopeId);

    // Map DocuSign status to our status
    const statusMap: Record<string, string> = {
      sent: "sent",
      delivered: "viewed",
      signed: "signed",
      completed: "completed",
      voided: "voided",
      declined: "voided",
    };

    const newStatus = statusMap[docusignStatus.status] || docusignStatus.status;

    // Update contract status in database if changed
    let updatedContract = contract;
    if (newStatus !== contract.status) {
      updatedContract = await prisma.contract.update({
        where: { id: contract.id },
        data: {
          status: newStatus,
          signedAt: newStatus === "signed" ? new Date() : contract.signedAt,
          completedAt:
            newStatus === "completed"
              ? docusignStatus.signedAt || new Date()
              : contract.completedAt,
        },
        include: {
          contractor: true,
          project: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        contractId: updatedContract.id,
        envelopeId,
        status: updatedContract.status,
        signingUrl: updatedContract.signingUrl,
        sentAt: updatedContract.sentAt,
        signedAt: updatedContract.signedAt,
        completedAt: updatedContract.completedAt,
        documentUrl: updatedContract.documentUrl,
      },
    });
  } catch (error) {
    console.error("Error getting contract status:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get contract status",
      },
      { status: 500 }
    );
  }
}
