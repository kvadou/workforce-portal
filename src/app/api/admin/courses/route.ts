import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, CourseCategory, CourseDifficulty } from "@prisma/client";

/**
 * GET /api/admin/courses
 * Get all training courses with enrollment stats
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
    const category = searchParams.get("category") as CourseCategory | null;
    const isPublished = searchParams.get("isPublished");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (isPublished !== null) {
      where.isPublished = isPublished === "true";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const courses = await prisma.trainingCourse.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }],
      include: {
        modules: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    // Get enrollment stats
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentStats = await prisma.courseEnrollment.groupBy({
          by: ["status"],
          where: { courseId: course.id },
          _count: true,
        });

        const stats = {
          totalEnrolled: course._count.enrollments,
          notStarted: 0,
          inProgress: 0,
          completed: 0,
        };

        enrollmentStats.forEach((stat) => {
          if (stat.status === "NOT_STARTED") stats.notStarted = stat._count;
          if (stat.status === "IN_PROGRESS") stats.inProgress = stat._count;
          if (stat.status === "COMPLETED") stats.completed = stat._count;
        });

        return {
          ...course,
          enrollmentStats: stats,
        };
      })
    );

    return NextResponse.json({ courses: coursesWithStats });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/courses
 * Create a new training course
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
    const {
      title,
      slug,
      description,
      thumbnailUrl,
      duration,
      difficulty,
      category,
      isRequired,
      isPublished,
      prerequisites,
    } = body;

    if (!title || !slug || !category) {
      return NextResponse.json(
        { error: "title, slug, and category are required" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.trainingCourse.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A course with this slug already exists" },
        { status: 409 }
      );
    }

    // Get max order for this category
    const maxOrder = await prisma.trainingCourse.aggregate({
      where: { category },
      _max: { order: true },
    });

    const course = await prisma.trainingCourse.create({
      data: {
        title,
        slug,
        description,
        thumbnailUrl,
        duration,
        difficulty: difficulty as CourseDifficulty || "BEGINNER",
        category: category as CourseCategory,
        isRequired: isRequired ?? false,
        isPublished: isPublished ?? false,
        order: (maxOrder._max.order ?? -1) + 1,
        prerequisites: prerequisites ?? [],
        publishedAt: isPublished ? new Date() : null,
      },
      include: {
        modules: true,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
