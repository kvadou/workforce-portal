import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const IS_S3_CONFIGURED = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// Initialize S3 client (only when credentials are available)
const s3Client = IS_S3_CONFIGURED
  ? new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    })
  : null;

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "demo-uploads";

// Generate a unique filename
export function generateFilename(originalName: string): string {
  const extension = originalName.split(".").pop();
  return `${uuidv4()}.${extension}`;
}

// Generate a presigned URL for uploading
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  folder: string = "uploads"
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const key = `${folder}/${filename}`;

  // Stub: return mock URLs when S3 is not configured
  if (!s3Client) {
    console.log(`[S3 Stub] Would upload ${key} (${contentType})`);
    return {
      uploadUrl: `https://example.com/mock-upload/${key}`,
      key,
      publicUrl: `https://example.com/mock-files/${key}`,
    };
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  // Construct the public URL
  const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

  return { uploadUrl, key, publicUrl };
}

// Delete a file from S3
export async function deleteFile(key: string): Promise<void> {
  if (!s3Client) {
    console.log(`[S3 Stub] Would delete ${key}`);
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

// Get file extension from MIME type
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "application/pdf": "pdf",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
  };

  return mimeToExt[mimeType] || "bin";
}

// Validate file type
export function isValidFileType(mimeType: string): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "application/pdf",
    "audio/mpeg",
    "audio/wav",
  ];

  return allowedTypes.includes(mimeType);
}

// Get max file size based on type (in bytes)
export function getMaxFileSize(mimeType: string): number {
  if (mimeType.startsWith("video/")) {
    return 500 * 1024 * 1024; // 500MB for videos
  }
  if (mimeType.startsWith("image/")) {
    return 10 * 1024 * 1024; // 10MB for images
  }
  if (mimeType === "application/pdf") {
    return 50 * 1024 * 1024; // 50MB for PDFs
  }
  return 10 * 1024 * 1024; // 10MB default
}
