import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/training/[slug]
 * Get course details with user's progress
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const course = await prisma.trainingCourse.findFirst({
      where: { slug, isPublished: true },
      include: {
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            contentType: true,
            videoUrl: true,
            hasQuiz: true,
            // Don't include full content/quiz in list view
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get user's enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
      include: {
        moduleProgress: true,
      },
    });

    // Create progress map
    const progressMap = new Map(
      enrollment?.moduleProgress.map((p) => [p.moduleId, p]) ?? []
    );

    // Merge module progress
    const modulesWithProgress = course.modules.map((module) => {
      const progress = progressMap.get(module.id);
      return {
        ...module,
        progress: progress
          ? {
              status: progress.status,
              videoProgress: progress.videoProgress,
              quizScore: progress.quizScore,
              completedAt: progress.completedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      ...course,
      modules: modulesWithProgress,
      enrollment: enrollment
        ? {
            status: enrollment.status,
            progress: enrollment.progress,
            startedAt: enrollment.startedAt,
            completedAt: enrollment.completedAt,
          }
        : null,
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
 * POST /api/training/[slug]
 * Enroll in a course
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const course = await prisma.trainingCourse.findFirst({
      where: { slug, isPublished: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already enrolled in this course" },
        { status: 409 }
      );
    }

    // Check prerequisites
    if (course.prerequisites.length > 0) {
      const completedPrereqs = await prisma.courseEnrollment.findMany({
        where: {
          userId: session.user.id,
          status: "COMPLETED",
          course: {
            slug: { in: course.prerequisites },
          },
        },
        select: { course: { select: { slug: true } } },
      });

      const completedSlugs = completedPrereqs.map((e) => e.course.slug);
      const missingSlugs = course.prerequisites.filter(
        (prereq) => !completedSlugs.includes(prereq)
      );

      if (missingSlugs.length > 0) {
        return NextResponse.json(
          {
            error: "Prerequisites not met",
            missingPrerequisites: missingSlugs,
          },
          { status: 400 }
        );
      }
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
        status: "NOT_STARTED",
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}
