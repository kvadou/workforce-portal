import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const attemptSchema = z.object({
  puzzleId: z.string(),
  rating: z.number().int().min(0),
  solved: z.boolean(),
  usedHint: z.boolean().optional().default(false),
  moveCount: z.number().int().min(0),
  timeMs: z.number().int().min(0),
  // For streak tracking
  currentStreak: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = attemptSchema.parse(body);

    // Get user's onboarding progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      return NextResponse.json(
        { error: "Onboarding progress not found" },
        { status: 404 }
      );
    }

    // Record the attempt
    await prisma.onboardingPuzzleAttempt.create({
      data: {
        progressId: progress.id,
        puzzleId: data.puzzleId,
        rating: data.rating,
        solved: data.solved,
        usedHint: data.usedHint,
        moveCount: data.moveCount,
        timeMs: data.timeMs,
      },
    });

    // Calculate new stats
    const newAttempted = progress.puzzlesAttempted + 1;
    const newSolved = data.solved ? progress.puzzlesSolved + 1 : progress.puzzlesSolved;

    // Update streak - passed from client who tracks it
    const newBestStreak = data.currentStreak
      ? Math.max(progress.puzzleBestStreak, data.currentStreak)
      : progress.puzzleBestStreak;

    // Update rating if solved a harder puzzle
    const newRating = data.solved
      ? Math.max(progress.puzzleCurrentRating, data.rating)
      : progress.puzzleCurrentRating;

    // Update progress
    const updatedProgress = await prisma.onboardingProgress.update({
      where: { id: progress.id },
      data: {
        puzzlesAttempted: newAttempted,
        puzzlesSolved: newSolved,
        puzzleBestStreak: newBestStreak,
        puzzleCurrentRating: newRating,
      },
    });

    return NextResponse.json({
      totalSolved: updatedProgress.puzzlesSolved,
      totalAttempted: updatedProgress.puzzlesAttempted,
      bestStreak: updatedProgress.puzzleBestStreak,
      currentRating: updatedProgress.puzzleCurrentRating,
    });
  } catch (error) {
    console.error("Error recording puzzle attempt:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to record puzzle attempt" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
      select: {
        puzzlesSolved: true,
        puzzlesAttempted: true,
        puzzleBestStreak: true,
        puzzleCurrentRating: true,
      },
    });

    if (!progress) {
      return NextResponse.json({
        totalSolved: 0,
        totalAttempted: 0,
        bestStreak: 0,
        currentRating: 400,
      });
    }

    return NextResponse.json({
      totalSolved: progress.puzzlesSolved,
      totalAttempted: progress.puzzlesAttempted,
      bestStreak: progress.puzzleBestStreak,
      currentRating: progress.puzzleCurrentRating,
    });
  } catch (error) {
    console.error("Error fetching puzzle stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch puzzle stats" },
      { status: 500 }
    );
  }
}
