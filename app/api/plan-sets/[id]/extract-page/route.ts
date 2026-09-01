import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api";
import { getAnthropicClient, parseJsonResponse } from "@/lib/ai";

const MODEL = "claude-sonnet-5";

interface ExtractedItem {
  trade: string;
  description: string;
  quantity: number | null;
  unit: string | null;
  confidence: "high" | "medium" | "low" | "manual_required" | "needs_info";
  sourceNote: string | null;
}

function buildPrompt(tradeNames: string[]): string {
  return `You are reviewing one sheet from an architectural/permit drawing set for a custom home, to build a material/quantity takeoff for contractor bidding.

Only tag items to these exact trade names (use the exact string, nothing else):
${tradeNames.map((n) => `- ${n}`).join("\n")}

Rules:
1. Only extract items that are EXPLICITLY labeled on this sheet - a schedule table row (door/window schedule, fixture schedule), a printed count callout, an appliance list, a named fixture, etc. Never guess a count that isn't shown.
2. NEVER estimate square footage, linear footage, area, or volume by eyeballing the drawing geometry (e.g. don't calculate wall area, roof area, driveway area, deck area, or room square footage yourself), even if you can see dimension lines. If this sheet is clearly relevant to a trade that would normally need a measured quantity (Foundation, Roofing, Flatwork, Stucco / Exterior Finish, Decking, Exterior Stone / Masonry siding/cladding area, Drywall wall/ceiling area, Insulation area, Landscape area), emit exactly ONE item for that trade with "confidence": "manual_required", quantity/unit null, and a sourceNote describing what needs to be measured/confirmed manually (e.g. "Roof plan shown on this sheet - confirm total roof area with the roofer").
3. If you find something relevant but can't confidently tell where it goes or what exactly is needed (e.g. wood paneling shown without a clear room/wall callout, a light fixture type without a clear location or spec), set "confidence": "needs_info" and put a specific clarifying question in sourceNote (e.g. "Wood paneling indicated on this sheet - which room/wall is this for?").
4. For clearly countable/labeled items, set confidence to "high" (explicit schedule/count), "medium" (labeled but some ambiguity), or "low" (inferred from context, not explicitly labeled).
5. If this sheet has nothing extractable (a cover sheet, a note sheet, structural calculations with no takeoff content, etc), return an empty array.

Return ONLY a JSON array (no markdown, no commentary) of objects shaped exactly like:
{"trade": "<one of the trade names above>", "description": "<specific item description>", "quantity": <number or null>, "unit": "<each|sq ft|linear ft|null>", "confidence": "<high|medium|low|manual_required|needs_info>", "sourceNote": "<brief citation or clarifying question, or null>"}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planSetId } = await params;

    const nextPage = await prisma.planPage.findFirst({
      where: { planSetId, status: "pending" },
      orderBy: { pageNumber: "asc" },
    });

    const [processedCount, totalCount] = await Promise.all([
      prisma.planPage.count({
        where: { planSetId, status: { not: "pending" } },
      }),
      prisma.planPage.count({ where: { planSetId } }),
    ]);

    if (!nextPage) {
      await prisma.planSet.update({
        where: { id: planSetId },
        data: { status: "ready" },
      });
      return NextResponse.json(
        successResponse({ done: true, processedCount, totalCount })
      );
    }

    const trades = await prisma.trade.findMany({
      select: { id: true, name: true },
    });
    const tradeByName = new Map(
      trades.map((t) => [t.name.toLowerCase(), t])
    );

    try {
      const imageRes = await fetch(nextPage.imageUrl);
      const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
      const imageBase64 = imageBuffer.toString("base64");

      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: buildPrompt(trades.map((t) => t.name)),
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const rawItems = textBlock
        ? parseJsonResponse<ExtractedItem[]>(textBlock.text)
        : [];

      let itemsCreated = 0;
      for (const item of rawItems) {
        const trade = tradeByName.get((item.trade || "").toLowerCase());

        if (item.confidence === "manual_required" && trade) {
          const existing = await prisma.takeoffItem.findFirst({
            where: { planSetId, tradeId: trade.id, confidence: "manual_required" },
          });
          if (existing) continue; // already flagged for this trade, don't duplicate per-page
        }

        await prisma.takeoffItem.create({
          data: {
            planSetId,
            planPageId: nextPage.id,
            tradeId: trade?.id || null,
            description: item.description,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            confidence: item.confidence,
            sourceNote: item.sourceNote ?? null,
          },
        });
        itemsCreated++;
      }

      await prisma.planPage.update({
        where: { id: nextPage.id },
        data: { status: "processed" },
      });

      return NextResponse.json(
        successResponse({
          done: false,
          pageNumber: nextPage.pageNumber,
          itemsFound: itemsCreated,
          processedCount: processedCount + 1,
          totalCount,
        })
      );
    } catch (pageError) {
      console.error(`Extraction failed for page ${nextPage.pageNumber}:`, pageError);
      await prisma.planPage.update({
        where: { id: nextPage.id },
        data: { status: "failed" },
      });
      return NextResponse.json(
        successResponse({
          done: false,
          pageNumber: nextPage.pageNumber,
          itemsFound: 0,
          failed: true,
          processedCount: processedCount + 1,
          totalCount,
        })
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(errorResponse("Failed to process page"), {
      status: 500,
    });
  }
}
