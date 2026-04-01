import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDailyPuzzle } from "@/lib/chess-gamification";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const puzzle = await getDailyPuzzle();
    if (!puzzle) {
      return NextResponse.json({ puzzle: null, alreadySolved: false });
    }

    // Check if user already solved today's puzzle
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttempt = await prisma.puzzleAttempt.findFirst({
      where: {
        userId: session.user.id,
        puzzleId: puzzle.id,
        solved: true,
        createdAt: { gte: today },
      },
    });

    return NextResponse.json({
      puzzle: {
        id: puzzle.id,
        fen: puzzle.fen,
        moves: puzzle.moves,
        rating: puzzle.rating,
        themes: puzzle.themes,
      },
      alreadySolved: !!todayAttempt,
    });
  } catch (error) {
    console.error("Failed to fetch daily puzzle:", error);
    return NextResponse.json({ error: "Failed to fetch daily puzzle" }, { status: 500 });
  }
}
