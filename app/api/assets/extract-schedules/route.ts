import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import * as pdfjs from "pdfjs-dist";

interface PDFTextItem {
  str: string;
}

function isPDFTextItem(item: unknown): item is PDFTextItem {
  return typeof item === "object" && item !== null && "str" in item;
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const pdf = await pdfjs.getDocument({ data: fileBuffer }).promise;
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

interface ExtractedDoor {
  type: string;
  quantity: number;
  size: string | null;
  location: string | null;
  material: string | null;
  hardware: string | null;
  room: string | null;
}

interface ExtractedWindow {
  type: string;
  quantity: number;
  size: string | null;
  location: string | null;
  material: string | null;
  glazing: string | null;
  room: string | null;
}

interface ExtractedSchedule {
  doors: ExtractedDoor[];
  windows: ExtractedWindow[];
}

export async function POST(request: NextRequest) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");

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
    const combinedSchedule: ExtractedSchedule = { doors: [], windows: [] };

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
            max_tokens: 3000,
            messages: [
              {
                role: "user",
                content: `Please analyze this architectural schedule document and extract door and window information. Look for door and window schedules, specifications, or any lists of doors and windows.

For each DOOR found, extract:
- type: Door type/style (e.g., "Single Panel", "Bifold", "French Doors", "Sliding", "Entry Door")
- quantity: How many of this type (as number)
- size: Door width/size (e.g., "36x80", "3'0" x 6'8"")
- location: Physical location in building (e.g., "NW corner", "between kitchen and dining")
- material: Door material (e.g., "Wood", "Steel", "Fiberglass")
- hardware: Hardware specification (e.g., "Oil-rubbed bronze handles", "Polished chrome")
- room: Room name where door is located (e.g., "Kitchen", "Master Bedroom")

For each WINDOW found, extract:
- type: Window type/style (e.g., "Double Hung", "Casement", "Slider", "Fixed", "Picture Window")
- quantity: How many of this type (as number)
- size: Window size (e.g., "36x48", "3'6" x 4'0"")
- location: Physical location in building (e.g., "west wall", "north elevation")
- material: Frame material (e.g., "Vinyl", "Aluminum", "Wood")
- glazing: Glazing type (e.g., "Low-E", "Tempered", "Double-pane", "Triple-pane")
- room: Room name where window is located (e.g., "Living Room", "Master Bath")

Document text:
${pdfText}

Return ONLY a valid JSON object with this structure:
{
  "doors": [{"type":"Single Panel","quantity":2,"size":"36x80","location":"Main entry","material":"Fiberglass","hardware":"Chrome handles","room":"Foyer"}],
  "windows": [{"type":"Double Hung","quantity":3,"size":"36x48","location":"East wall","material":"Vinyl","glazing":"Low-E","room":"Living Room"}]
}

If doors or windows aren't found, use empty arrays for those fields.`,
              },
            ],
          });

          const responseText =
            response.content[0].type === "text" ? response.content[0].text : "{}";

          try {
            const parsed = JSON.parse(responseText);
            if (parsed.doors && Array.isArray(parsed.doors)) {
              combinedSchedule.doors.push(...parsed.doors);
            }
            if (parsed.windows && Array.isArray(parsed.windows)) {
              combinedSchedule.windows.push(...parsed.windows);
            }
          } catch (e) {
            console.error("Failed to parse PDF response:", e);
          }
        } else {
          // Handle image files (architectural plan images)
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
            max_tokens: 3000,
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
                    text: `Please analyze this architectural plan image and extract door and window information. Look for door and window schedules, symbols, or any visual lists of doors and windows in the plan.

For each DOOR found, extract:
- type: Door type/style (e.g., "Single Panel", "Bifold", "French Doors", "Sliding", "Entry Door")
- quantity: How many of this type (as number)
- size: Door width/size (e.g., "36x80", "3'0" x 6'8"")
- location: Physical location in building (e.g., "NW corner", "between kitchen and dining")
- material: Door material (e.g., "Wood", "Steel", "Fiberglass")
- hardware: Hardware specification (e.g., "Oil-rubbed bronze handles")
- room: Room name where door is located (e.g., "Kitchen", "Master Bedroom")

For each WINDOW found, extract:
- type: Window type/style (e.g., "Double Hung", "Casement", "Slider", "Fixed", "Picture Window")
- quantity: How many of this type (as number)
- size: Window size (e.g., "36x48", "3'6" x 4'0"")
- location: Physical location in building (e.g., "west wall", "north elevation")
- material: Frame material (e.g., "Vinyl", "Aluminum", "Wood")
- glazing: Glazing type (e.g., "Low-E", "Tempered", "Double-pane")
- room: Room name where window is located (e.g., "Living Room", "Master Bath")

Return ONLY a valid JSON object with this structure:
{
  "doors": [{"type":"Entry Door","quantity":1,"size":"36x80","location":"Front entry","material":"Fiberglass","hardware":"Brushed nickel","room":"Foyer"}],
  "windows": [{"type":"Double Hung","quantity":2,"size":"36x48","location":"East wall","material":"Vinyl","glazing":"Low-E","room":"Living Room"}]
}

If doors or windows aren't found, use empty arrays for those fields.`,
                  },
                ],
              },
            ],
          });

          const responseText =
            response.content[0].type === "text" ? response.content[0].text : "{}";

          try {
            const parsed = JSON.parse(responseText);
            if (parsed.doors && Array.isArray(parsed.doors)) {
              combinedSchedule.doors.push(...parsed.doors);
            }
            if (parsed.windows && Array.isArray(parsed.windows)) {
              combinedSchedule.windows.push(...parsed.windows);
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
        data: combinedSchedule,
        message: `Extracted ${combinedSchedule.doors.length} door types and ${combinedSchedule.windows.length} window types from ${files.length} file(s)`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Extract schedules error:", error);
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
