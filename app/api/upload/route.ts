import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { NextRequest, NextResponse } from "next/server";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/jpg": [".jpg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
};

function isAllowedFileType(file: File) {
  const fileType = file.type;
  const fileExtension = extname(file.name).toLowerCase();
  const normalizedType = fileType === "image/jpg" ? "image/jpeg" : fileType;

  if (normalizedType && ALLOWED_TYPES[normalizedType]) {
    return true;
  }

  return Object.values(ALLOWED_TYPES).some((extensions) =>
    extensions.includes(fileExtension)
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Entity type and ID required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAllowedFileType(file)) {
      return NextResponse.json(
        { error: `File type ${file.type || extname(file.name)} not allowed` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (e) {
      // Directory may already exist
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename
    const timestamp = Date.now();
    const filename = `${entityType}_${entityId}_${timestamp}_${file.name}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file
    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      fileUrl: `/uploads/${filename}`,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
