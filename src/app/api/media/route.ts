import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mediaCreateSchema } from "@/lib/validations/media";

// GET /api/media - List all media
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const mimeType = searchParams.get("mimeType");
    const type = searchParams.get("type"); // Support MediaLibrary format
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (mimeType) {
      where.mimeType = { startsWith: mimeType.split("/")[0] };
    } else if (type && type !== "all") {
      // Map type to mimeType patterns for MediaLibrary
      const typeMap: Record<string, string[]> = {
        image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
        video: ["video/mp4", "video/webm", "video/quicktime"],
        document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      };
      if (typeMap[type]) {
        where.mimeType = { in: typeMap[type] };
      }
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { originalName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          uploadedBy: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.media.count({ where }),
    ]);

    // Transform to MediaLibrary format
    const items = media.map((item) => ({
      id: item.id,
      url: item.url,
      filename: item.originalName,
      type: item.mimeType.startsWith("image/")
        ? "image"
        : item.mimeType.startsWith("video/")
        ? "video"
        : item.mimeType === "application/pdf" || item.mimeType.includes("document")
        ? "document"
        : "other",
      size: item.size,
      uploadedAt: item.createdAt.toISOString(),
      thumbnail: item.thumbnailUrl || (item.mimeType.startsWith("image/") ? item.url : undefined),
    }));

    return NextResponse.json({
      media, // Original format for backward compatibility
      items, // MediaLibrary format
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

// POST /api/media - Create a new media record (after upload to S3)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = mediaCreateSchema.parse(body);

    const media = await prisma.media.create({
      data: {
        ...validatedData,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Error creating media:", error);
    return NextResponse.json({ error: "Failed to create media" }, { status: 500 });
  }
}
