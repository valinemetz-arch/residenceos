import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Vercel Serverless Functions cap the inbound request body at 4.5MB, which
// permit-set PDFs blow past easily (tens of MB is common). This route only
// authorizes a direct browser-to-Blob upload - the PDF bytes never pass
// through a Function, so that limit doesn't apply. The actual PlanSet
// creation (render pages, etc) happens afterward in POST /api/plan-sets,
// which takes the resulting Blob URL rather than the file itself.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["application/pdf"],
          addRandomSuffix: true,
          // Generous headroom for a full architectural permit set - the
          // Blob-wide ceiling is 5TB, this is just a sane app-level cap.
          maximumSizeInBytes: 200 * 1024 * 1024, // 200MB
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Plan set PDF uploaded to Blob:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
