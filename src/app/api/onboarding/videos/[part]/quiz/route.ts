import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PASSING_SCORE = 80;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ part: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { part } = await params;
    const videoPart = parseInt(part, 10);
    if (isNaN(videoPart) || videoPart < 1 || videoPart > 6) {
      return NextResponse.json({ error: "Invalid video part" }, { status: 400 });
    }

    const { answers } = await req.json();
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      return NextResponse.json({ error: "No onboarding progress found" }, { status: 404 });
    }

    // Check video is completed first
    const videoProgress = await prisma.onboardingVideoProgress.findUnique({
      where: { progressId_videoPart: { progressId: progress.id, videoPart } },
    });

    if (!videoProgress?.videoCompletedAt) {
      return NextResponse.json({ error: "Complete the video before taking the quiz" }, { status: 400 });
    }

    // Get questions for this video part
    const questions = await prisma.onboardingQuizQuestion.findMany({
      where: { isActive: true, videoPart },
      orderBy: { order: "asc" },
    });

    if (questions.length === 0) {
      // No questions configured for this part — auto-pass
      await prisma.onboardingVideoProgress.update({
        where: { progressId_videoPart: { progressId: progress.id, videoPart } },
        data: {
          quizPassedAt: new Date(),
          quizScore: 100,
          quizAttempts: { increment: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        score: 100,
        passed: true,
        message: "No quiz questions configured — auto-passed",
      });
    }

    // Calculate score
    let correctCount = 0;
    for (const question of questions) {
      if (answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);

    // Get passing score from config or use default
    const passingScoreConfig = await prisma.onboardingConfig.findUnique({
      where: { key: `quiz_passing_score_part_${videoPart}` },
    });
    const passingScore = passingScoreConfig ? parseInt(passingScoreConfig.value, 10) : DEFAULT_PASSING_SCORE;
    const passed = score >= passingScore;

    // Update video progress with quiz results
    const updateData: {
      quizScore: number;
      quizAttempts: { increment: number };
      quizAnswers: Record<string, string>;
      quizPassedAt?: Date;
    } = {
      quizScore: score,
      quizAttempts: { increment: 1 },
      quizAnswers: answers,
    };

    if (passed && !videoProgress.quizPassedAt) {
      updateData.quizPassedAt = new Date();
    }

    await prisma.onboardingVideoProgress.update({
      where: { progressId_videoPart: { progressId: progress.id, videoPart } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      score,
      passed,
      correctCount,
      totalQuestions: questions.length,
      passingScore,
    });
  } catch (error) {
    console.error("Error submitting video quiz:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}

// GET — return questions for this video part (without answers)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ part: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { part } = await params;
    const videoPart = parseInt(part, 10);
    if (isNaN(videoPart) || videoPart < 1 || videoPart > 6) {
      return NextResponse.json({ error: "Invalid video part" }, { status: 400 });
    }

    const questions = await prisma.onboardingQuizQuestion.findMany({
      where: { isActive: true, videoPart },
      orderBy: { order: "asc" },
      select: {
        id: true,
        question: true,
        type: true,
        options: true,
        order: true,
        // Do NOT select correctAnswer or explanation
      },
    });

    return NextResponse.json({ questions, videoPart });
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
