import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, Prisma } from "@prisma/client";
import {
  onTrainingSessionComplete,
  onShadowLessonComplete,
  onOnboardingComplete,
  updateOnboardingGoalProgress,
  calculateCompletedSteps,
} from "@/lib/onboarding-gamification";

interface TrainingSession {
  sessionNumber: number;
  completedAt: string;
  notes?: string;
}

interface ShadowLesson {
  lessonNumber: number;
  completedAt: string;
  verifiedBy?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { progressId, userId, action, ...data } = body;

    // Get current progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id: progressId },
    });

    if (!progress) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    switch (action) {
      case "markOrientationAttended": {
        await prisma.onboardingProgress.update({
          where: { id: progressId },
          data: {
            orientationAttendedAt: new Date(),
            status: "POST_ORIENTATION_TRAINING",
          },
        });
        break;
      }

      case "completeTraining": {
        const { sessionNumber } = data;
        const currentSessions = (progress.trainingSessions as unknown) as TrainingSession[];

        // Check if already complete
        if (currentSessions.some((s) => s.sessionNumber === sessionNumber)) {
          return NextResponse.json(
            { error: "Session already completed" },
            { status: 400 }
          );
        }

        const newSessions: TrainingSession[] = [
          ...currentSessions,
          {
            sessionNumber,
            completedAt: new Date().toISOString(),
          },
        ];

        const allTrainingComplete = newSessions.length >= 3;
        const totalTrainingSessions = 3;

        const updatedProgress = await prisma.onboardingProgress.update({
          where: { id: progressId },
          data: {
            trainingSessions: newSessions as unknown as Prisma.InputJsonValue,
            trainingCompletedAt: allTrainingComplete ? new Date() : undefined,
            status: allTrainingComplete ? "SHADOW_LESSONS" : undefined,
          },
        });

        // Award points for training session
        await onTrainingSessionComplete(
          progress.userId,
          sessionNumber,
          totalTrainingSessions
        );

        // Update onboarding goal if all training complete
        if (allTrainingComplete) {
          const stepsCompleted = calculateCompletedSteps(updatedProgress);
          await updateOnboardingGoalProgress(progress.userId, stepsCompleted);
        }
        break;
      }

      case "completeShadow": {
        const { lessonNumber } = data;
        const currentLessons = (progress.shadowLessons as unknown) as ShadowLesson[];

        // Check if already complete
        if (currentLessons.some((s) => s.lessonNumber === lessonNumber)) {
          return NextResponse.json(
            { error: "Lesson already verified" },
            { status: 400 }
          );
        }

        const newLessons: ShadowLesson[] = [
          ...currentLessons,
          {
            lessonNumber,
            completedAt: new Date().toISOString(),
            verifiedBy: session.user.id,
          },
        ];

        const allShadowComplete = newLessons.length >= 3;
        const totalShadowLessons = 3;

        const updatedShadowProgress = await prisma.onboardingProgress.update({
          where: { id: progressId },
          data: {
            shadowLessons: newLessons as unknown as Prisma.InputJsonValue,
            shadowCompletedAt: allShadowComplete ? new Date() : undefined,
            status: allShadowComplete ? "COMPLETED" : undefined,
          },
        });

        // Award points for shadow lesson
        await onShadowLessonComplete(
          progress.userId,
          lessonNumber,
          totalShadowLessons
        );

        // If all shadow lessons complete, trigger onboarding complete
        if (allShadowComplete) {
          await onOnboardingComplete(progress.userId, progressId);

          const stepsCompleted = calculateCompletedSteps(updatedShadowProgress);
          await updateOnboardingGoalProgress(progress.userId, stepsCompleted);
        }
        break;
      }

      case "activate": {
        // Update user role to TUTOR
        await prisma.user.update({
          where: { id: userId },
          data: {
            role: "TUTOR",
            isOnboarding: false,
          },
        });

        // Update progress
        await prisma.onboardingProgress.update({
          where: { id: progressId },
          data: {
            status: "ACTIVATED",
            activatedAt: new Date(),
            activatedBy: session.user.id,
          },
        });
        break;
      }

      case "return": {
        const { returnReason } = data;
        await prisma.onboardingProgress.update({
          where: { id: progressId },
          data: {
            status: "RETURNED",
            returnedAt: new Date(),
            returnReason,
          },
        });
        break;
      }

      case "updateNotes": {
        const { adminNotes } = data;
        await prisma.onboardingProgress.update({
          where: { id: progressId },
          data: { adminNotes },
        });
        break;
      }

      case "resetWelcome": {
        // Reset the user to the welcome video state
        await prisma.onboardingProgress.update({
          where: { id: progressId },
          data: {
            status: "WELCOME",
            welcomeCompletedAt: null,
          },
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error performing admin action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
