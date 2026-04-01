import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CourseCategory } from "@prisma/client";

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * GET /api/training
 * Get published training courses for tutors (catalog view)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as CourseCategory | null;
    const search = searchParams.get("search");
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(100, parsePositiveInt(searchParams.get("limit"), 24));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.trainingCourse.findMany({
        where,
        orderBy: [{ category: "asc" }, { order: "asc" }],
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnailUrl: true,
          duration: true,
          difficulty: true,
          category: true,
          isRequired: true,
          prerequisites: true,
          modules: {
            orderBy: { order: "asc" },
            select: { id: true, title: true },
          },
        },
      }),
      prisma.trainingCourse.count({ where }),
    ]);

    // Get user's enrollments
    const courseIds = courses.map((c) => c.id);
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: session.user.id,
        ...(courseIds.length > 0 && { courseId: { in: courseIds } }),
      },
      select: {
        courseId: true,
        status: true,
        progress: true,
        startedAt: true,
        completedAt: true,
      },
    });

    const enrollmentMap = new Map(
      enrollments.map((e) => [e.courseId, e])
    );

    // Merge enrollment data with courses
    const coursesWithProgress = courses.map((course) => {
      const enrollment = enrollmentMap.get(course.id);
      return {
        ...course,
        moduleCount: course.modules.length,
        enrollment: enrollment
          ? {
              status: enrollment.status,
              progress: enrollment.progress,
              startedAt: enrollment.startedAt,
              completedAt: enrollment.completedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      courses: coursesWithProgress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      hasMore: skip + courses.length < total,
    });
  } catch (error) {
    console.error("Error fetching training courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch training courses" },
      { status: 500 }
    );
  }
}
