import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
// pdfjs-dist's default build assumes a browser Worker and, when it can't
// spawn one in a Node serverless function, falls back to a "fake worker"
// that tries to require pdf.worker.mjs as a module — a file Vercel's build
// doesn't bundle, causing a crash. The "legacy" Node build runs PDF parsing
// entirely on the main thread instead, so no worker file is ever needed.
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { prisma } from "@/lib/prisma";

interface PDFTextItem {
  str: string;
}

function isPDFTextItem(item: unknown): item is PDFTextItem {
  return typeof item === "object" && item !== null && "str" in item;
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  // pdfjs-dist rejects Node's Buffer even though it's a Uint8Array subclass;
  // convert explicitly to a plain Uint8Array.
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(fileBuffer) })
    .promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => (isPDFTextItem(item) ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    text += pageText + "\n";
  }

  return text;
}

interface ExtractedBidItem {
  description: string;
  quantity: number;
  unitPrice: number | null;
  totalCost: number | null;
  vendor: string | null;
  warrantyType: string | null; // e.g., "5-year limited", "lifetime", "10-year"
  warrantyDuration: number | null; // in months
}

interface BidExtractionResult {
  items: ExtractedBidItem[];
  matches: Array<{
    bidItemIndex: number;
    assetId: string;
    assetName: string;
    manufacturer: string | null;
    model: string | null;
    confidence: number; // 0-100
  }>;
}

// Simple fuzzy matching function
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.min(80, Math.max(50, (Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 100));
  }

  // Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = getLevenshteinDistance(shorter, longer);
  const maxLength = longer.length;

  return Math.max(0, ((maxLength - editDistance) / maxLength) * 100);
}

function getLevenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

