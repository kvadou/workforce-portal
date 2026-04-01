import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  onQuizPass,
  updateOnboardingGoalProgress,
  calculateCompletedSteps,
} from "@/lib/onboarding-gamification";

const PASSING_SCORE = 80;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { answers, progressId } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    // Get current progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { id: progressId },
    });

    if (!progress || progress.userId !== session.user.id) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 });
    }

    // Get all questions
    const questions = await prisma.onboardingQuizQuestion.findMany({
      where: { isActive: true },
    });

    // Calculate score
    let correctCount = 0;
    for (const question of questions) {
      if (answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= PASSING_SCORE;
    const newAttempts = progress.quizAttempts + 1;

    // Update progress
    const updateData: {
      quizScore: number;
      quizAttempts: number;
      quizLastAttemptAt: Date;
      quizAnswers: Record<string, string>;
      quizPassedAt?: Date;
      status?: "PROFILE_PENDING" | "QUIZ_FAILED";
    } = {
      quizScore: score,
      quizAttempts: newAttempts,
      quizLastAttemptAt: new Date(),
      quizAnswers: answers,
    };

    if (passed && !progress.quizPassedAt) {
      updateData.quizPassedAt = new Date();
      updateData.status = "PROFILE_PENDING";
    } else if (!passed) {
      updateData.status = "QUIZ_FAILED";
    }

    const updatedProgress = await prisma.onboardingProgress.update({
      where: { id: progressId },
      data: updateData,
    });

    // Award points and badges when quiz is passed for the first time
    if (passed && !progress.quizPassedAt) {
      await onQuizPass(session.user.id, progressId, score, newAttempts);

      // Update onboarding goal progress
      const stepsCompleted = calculateCompletedSteps(updatedProgress);
      await updateOnboardingGoalProgress(session.user.id, stepsCompleted);
    }

    return NextResponse.json({
      success: true,
      score,
      passed,
      attempts: newAttempts,
      correctCount,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
