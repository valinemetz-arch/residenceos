import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface WarrantyInfo {
  description: string | null;
  coverageScope: string | null;
  months: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  claimProcess: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manufacturer, model, productName } = body;

    if (!manufacturer) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "Manufacturer name required" },
        { status: 400 }
      );
    }
    // Ensure Anthropic API key is configured
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_TOKEN || process.env.ANTHROPIC_API;
    if (!anthropicKey) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "Anthropic API key not configured. Set ANTHROPIC_API_KEY in your environment." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey: anthropicKey });

    // Use Claude to research warranty information
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Research warranty information for the following product and return JSON format only (no markdown):

Manufacturer: ${manufacturer}
${model ? `Model: ${model}` : ""}
${productName ? `Product Name: ${productName}` : ""}

Search for typical warranty coverage information from this manufacturer. Return ONLY a JSON object (no markdown code blocks) with this structure:
{
  "description": "What is covered by warranty (brief summary)",
  "coverageScope": "Full, Limited, Parts Only, Labor Only, or Similar",
  "months": <number of months of coverage, or null if variable>,
  "phone": "Manufacturer support phone number or null",
  "email": "Manufacturer support email or null",
  "website": "Manufacturer website URL or null",
  "claimProcess": "Brief summary of how to file a claim or null"
}

If you cannot find specific information, use null for that field. Return ONLY the JSON object.`,
        },
      ],
    });

    // Parse the response
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let warrantyInfo: WarrantyInfo;
    try {
      warrantyInfo = JSON.parse(responseText);
    } catch (e) {
      // If Claude's response isn't valid JSON, try to extract it
      console.error("Failed to parse warranty info:", responseText);
      return NextResponse.json<ApiResponse<unknown>>(
        {
          success: false,
          error: "Could not parse warranty information",
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<WarrantyInfo>>(
      { success: true, data: warrantyInfo },
      { status: 200 }
    );
  } catch (error) {
    console.error("Warranty lookup error:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to lookup warranty",
      },
      { status: 500 }
    );
  }
}
