import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onPuzzleSolved } from "@/lib/chess-gamification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { solved, usedHint, moveCount, timeMs } = body;

    // Verify puzzle exists
    const puzzle = await prisma.chessPuzzle.findUnique({
      where: { id },
      select: { id: true, rating: true },
    });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    // Create attempt record
    const attempt = await prisma.puzzleAttempt.create({
      data: {
        userId: session.user.id,
        puzzleId: id,
        solved: !!solved,
        usedHint: !!usedHint,
        moveCount: moveCount || 0,
        timeSpentMs: timeMs || 0,
      },
    });

    // Run gamification (points, badges, streaks, rating update)
    await onPuzzleSolved(
      session.user.id,
      id,
      puzzle.rating,
      !!solved,
      timeMs || 0,
      !!usedHint
    );

    return NextResponse.json({
      attemptId: attempt.id,
      solved: attempt.solved,
    });
  } catch (error) {
    console.error("Failed to submit puzzle attempt:", error);
    return NextResponse.json({ error: "Failed to submit attempt" }, { status: 500 });
  }
}
