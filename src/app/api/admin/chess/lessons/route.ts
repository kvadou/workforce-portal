import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chess/lessons
 * List all lessons, optionally filtered by categoryId
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

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    const where: Prisma.ChessLessonWhereInput = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const lessons = await prisma.chessLesson.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: { levels: true },
        },
      },
    });

    return NextResponse.json({
      lessons: lessons.map((l) => ({
        ...l,
        levelCount: l._count.levels,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching chess lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/chess/lessons
 * Create a new lesson
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
    const { title, subtitle, iconEmoji, order, categoryId } = body;

    if (!title || !categoryId) {
      return NextResponse.json(
        { error: "title and categoryId are required" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.chessLessonCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const lesson = await prisma.chessLesson.create({
      data: {
        title,
        subtitle: subtitle || null,
        iconEmoji: iconEmoji || null,
        order: order !== undefined ? parseInt(order) : 0,
        categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Error creating chess lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
