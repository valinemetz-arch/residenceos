import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, companyName, contactName, phone, trades = [] } = body;

    console.log("Signup request:", { email, companyName });

    if (!email || !password || !companyName) {
      return NextResponse.json(
        { success: false, message: "Email, password, and company name are required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingContractor = await prisma.contractor.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingContractor) {
      return NextResponse.json(
        { success: false, message: "Contractor with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    console.log("Creating contractor...");
    const contractor = await prisma.contractor.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        companyName,
        contactName: contactName || null,
        phone: phone || null,
        role: "contractor"
      },
    });
    console.log("Contractor created:", contractor.id);

    // Add trades if provided
    if (Array.isArray(trades) && trades.length > 0) {
      // Validate that trades exist
      const validTrades = await prisma.trade.findMany({
        where: { id: { in: trades } }
      });

      if (validTrades.length > 0) {
        await prisma.contractorTrade.createMany({
          data: validTrades.map((trade: typeof validTrades[0]) => ({
            contractorId: contractor.id,
            tradeId: trade.id
          }))
        });
      }
    }

    // Get contractor with trades
    const contractorWithTrades = await prisma.contractor.findUnique({
      where: { id: contractor.id },
      include: {
        trades: {
          include: { trade: true }
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: contractor.id,
          email: contractor.email,
          companyName: contractor.companyName,
          trades: contractorWithTrades?.trades.map((ct: any) => ({
            id: ct.trade.id,
            name: ct.trade.name
          })) || []
        },
        message: "Contractor registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to register contractor", error: String(error) },
      { status: 500 }
    );
  }
}
