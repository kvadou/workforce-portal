import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/admin/learning-paths
 * List all learning paths with course counts and enrollment stats
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

    const paths = await prisma.learningPath.findMany({
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                duration: true,
                isPublished: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    // Calculate stats for each path
    const pathsWithStats = await Promise.all(
      paths.map(async (path) => {
        const courseIds = path.courses.map((c) => c.courseId);

        // Count users who completed all courses in path
        const completedCount = courseIds.length > 0
          ? await prisma.courseEnrollment.groupBy({
              by: ["userId"],
              where: {
                courseId: { in: courseIds },
                status: "COMPLETED",
              },
              having: {
                courseId: {
                  _count: {
                    equals: courseIds.length,
                  },
                },
              },
            })
          : [];

        // Count users currently in progress
        const inProgressCount = courseIds.length > 0
          ? await prisma.courseEnrollment.groupBy({
              by: ["userId"],
              where: {
                courseId: { in: courseIds },
                status: { in: ["IN_PROGRESS", "NOT_STARTED"] },
              },
            })
          : [];

        return {
          ...path,
          stats: {
            totalCourses: path.courses.length,
            requiredCourses: path.courses.filter((c) => c.isRequired).length,
            totalDuration: path.courses.reduce(
              (sum, c) => sum + (c.course.duration || 0),
              0
            ),
            completedUsers: completedCount.length,
            inProgressUsers: inProgressCount.length,
          },
        };
      })
    );

    return NextResponse.json(pathsWithStats);
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning paths" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/learning-paths
 * Create a new learning path
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
    const { title, slug, description, targetRole, isRequired, isPublished, courseIds } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.learningPath.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A learning path with this slug already exists" },
        { status: 400 }
      );
    }

    // Get max order
    const maxOrder = await prisma.learningPath.aggregate({
      _max: { order: true },
    });

    const path = await prisma.learningPath.create({
      data: {
        title,
        slug,
        description,
        targetRole,
        isRequired: isRequired || false,
        isPublished: isPublished || false,
        order: (maxOrder._max.order || 0) + 1,
        courses: courseIds?.length
          ? {
              create: courseIds.map((courseId: string, index: number) => ({
                courseId,
                order: index,
                isRequired: true,
              })),
            }
          : undefined,
      },
      include: {
        courses: {
          include: {
            course: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(path, { status: 201 });
  } catch (error) {
    console.error("Error creating learning path:", error);
    return NextResponse.json(
      { error: "Failed to create learning path" },
      { status: 500 }
    );
  }
}
