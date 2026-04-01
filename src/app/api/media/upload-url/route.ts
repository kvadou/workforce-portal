import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { presignedUrlRequestSchema } from "@/lib/validations/media";
import {
  getPresignedUploadUrl,
  generateFilename,
  isValidFileType,
  getMaxFileSize,
} from "@/lib/s3";

// POST /api/media/upload-url - Get a presigned URL for uploading
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = presignedUrlRequestSchema.parse(body);

    // Validate file type
    if (!isValidFileType(validatedData.mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = getMaxFileSize(validatedData.mimeType);
    if (validatedData.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename and get presigned URL
    const uniqueFilename = generateFilename(validatedData.filename);
    const folder = validatedData.folder || "uploads";

    const { uploadUrl, key, publicUrl } = await getPresignedUploadUrl(
      uniqueFilename,
      validatedData.mimeType,
      folder
    );

    return NextResponse.json({
      uploadUrl,
      key,
      publicUrl,
      filename: uniqueFilename,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
