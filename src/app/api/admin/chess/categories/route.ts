import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chess/categories
 * Get all lesson categories with lesson counts
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await prisma.chessLessonCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        lessonCount: c._count.lessons,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching chess categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/chess/categories
 * Create a new lesson category
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, color, order } = body;

    if (!name || !slug || !color) {
      return NextResponse.json(
        { error: "name, slug, and color are required" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.chessLessonCategory.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.chessLessonCategory.create({
      data: {
        name,
        slug,
        color,
        order: order !== undefined ? parseInt(order) : 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating chess category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
