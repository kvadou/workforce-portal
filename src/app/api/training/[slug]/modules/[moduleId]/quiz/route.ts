import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleCourseCompletion, checkLearningPathCompletion } from "@/lib/course-completion";
import { awardPoints, POINTS_TRIGGERS } from "@/lib/points-engine";

interface RouteParams {
  params: Promise<{ slug: string; moduleId: string }>;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
}

/**
 * POST /api/training/[slug]/modules/[moduleId]/quiz
 * Submit quiz answers and calculate score
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, moduleId } = await params;
    const body = await req.json();
    const { answers } = body as { answers: Record<string, string> };

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Answers are required" },
        { status: 400 }
      );
    }

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

    // Get module with quiz questions
    const trainingModule = await prisma.trainingModule.findFirst({
      where: { id: moduleId, courseId: course.id },
    });

    if (!trainingModule) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    if (!trainingModule.hasQuiz || !trainingModule.quizQuestions) {
      return NextResponse.json(
        { error: "This module does not have a quiz" },
        { status: 400 }
      );
    }

    // Check quiz retake limits
    const existingProgress = await prisma.moduleProgress.findUnique({
      where: {
        enrollmentId_moduleId: {
          enrollmentId: enrollment.id,
          moduleId,
        },
      },
    });

    const maxRetakes = course.maxQuizRetakes ?? 3;
    const currentAttempts = existingProgress?.quizAttempts ?? 0;
    const alreadyPassed = existingProgress?.status === "COMPLETED";

    // Allow unlimited retakes if already passed (for practice), but don't count as new attempts
    if (!alreadyPassed && currentAttempts >= maxRetakes) {
      return NextResponse.json(
        {
          error: "Maximum quiz attempts reached",
          maxRetakes,
          attemptsUsed: currentAttempts,
          remainingAttempts: 0,
        },
        { status: 403 }
      );
    }

    const questions = trainingModule.quizQuestions as unknown as QuizQuestion[];
    const passingScore = trainingModule.passingScore || 80;

    // Calculate score
    let correctCount = 0;
    for (const question of questions) {
      if (answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    }
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= passingScore;

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
          status: "IN_PROGRESS",
        },
      });
    }
    const wasModuleCompleteBefore = progress.status === "COMPLETED";

    // Update progress with quiz results
    const updateData: Record<string, unknown> = {
      quizScore: score,
      quizAttempts: alreadyPassed ? progress.quizAttempts : progress.quizAttempts + 1,
    };

    if (passed) {
      updateData.status = "COMPLETED";
      updateData.completedAt = new Date();
    }

    progress = await prisma.moduleProgress.update({
      where: { id: progress.id },
      data: updateData,
    });

    // Award points if passed
    let pointsEarned = 0;
    if (passed && !wasModuleCompleteBefore) {
      // Get tutor profile for awarding points
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (tutorProfile) {
        // Award quiz passed points
        const quizResult = await awardPoints(
          tutorProfile.id,
          POINTS_TRIGGERS.QUIZ_PASSED,
          { reason: `Passed quiz: ${trainingModule.title}` }
        );
        pointsEarned += quizResult.points;

        // Award module completion points
        const moduleResult = await awardPoints(
          tutorProfile.id,
          POINTS_TRIGGERS.MODULE_COMPLETE,
          { reason: `Completed module: ${trainingModule.title}` }
        );
        pointsEarned += moduleResult.points;
      }
    }

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

      // Award course completion points
      const tutorProfileForCourse = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (tutorProfileForCourse) {
        const courseResult = await awardPoints(
          tutorProfileForCourse.id,
          POINTS_TRIGGERS.COURSE_COMPLETE,
          { reason: `Completed course: ${course.title}` }
        );
        pointsEarned += courseResult.points;
      }

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
      score,
      passed,
      correctCount,
      totalQuestions: questions.length,
      passingScore,
      quizAttempts: progress.quizAttempts,
      maxRetakes,
      remainingAttempts: alreadyPassed || passed ? null : Math.max(0, maxRetakes - progress.quizAttempts),
      pointsEarned,
      courseProgress,
      isCourseComplete,
      ...(completionResult && {
        certificationAwarded: completionResult.certificationAwarded,
        badgesAwarded: completionResult.badgesAwarded,
      }),
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
