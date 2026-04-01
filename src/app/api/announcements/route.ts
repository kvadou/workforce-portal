import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { announcementCreateSchema } from "@/lib/validations/announcement";
import { Prisma, UserRole } from "@prisma/client";

// GET /api/announcements - List announcements with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const organizationId = searchParams.get("organizationId");
    const isPinned = searchParams.get("isPinned");
    const isActive = searchParams.get("isActive");
    const includeExpired = searchParams.get("includeExpired") === "true";
    const includeShared = searchParams.get("includeShared") !== "false";

    const userRole = session.user.role as UserRole;
    const userOrgId = session.user.organizationId;
    const isAdmin = hasMinRole(userRole, "ADMIN");

    // Build where clause
    const where: Prisma.AnnouncementWhereInput = {};

    // Type filter
    if (type) {
      where.type = type as Prisma.EnumAnnouncementTypeFilter;
    }

    // Filter by target roles - users only see announcements that include their role
    if (!isAdmin) {
      where.targetRoles = {
        has: userRole,
      };
    }

    // Organization filter
    // Non-admins see shared announcements (null orgId) + their own org's announcements
    if (!isAdmin) {
      if (includeShared) {
        where.OR = [
          { organizationId: null }, // Shared announcements
          { organizationId: userOrgId || undefined }, // User's org announcements
        ];
      } else {
        where.organizationId = userOrgId || undefined;
      }
    } else if (organizationId) {
      // Admins can filter by specific org
      if (organizationId === "shared") {
        where.organizationId = null;
      } else {
        where.organizationId = organizationId;
      }
    }

    // Pinned filter
    if (isPinned !== null) {
      where.isPinned = isPinned === "true";
    }

    // Active filter - default to true for non-admins
    if (isActive !== null) {
      where.isActive = isActive === "true";
    } else if (!isAdmin) {
      where.isActive = true;
    }

    // Date filters - exclude expired and future announcements for non-admins
    if (!isAdmin) {
      const now = new Date();
      where.publishDate = { lte: now };
      if (!includeExpired) {
        where.OR = where.OR || [];
        // Either no expiration or not yet expired
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ];
      }
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { publishDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST /api/announcements - Create new announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create announcements
    if (!hasMinRole(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = announcementCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        linkText: data.linkText,
        organizationId: data.organizationId,
        targetRoles: data.targetRoles,
        isPinned: data.isPinned ?? false,
        publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