export async function POST(request: NextRequest) {
  // Vercel's serverless filesystem is read-only except for os.tmpdir();
  // these files are only needed for the duration of this request (analyzed
  // then deleted below), so they never need to live under public/.
  const uploadDir = os.tmpdir();

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "No files provided" },
        { status: 400 }
      );
    }

    const anthropicKey =
      process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_TOKEN ||
      process.env.ANTHROPIC_API;
    if (!anthropicKey) {
      return NextResponse.json(
        {
          message:
            "Anthropic API key not configured. Set ANTHROPIC_API_KEY in your environment.",
        },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey: anthropicKey });
    const allBidItems: ExtractedBidItem[] = [];

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate temp filename
      const timestamp = Date.now();
      const filename = `temp_${timestamp}_${Math.random().toString(36).substring(7)}_${file.name}`;
      const filePath = path.join(uploadDir, filename);

      // Write file temporarily
      fs.writeFileSync(filePath, buffer);

      try {
        const isPDF = file.type === "application/pdf";

        if (isPDF) {
          // Extract text from PDF
          const pdfText = await extractTextFromPDF(filePath);

          // Send to Claude for analysis
          const response = await client.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            messages: [
              {
                role: "user",
                content: `Please analyze this bid document and extract line items. For each item found, extract:
- description: Full product description (e.g., "Kohler K-3978 Kitchen Faucet, Chrome")
- quantity: Number of units
- unitPrice: Price per unit (numeric, null if not found)
- totalCost: Total cost for this line item (numeric, null if not found)
- vendor: Supplier/vendor name (null if not found)
- warrantyType: Any warranty information mentioned (e.g., "5-year limited", "lifetime", "10-year", null if not found)
- warrantyDuration: Warranty duration in months (null if not found, try to convert years to months if only years mentioned)

Document text:
${pdfText}

Return ONLY a valid JSON object with this structure:
{
  "items": [
    {
      "description": "Kohler K-3978 Kitchen Faucet, Chrome",
      "quantity": 1,
      "unitPrice": 450.00,
      "totalCost": 450.00,
      "vendor": "Home Depot",
      "warrantyType": "5-year limited",
      "warrantyDuration": 60
    }
  ]
}

If no items are found, return empty items array.`,
              },
            ],
          });

          const responseText =
            response.content[0].type === "text" ? response.content[0].text : "{}";

          try {
            const parsed = JSON.parse(responseText);
            if (parsed.items && Array.isArray(parsed.items)) {
              allBidItems.push(...parsed.items);
            }
          } catch (e) {
            console.error("Failed to parse PDF response:", e);
          }
        } else {
          // Handle image files (bid images)
          const base64 = buffer.toString("base64");

          // Determine media type
          let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" =
            "image/jpeg";

          if (file.type === "image/jpeg" || file.type === "image/jpg") {
            mediaType = "image/jpeg";
          } else if (file.type === "image/png") {
            mediaType = "image/png";
          } else if (file.type === "image/gif") {
            mediaType = "image/gif";
          } else if (file.type === "image/webp") {
            mediaType = "image/webp";
          }

          // Send to Claude for analysis
          const response = await client.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: mediaType,
                      data: base64,
                    },
                  },
                  {
                    type: "text",
                    text: `Please analyze this bid document image and extract all line items. For each item found, extract:
- description: Full product description (e.g., "Kohler K-3978 Kitchen Faucet, Chrome")
- quantity: Number of units
- unitPrice: Price per unit (numeric, null if not found)
- totalCost: Total cost for this line item (numeric, null if not found)
- vendor: Supplier/vendor name (null if not found)
- warrantyType: Any warranty information mentioned (e.g., "5-year limited", "lifetime", "10-year", null if not found)
- warrantyDuration: Warranty duration in months (null if not found, try to convert years to months if only years mentioned)

Return ONLY a valid JSON object with this structure:
{
  "items": [
    {
      "description": "Sub-Zero PRO 48 Refrigerator",
      "quantity": 1,
      "unitPrice": 8500.00,
      "totalCost": 8500.00,
      "vendor": "Appliance Direct",
      "warrantyType": "5-year limited",
      "warrantyDuration": 60
    }
  ]
}

If no items are found, return empty items array.`,
                  },
                ],
              },
            ],
          });

          const responseText =
            response.content[0].type === "text" ? response.content[0].text : "{}";

          try {
            const parsed = JSON.parse(responseText);
            if (parsed.items && Array.isArray(parsed.items)) {
              allBidItems.push(...parsed.items);
            }
          } catch (e) {
            console.error("Failed to parse image response:", e);
          }
        }
      } finally {
        // Clean up temp file
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Failed to delete temp file:", e);
        }
      }
    }

    // Now match bid items to existing assets
    const existingAssets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        manufacturer: true,
        model: true,
        sku: true,
      },
    });

    const matches: BidExtractionResult["matches"] = [];

    for (let i = 0; i < allBidItems.length; i++) {
      const bidItem = allBidItems[i];
      let bestMatch = null;
      let bestScore = 0;

      // Try to match against existing assets
      for (const asset of existingAssets) {
        // Match against asset name
        const nameScore = calculateSimilarity(
          bidItem.description,
          asset.name
        );

        // Also check manufacturer and model
        let mfgScore = 0;
        if (asset.manufacturer) {
          mfgScore = calculateSimilarity(bidItem.description, asset.manufacturer);
        }

        const score = Math.max(nameScore, mfgScore);

        // Only consider matches with at least 50% similarity
        if (score > bestScore && score >= 50) {
          bestScore = score;
          bestMatch = {
            bidItemIndex: i,
            assetId: asset.id,
            assetName: asset.name,
            manufacturer: asset.manufacturer,
            model: asset.model,
            confidence: Math.round(score),
          };
        }
      }

      if (bestMatch) {
        matches.push(bestMatch);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          items: allBidItems,
          matches,
        },
        message: `Extracted ${allBidItems.length} bid item(s), matched ${matches.length} to existing assets`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Extract bid error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to process bid files",
      },
      { status: 500 }
    );
  }
}
