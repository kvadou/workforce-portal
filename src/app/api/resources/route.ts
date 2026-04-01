import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole, getRoleLevel } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resourceCreateSchema, visibilityEnum } from "@/lib/validations/resource";
import { Prisma, Visibility } from "@prisma/client";

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Map visibility to minimum role required
const VISIBILITY_ROLE_MAP: Record<Visibility, string> = {
  ALL_TUTORS: "TUTOR",
  LEAD_TUTORS: "LEAD_TUTOR",
  FRANCHISEE_OWNERS: "FRANCHISEE_OWNER",
  ADMINS_ONLY: "ADMIN",
};

// GET /api/resources - List resources with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const visibility = searchParams.get("visibility");
    const organizationId = searchParams.get("organizationId");
    const isActive = searchParams.get("isActive");
    const includeShared = searchParams.get("includeShared") !== "false";
    const search = searchParams.get("search");
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(100, parsePositiveInt(searchParams.get("limit"), 50));
    const skip = (page - 1) * limit;

    const userRole = session.user.role;
    const userOrgId = session.user.organizationId;
    const isAdmin = hasMinRole(userRole, "ADMIN");

    // Build where clause
    const where: Prisma.ResourceWhereInput = {};

    // Category filter
    if (category) {
      where.category = category as Prisma.EnumResourceCategoryFilter;
    }

    // Type filter
    if (type) {
      where.type = type as Prisma.EnumResourceTypeFilter;
    }

    // Visibility filter based on user role
    // Users can only see resources they have access to based on their role
    if (!isAdmin) {
      const accessibleVisibilities: Visibility[] = [];
      for (const [vis, minRole] of Object.entries(VISIBILITY_ROLE_MAP)) {
        if (hasMinRole(userRole, minRole)) {
          accessibleVisibilities.push(vis as Visibility);
        }
      }
      where.visibility = { in: accessibleVisibilities };
    } else if (visibility) {
      // Admins can filter by specific visibility
      where.visibility = visibility as Visibility;
    }

    // Organization filter
    // Non-admins see shared resources (null orgId) + their own org's resources
    if (!isAdmin) {
      if (includeShared) {
        where.OR = [
          { organizationId: null }, // Shared resources
          { organizationId: userOrgId || undefined }, // User's org resources
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

    // Active filter - default to true for non-admins
    if (isActive !== null) {
      where.isActive = isActive === "true";
    } else if (!isAdmin) {
      where.isActive = true;
    }

    // Search filter - searches title and description
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.AND = [
        ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
        {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
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
          { category: "asc" },
          { order: "asc" },
          { title: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ]);

    return NextResponse.json({
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      hasMore: skip + resources.length < total,
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

// POST /api/resources - Create new resource
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can create resources
    if (!hasMinRole(session.user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = resourceCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get the max order for this category
    const maxOrderResource = await prisma.resource.findFirst({
      where: { category: data.category },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const resource = await prisma.resource.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        url: data.url,
        fileUrl: data.fileUrl,
        thumbnailUrl: data.thumbnailUrl,
        content: data.content,
        organizationId: data.organizationId,
        visibility: data.visibility ?? "ALL_TUTORS",
        order: data.order ?? (maxOrderResource?.order ?? 0) + 1,
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

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
