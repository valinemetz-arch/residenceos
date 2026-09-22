import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { getAnthropicClient, parseJsonResponse } from "@/lib/ai";

const MODEL = "claude-sonnet-5";

interface TagResult {
  space: string | null;
  trade: string | null;
  note: string | null;
}

function buildPrompt(spaceNames: string[], tradeNames: string[]): string {
  return `You are reviewing one sheet from a spec book or interior-elevation set for a custom home, to file it so a contractor or the homeowner can pull up a specific room or trade and see exactly the right sheet.

Only use these exact Space names (use the exact string, nothing else) - or null if the sheet isn't specific to one space (e.g. a cover sheet, a general note sheet, or a schedule spanning multiple rooms):
${spaceNames.map((n) => `- ${n}`).join("\n")}

Only use these exact Trade names (use the exact string, nothing else) - or null if no single trade owns this sheet:
${tradeNames.map((n) => `- ${n}`).join("\n")}

Rules:
1. Pick the single best-matching Space if this sheet clearly depicts or specifies one room (an interior elevation, a room-specific fixture schedule, a millwork detail for one space). If it spans multiple rooms or none, use null.
2. Pick the single best-matching Trade if this sheet is clearly that trade's material (a plumbing fixture spec, an electrical fixture schedule, a door/window schedule, an appliance cut sheet). If it's general/architectural with no single trade, use null.
3. "note" should be a short (under 12 words) plain-English label a contractor would recognize, e.g. "Primary Bathroom - Elevation C, shower valve + tile" or "Kitchen appliance cut sheets".
4. If the sheet has no useful content (blank, a title block only, illegible), return all nulls.

Return ONLY a JSON object (no markdown, no commentary) shaped exactly like:
{"space": "<one of the space names above or null>", "trade": "<one of the trade names above or null>", "note": "<short label or null>"}`;
}

// POST /api/documents/[id]/tag-page - processes the next pending DocumentPage
// for this document: sends its rendered image to Claude with the real list
// of Space and Trade names, stores the suggestion, and marks it "tagged".
// Driven in a loop from the client, one page per request (same pattern as
// /api/plan-sets/[id]/extract-page), so nothing needs the AI call for every
// page to finish inside one HTTP request. Suggestions are NOT auto-confirmed
// - an admin reviews and confirms each page before it appears in Field
// Reference.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    const nextPage = await prisma.documentPage.findFirst({
      where: { documentId, status: "pending" },
      orderBy: { pageNumber: "asc" },
    });

    const [processedCount, totalCount] = await Promise.all([
      prisma.documentPage.count({ where: { documentId, status: { not: "pending" } } }),
      prisma.documentPage.count({ where: { documentId } }),
    ]);

    if (!nextPage) {
      return NextResponse.json(successResponse({ done: true, processedCount, totalCount }));
    }

    const [spaces, trades] = await Promise.all([
      prisma.space.findMany({ select: { id: true, name: true } }),
      prisma.trade.findMany({ select: { id: true, name: true } }),
    ]);
    const spaceByName = new Map(spaces.map((s) => [s.name.toLowerCase(), s]));
    const tradeByName = new Map(trades.map((t) => [t.name.toLowerCase(), t]));

    try {
      const imageRes = await fetch(nextPage.imageUrl);
      const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
      const imageBase64 = imageBuffer.toString("base64");

      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/png", data: imageBase64 },
              },
              {
                type: "text",
                text: buildPrompt(
                  spaces.map((s) => s.name),
                  trades.map((t) => t.name)
                ),
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const result = textBlock
        ? parseJsonResponse<TagResult>(textBlock.text)
        : { space: null, trade: null, note: null };

      const suggestedSpace = result.space ? spaceByName.get(result.space.toLowerCase()) : undefined;
      const suggestedTrade = result.trade ? tradeByName.get(result.trade.toLowerCase()) : undefined;

      await prisma.documentPage.update({
        where: { id: nextPage.id },
        data: {
          status: "tagged",
          suggestedSpaceId: suggestedSpace?.id || null,
          suggestedTradeId: suggestedTrade?.id || null,
          suggestedNote: result.note || null,
        },
      });

      return NextResponse.json(
        successResponse({
          done: false,
          pageNumber: nextPage.pageNumber,
          processedCount: processedCount + 1,
          totalCount,
        })
      );
    } catch (pageError) {
      console.error(`Tagging failed for page ${nextPage.pageNumber}:`, pageError);
      await prisma.documentPage.update({
        where: { id: nextPage.id },
        data: { status: "failed" },
      });
      return NextResponse.json(
        successResponse({
          done: false,
          pageNumber: nextPage.pageNumber,
          failed: true,
          processedCount: processedCount + 1,
          totalCount,
        })
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to tag page"), { status: 500 });
  }
}
