import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, CourseDifficulty, CourseCategory } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/courses/[id]
 * Get course details with modules and enrollment stats
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const course = await prisma.trainingCourse.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            moduleProgress: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Calculate enrollment statistics
    const enrollmentStats = await prisma.courseEnrollment.groupBy({
      by: ["status"],
      where: { courseId: id },
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

    return NextResponse.json({
      ...course,
      enrollmentStats: stats,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses/[id]
 * Update a training course
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
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
      order,
      prerequisites,
    } = body;

    // Check if course exists
    const existing = await prisma.trainingCourse.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check for duplicate slug (if changed)
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.trainingCourse.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A course with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Determine publishedAt
    let publishedAt = existing.publishedAt;
    if (isPublished && !existing.isPublished) {
      publishedAt = new Date();
    } else if (!isPublished) {
      publishedAt = null;
    }

    const course = await prisma.trainingCourse.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        thumbnailUrl,
        duration,
        difficulty: difficulty as CourseDifficulty,
        category: category as CourseCategory,
        isRequired,
        isPublished,
        order,
        prerequisites,
        publishedAt,
      },
      include: {
        modules: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses/[id]
 * Delete a training course
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden - Super Admin required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if course exists
    const existing = await prisma.trainingCourse.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Warn if there are enrollments
    if (existing._count.enrollments > 0) {
      const { searchParams } = new URL(req.url);
      const force = searchParams.get("force") === "true";

      if (!force) {
        return NextResponse.json(
          {
            error: "Course has enrollments",
            enrollmentCount: existing._count.enrollments,
            message: "Add ?force=true to delete anyway",
          },
          { status: 409 }
        );
      }
    }

    await prisma.trainingCourse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
