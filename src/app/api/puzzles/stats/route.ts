import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let stats = await prisma.userPuzzleStats.findUnique({
      where: { userId: session.user.id },
    });

    // Create default stats if none exist
    if (!stats) {
      stats = await prisma.userPuzzleStats.create({
        data: { userId: session.user.id, puzzleRating: 1200 },
      });
    }

    return NextResponse.json({
      puzzleRating: stats.puzzleRating,
      puzzlesSolved: stats.puzzlesSolved,
      puzzlesFailed: stats.puzzlesFailed,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      totalTimeMs: stats.totalTimeMs,
      hintsUsed: stats.hintsUsed,
      themeProgress: stats.themeProgress,
      lastPuzzleAt: stats.lastPuzzleAt,
    });
  } catch (error) {
    console.error("Failed to fetch puzzle stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
