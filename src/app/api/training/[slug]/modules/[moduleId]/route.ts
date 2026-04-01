import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleCourseCompletion, checkLearningPathCompletion } from "@/lib/course-completion";

interface RouteParams {
  params: Promise<{ slug: string; moduleId: string }>;
}

/**
 * GET /api/training/[slug]/modules/[moduleId]
 * Get full module content (for enrolled users)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, moduleId } = await params;

    // Get course and verify enrollment
    const course = await prisma.trainingCourse.findFirst({
      where: { slug, isPublished: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }
    // Get module with full content
    const trainingModule = await prisma.trainingModule.findFirst({
      where: { id: moduleId, courseId: course.id },
    });

    if (!trainingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get user's progress for this module
    const progress = await prisma.moduleProgress.findUnique({
      where: {
        enrollmentId_moduleId: {
          enrollmentId: enrollment.id,
          moduleId,
        },
      },
    });

    // Update enrollment to IN_PROGRESS if this is first module access
    if (enrollment.status === "NOT_STARTED") {
      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }

    // Create progress record if doesn't exist
    if (!progress) {
      await prisma.moduleProgress.create({
        data: {
          enrollmentId: enrollment.id,
          moduleId,
          status: "NOT_STARTED",
        },
      });
    }

    return NextResponse.json({
      ...trainingModule,
      progress: progress
        ? {
            status: progress.status,
            videoProgress: progress.videoProgress,
            videoDuration: progress.videoDuration,
            lastVideoPosition: progress.lastVideoPosition,
            quizScore: progress.quizScore,
            quizAttempts: progress.quizAttempts,
            notes: progress.notes,
            completedAt: progress.completedAt,
          }
        : {
            status: "NOT_STARTED",
            videoProgress: 0,
            videoDuration: null,
            lastVideoPosition: 0,
            quizScore: null,
            quizAttempts: 0,
            notes: null,
            completedAt: null,
          },
    });
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/training/[slug]/modules/[moduleId]
 * Update module progress
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, moduleId } = await params;
    const body = await req.json();
    const { videoProgress, videoDuration, lastVideoPosition, quizScore, notes, markComplete } = body;

    // Get course and verify enrollment
    const course = await prisma.trainingCourse.findFirst({
      where: { slug, isPublished: true },
      include: {
        modules: {
          orderBy: { order: "asc" },
          select: { id: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }
    const wasCourseCompleteBefore = enrollment.status === "COMPLETED";

    // Get module
    const targetModule = await prisma.trainingModule.findFirst({
      where: { id: moduleId, courseId: course.id },
    });

    if (!targetModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get or create progress
    let progress = await prisma.moduleProgress.findUnique({
      where: {
        enrollmentId_moduleId: {
          enrollmentId: enrollment.id,
          moduleId,
        },
      },
    });

    if (!progress) {
      progress = await prisma.moduleProgress.create({
        data: {
          enrollmentId: enrollment.id,
          moduleId,
          status: "NOT_STARTED",
        },
      });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (videoProgress !== undefined) {
      updateData.videoProgress = videoProgress;
      if (progress.status === "NOT_STARTED") {
        updateData.status = "IN_PROGRESS";
      }
    }

    if (videoDuration !== undefined) {
      updateData.videoDuration = videoDuration;
    }

    if (lastVideoPosition !== undefined) {
      updateData.lastVideoPosition = lastVideoPosition;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (quizScore !== undefined) {
      updateData.quizScore = quizScore;
      updateData.quizAttempts = progress.quizAttempts + 1;

      // Check if quiz passed
      if (targetModule.hasQuiz && quizScore >= (targetModule.passingScore || 80)) {
        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
      }
    }

    if (markComplete && !targetModule.hasQuiz) {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();
    }

    // Update progress
    progress = await prisma.moduleProgress.update({
      where: { id: progress.id },
      data: updateData,
    });

    // Recalculate course progress
    const allProgress = await prisma.moduleProgress.findMany({
      where: { enrollmentId: enrollment.id },
    });

    const totalModules = course.modules.length;
    const completedModules = allProgress.filter(
      (p) => p.status === "COMPLETED"
    ).length;
    const courseProgress = Math.round((completedModules / totalModules) * 100);

    // Check if course is complete
    const isCourseComplete = completedModules === totalModules;

    await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: courseProgress,
        status: isCourseComplete ? "COMPLETED" : "IN_PROGRESS",
        completedAt: isCourseComplete ? new Date() : null,
      },
    });

    // Handle course completion (certifications, badges, learning paths)
    let completionResult = null;
    if (isCourseComplete && !wasCourseCompleteBefore) {
      completionResult = await handleCourseCompletion(session.user.id, course.id);

      // Check all learning paths this course is part of
      const pathsWithCourse = await prisma.learningPathCourse.findMany({
        where: { courseId: course.id },
        select: { learningPathId: true },
      });

      for (const pc of pathsWithCourse) {
        await checkLearningPathCompletion(session.user.id, pc.learningPathId);
      }
    }

    return NextResponse.json({
      moduleProgress: progress,
      courseProgress,
      isCourseComplete,
      ...(completionResult && {
        certificationAwarded: completionResult.certificationAwarded,
        badgesAwarded: completionResult.badgesAwarded,
      }),
    });
  } catch (error) {
    console.error("Error updating module progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
