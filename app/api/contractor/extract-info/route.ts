import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface ExtractedInfo {
  email?: string;
  phone?: string;
  website?: string;
  logo?: string;
  address?: string;
  confidence: "high" | "medium" | "low";
  details: string;
}

export async function POST(req: NextRequest) {
  try {
    const { websiteUrl } = await req.json();

    if (!websiteUrl) {
      return NextResponse.json(
        { success: false, message: "Website URL is required" },
        { status: 400 }
      );
    }

    // Fetch the website content
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch website" },
        { status: 400 }
      );
    }

    const htmlContent = await response.text();

    // Use Claude to extract contact information
    const message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Extract contact information from this website HTML. Look for: email, phone number, physical address, logo URL, and any other contact details. Return as JSON with keys: email, phone, address, logo, website, and a "details" field explaining what was found.

HTML Content:
${htmlContent.substring(0, 10000)}

Return ONLY valid JSON, no other text.`,
        },
      ],
    });

    const extractedText =
      message.content[0].type === "text" ? message.content[0].text : "{}";

    // Parse the extracted information
    let extractedInfo: ExtractedInfo = {
      website: websiteUrl,
      confidence: "low",
      details: "No information extracted",
    };

    try {
      const parsed = JSON.parse(extractedText);
      extractedInfo = {
        email: parsed.email || undefined,
        phone: parsed.phone || undefined,
        website: websiteUrl,
        logo: parsed.logo || undefined,
        address: parsed.address || undefined,
        confidence: parsed.confidence || "medium",
        details: parsed.details || "Information extracted from website",
      };
    } catch (e) {
      console.error("Failed to parse Claude response:", extractedText);
      extractedInfo.details = "Could not parse extracted information";
    }

    return NextResponse.json({
      success: true,
      data: extractedInfo,
    });
  } catch (error) {
    console.error("Error extracting website info:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to extract information from website",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
