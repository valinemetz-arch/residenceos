import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
// pdfjs-dist's default build assumes a browser Worker and, when it can't
// spawn one in a Node serverless function, falls back to a "fake worker"
// that tries to require pdf.worker.mjs as a module — a file Vercel's build
// doesn't bundle, causing a crash. The "legacy" Node build runs PDF parsing
// entirely on the main thread instead, so no worker file is ever needed.
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ParseResult {
  amount: number | null;
  description: string;
  confidence: "high" | "medium" | "low";
}

async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  // pdfjs-dist rejects Node's Buffer even though it's a Uint8Array subclass;
  // convert explicitly to a plain Uint8Array.
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(fileBuffer) })
    .promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    text += pageText + "\n";
  }

  return text;
}

async function fetchUploadedFile(fileUrl: string): Promise<Buffer> {
  const url = new URL(fileUrl);

  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".blob.vercel-storage.com")
  ) {
    throw new Error("Invalid upload URL");
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Uploaded file could not be fetched");
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer());
  if (fileBuffer.byteLength > 10 * 1024 * 1024) {
    throw new Error("Uploaded file exceeds 10MB limit");
  }

  return fileBuffer;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl, fileName } = body;

    if (!fileUrl || !fileName) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "File URL and name required" },
        { status: 400 }
      );
    }

    const isPDF = fileName.toLowerCase().endsWith(".pdf");
    // Ensure Anthropic API key is configured
    const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_TOKEN || process.env.ANTHROPIC_API;
    if (!anthropicKey) {
      return NextResponse.json<ApiResponse<unknown>>(
        { success: false, error: "Anthropic API key not configured. Set ANTHROPIC_API_KEY in your environment." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey: anthropicKey });

    // Handle PDF vs Image
    if (isPDF) {
      // Extract text from PDF
      const fileBuffer = await fetchUploadedFile(fileUrl);
      const pdfText = await extractTextFromPDF(fileBuffer);

      // Send text to Claude for parsing
      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Please analyze this invoice text and extract the total amount due or invoice total.

Text from invoice:
${pdfText}

Return your response in this exact JSON format (no markdown, just JSON):
{
  "amount": <number or null if not found>,
  "description": "<brief description of what was found>",
  "confidence": "<high|medium|low>"
}

Only return the JSON object, nothing else.`,
          },
        ],
      });

      // Parse the response
      const responseText =
        response.content[0].type === "text" ? response.content[0].text : "";

      let parseResult: ParseResult;
      try {
        parseResult = JSON.parse(responseText);
      } catch {
        return NextResponse.json<ApiResponse<unknown>>(
          { success: false, error: "Failed to parse AI response" },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<ParseResult>>(
        { success: true, data: parseResult },
        { status: 200 }
      );
    } else {
      // Handle image files
      const fileBuffer = await fetchUploadedFile(fileUrl);
      const base64 = fileBuffer.toString("base64");

      // Determine media type from file extension
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
        mediaType = "image/jpeg";
      } else if (fileName.endsWith(".png")) {
        mediaType = "image/png";
      } else if (fileName.endsWith(".gif")) {
        mediaType = "image/gif";
      } else if (fileName.endsWith(".webp")) {
        mediaType = "image/webp";
      } else {
        return NextResponse.json<ApiResponse<unknown>>(
          {
            success: false,
            error:
              "Unsupported file type. Please upload an image (JPG, PNG, GIF, WebP) or PDF of your invoice.",
          },
          { status: 400 }
        );
      }

      // Send to Claude for invoice parsing
      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
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
                text: `Please analyze this invoice or receipt document and extract the total amount due or invoice total.

                Return your response in this exact JSON format (no markdown, just JSON):
                {
                  "amount": <number or null if not found>,
                  "description": "<brief description of what was found>",
                  "confidence": "<high|medium|low>"
                }

                Only return the JSON object, nothing else.`,
              },
            ],
          },
        ],
      });

      // Parse the response
      const responseText =
        response.content[0].type === "text" ? response.content[0].text : "";

      let parseResult: ParseResult;
      try {
        parseResult = JSON.parse(responseText);
      } catch {
        return NextResponse.json<ApiResponse<unknown>>(
          { success: false, error: "Failed to parse AI response" },
          { status: 500 }
        );
      }

      return NextResponse.json<ApiResponse<ParseResult>>(
        { success: true, data: parseResult },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Invoice parsing error:", error);
    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse invoice",
      },
      { status: 500 }
    );
  }
}
