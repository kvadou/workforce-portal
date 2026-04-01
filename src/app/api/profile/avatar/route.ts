import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getPresignedUploadUrl,
  generateFilename,
  isValidFileType,
  getMaxFileSize,
} from "@/lib/s3";

// POST - Get presigned URL for avatar upload
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { filename, contentType, size } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and content type are required" },
        { status: 400 }
      );
    }

    // Validate file type (only images allowed for avatars)
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedImageTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Only image files are allowed for avatars" },
        { status: 400 }
      );
    }

    if (!isValidFileType(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Check file size
    const maxSize = getMaxFileSize(contentType);
    if (size && size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename and get presigned URL
    const uniqueFilename = generateFilename(filename);
    const { uploadUrl, key, publicUrl } = await getPresignedUploadUrl(
      uniqueFilename,
      contentType,
      "avatars"
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
      key,
      publicUrl,
    });
  } catch (error) {
    console.error("Error generating avatar upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

/**
 * Sync avatar update to OpsHub as headshot URL.
 */
async function syncAvatarToOpsHub(userId: string, avatarUrl: string) {
  const opsHubUrl = process.env.OPSHUB_INTERNAL_URL;
  const secret = process.env.INTERNAL_API_SECRET;
  if (!opsHubUrl || !secret) return;

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: { tutorCruncherId: true },
  });
  if (!tutorProfile?.tutorCruncherId) return;

  await fetch(`${opsHubUrl}/api/internal/tutor-profile-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      tutorCruncherId: tutorProfile.tutorCruncherId,
      headshotUrl: avatarUrl,
    }),
  });
}

// PUT - Update avatar URL after successful upload
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { avatarUrl } = body;

    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Avatar URL is required" },
        { status: 400 }
      );
    }

    // Update user's avatar URL
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    // Sync avatar to OpsHub (fire-and-forget)
    syncAvatarToOpsHub(session.user.id, avatarUrl).catch((err) =>
      console.error("Avatar sync to OpsHub failed:", err.message)
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error updating avatar URL:", error);
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}
