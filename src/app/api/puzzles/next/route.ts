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

    // Get user's current rating
    const stats = await prisma.userPuzzleStats.findUnique({
      where: { userId: session.user.id },
    });
    const userRating = stats?.puzzleRating ?? 1200;

    // Get IDs of puzzles already solved
    const solvedIds = await prisma.puzzleAttempt.findMany({
      where: { userId: session.user.id, solved: true },
      select: { puzzleId: true },
      distinct: ["puzzleId"],
    });
    const solvedSet = new Set(solvedIds.map((a) => a.puzzleId));

    // Find an unsolved puzzle within +/- 200 rating
    const puzzle = await prisma.chessPuzzle.findFirst({
      where: {
        isActive: true,
        rating: { gte: userRating - 200, lte: userRating + 200 },
        id: { notIn: [...solvedSet] },
      },
      orderBy: { popularity: "desc" },
    });

    // Fallback: widen range if nothing found
    if (!puzzle) {
      const fallback = await prisma.chessPuzzle.findFirst({
        where: {
          isActive: true,
          id: { notIn: [...solvedSet] },
        },
        orderBy: { rating: "asc" },
      });

      return NextResponse.json({ puzzle: fallback });
    }

    return NextResponse.json({ puzzle });
  } catch (error) {
    console.error("Failed to fetch next puzzle:", error);
    return NextResponse.json({ error: "Failed to fetch next puzzle" }, { status: 500 });
  }
}
