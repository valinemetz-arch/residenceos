import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const PRIVATE_BLOB_HOST_SUFFIX = ".private.blob.vercel-storage.com";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Blob URL is required" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.endsWith(PRIVATE_BLOB_HOST_SUFFIX)) {
      return NextResponse.json({ error: "Invalid Blob URL" }, { status: 400 });
    }

    const result = await get(url, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Length": String(result.blob.size),
        "Cache-Control": result.blob.cacheControl,
        ETag: result.blob.etag,
      },
    });
  } catch (error) {
    console.error("Private Blob read failed:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}