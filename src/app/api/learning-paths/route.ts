import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/learning-paths
 * Get published learning paths with user's progress
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const paths = await prisma.learningPath.findMany({
      where: {
        isPublished: true,
        OR: [
          { targetRole: null }, // Available to all
          { targetRole: userRole as never }, // Targeted to user's role
        ],
      },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                thumbnailUrl: true,
                duration: true,
                difficulty: true,
                isPublished: true,
                grantsCertification: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [{ isRequired: "desc" }, { order: "asc" }],
    });

    // Get user's enrollments for these courses
    const courseIds = paths.flatMap((p) => p.courses.map((c) => c.courseId));
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId,
        courseId: { in: courseIds },
      },
      select: {
        courseId: true,
        status: true,
        progress: true,
        completedAt: true,
      },
    });

    const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]));

    // Calculate progress for each path
    const pathsWithProgress = paths.map((path) => {
      const courses = path.courses.map((pc) => ({
        ...pc,
        enrollment: enrollmentMap.get(pc.courseId) || null,
      }));

      const requiredCourses = courses.filter((c) => c.isRequired);
      const completedRequired = requiredCourses.filter(
        (c) => c.enrollment?.status === "COMPLETED"
      ).length;

      const totalCourses = courses.length;
      const completedCourses = courses.filter(
        (c) => c.enrollment?.status === "COMPLETED"
      ).length;

      return {
        ...path,
        courses,
        progress: {
          totalCourses,
          completedCourses,
          requiredCourses: requiredCourses.length,
          completedRequired,
          percentComplete: totalCourses > 0
            ? Math.round((completedCourses / totalCourses) * 100)
            : 0,
          isComplete: completedRequired >= requiredCourses.length && requiredCourses.length > 0,
        },
      };
    });

    return NextResponse.json(pathsWithProgress);
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning paths" },
      { status: 500 }
    );
  }
}
