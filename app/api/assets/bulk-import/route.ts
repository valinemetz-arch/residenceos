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

interface ExtractedAsset {
  name: string;
  description: string | null;
  unitPrice: number | null;
  quantity: number | null;
  category: string | null;
  vendor: string | null;
  sku: string | null;
  manufacturer?: string | null;
  model?: string | null;
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
    const extractedAssets: ExtractedAsset[] = [];

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
            max_tokens: 2000,
            messages: [
              {
                role: "user",
                content: `Please analyze this document and extract asset/product information. This could be:
- An invoice or receipt (extract items, costs, vendor)
- A product datasheet or spec sheet (extract specs, model numbers, pricing)
- A build.com appliance list (extract appliance specs, model numbers, pricing)
- A material list or plan (identify materials and quantities)

For each item/asset found, extract:
- name: Product or item name
- description: Brief description or specs
- unitPrice: Price per unit (as number, null if not found)
- quantity: How many (as number, null if not found)
- category: Category or type
- vendor: Vendor or supplier name
- sku: SKU, model number, or part number
- manufacturer: Brand/manufacturer name

Document text:
${pdfText}

Return ONLY a valid JSON array of objects with the fields above. If the document doesn't contain asset information, return an empty array [].
Example: [{"name":"Water Heater","description":"40L electric","unitPrice":450.00,"quantity":1,"category":"Appliances","vendor":"Home Depot","sku":"RG40E","manufacturer":"Rheem"}]`,
              },
            ],
          });

          const responseText =
            response.content[0].type === "text" ? response.content[0].text : "[]";

          try {
            const parsed = JSON.parse(responseText);
            if (Array.isArray(parsed)) {
              extractedAssets.push(...parsed);
            }
          } catch (e) {
            console.error("Failed to parse PDF response:", e);
          }
        } else {
          // Handle image files
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
            max_tokens: 2000,
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
                    text: `Please analyze this image and extract asset/product information. This could be:
- A receipt or invoice photo (extract items, costs, vendor)
- A product photo with branding and pricing (extract product details, pricing)
- A floor plan or material list image (identify materials and quantities)
- An appliance or equipment photo (extract model numbers, specs)

For each item/asset found, extract:
- name: Product or item name
- description: Brief description or specs
- unitPrice: Price per unit (as number, null if not found)
- quantity: How many (as number, null if not found)
- category: Category or type
- vendor: Vendor or brand name
- sku: SKU, model number, or part number
- manufacturer: Brand/manufacturer name

Return ONLY a valid JSON array of objects with the fields above. If the image doesn't contain asset information, return an empty array [].
Example: [{"name":"Bathroom Tile","description":"12x24 ceramic","unitPrice":5.99,"quantity":150,"category":"Flooring","vendor":"Lowe's","sku":"BT1224","manufacturer":"Daltile"}]`,
                  },
                ],
              },
            ],
          });

          const responseText =
            response.content[0].type === "text" ? response.content[0].text : "[]";

          try {
            const parsed = JSON.parse(responseText);
            if (Array.isArray(parsed)) {
              extractedAssets.push(...parsed);
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

    return NextResponse.json(
      {
        success: true,
        data: extractedAssets,
        message: `Extracted ${extractedAssets.length} assets from ${files.length} file(s)`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to process files",
      },
      { status: 500 }
    );
  }
}
