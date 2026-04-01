import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pageCreateSchema, pageFilterSchema } from "@/lib/validations/page";
import { Prisma } from "@prisma/client";
import type { UserRole } from "@prisma/client";

// GET /api/pages - List pages with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "TUTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);

    // Parse filter params
    const filters = pageFilterSchema.parse({
      pageCategory: searchParams.get("pageCategory") || undefined,
      status: searchParams.get("status") || undefined,
      visibility: searchParams.get("visibility") || undefined,
      organizationId: searchParams.get("organizationId") || undefined,
      parentId: searchParams.get("parentId"),
      includeShared: searchParams.get("includeShared") === "true",
      search: searchParams.get("search") || undefined,
    });

    // Build where clause
    const where: Prisma.PageWhereInput = {};

    if (filters.pageCategory) {
      where.pageCategory = filters.pageCategory;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.visibility) {
      where.visibility = filters.visibility;
    }

    // Organization filtering - either specific org or shared (null)
    if (filters.organizationId) {
      if (filters.includeShared) {
        where.OR = [
          { organizationId: filters.organizationId },
          { organizationId: null },
        ];
      } else {
        where.organizationId = filters.organizationId;
      }
    }

    // Parent filtering (null means top-level pages)
    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }

    // Search in title and description
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const pages = await prisma.page.findMany({
      where,
      include: {
        organization: {
          select: { id: true, name: true, subdomain: true },
        },
        content: {
          select: { id: true, hasDraft: true, publishedAt: true },
        },
        _count: {
          select: { children: true },
        },
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

// POST /api/pages - Create a new page
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = pageCreateSchema.parse(body);

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 409 }
      );
    }

    // Get max order for this category/parent
    const maxOrder = await prisma.page.aggregate({
      where: {
        pageCategory: validatedData.pageCategory,
        parentId: validatedData.parentId ?? null,
      },
      _max: { order: true },
    });

    // Create the page with associated PageContent
    const page = await prisma.page.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        description: validatedData.description,
        featuredImage: validatedData.featuredImage,
        pageCategory: validatedData.pageCategory,
        organization: validatedData.organizationId
          ? { connect: { id: validatedData.organizationId } }
          : undefined,
        visibility: validatedData.visibility,
        parent: validatedData.parentId
          ? { connect: { id: validatedData.parentId } }
          : undefined,
        order: validatedData.order ?? (maxOrder._max.order ?? 0) + 1,
        status: validatedData.status,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        seoTitle: validatedData.seoTitle,
        noIndex: validatedData.noIndex,
        content: {
          create: {
            pageType: "page",
            pageId: "", // Will be updated after creation
            blocks: [],
            draftBlocks: [],
            hasDraft: false,
          },
        },
      },
      include: {
        organization: {
          select: { id: true, name: true, subdomain: true },
        },
        content: true,
        _count: {
          select: { children: true },
        },
      },
    });

    // Update PageContent with the correct pageId
    if (page.contentId) {
      await prisma.pageContent.update({
        where: { id: page.contentId },
        data: { pageId: page.id },
      });
    }

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error creating page:", error);
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
