import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chess/stats
 * Aggregate stats for the chess admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalPuzzles,
      activePuzzles,
      totalAttempts,
      avgRating,
      totalLessons,
      totalCategories,
    ] = await Promise.all([
      prisma.chessPuzzle.count(),
      prisma.chessPuzzle.count({ where: { isActive: true } }),
      prisma.puzzleAttempt.count(),
      prisma.chessPuzzle.aggregate({
        _avg: { rating: true },
        where: { isActive: true },
      }),
      prisma.chessLesson.count(),
      prisma.chessLessonCategory.count(),
    ]);

    return NextResponse.json({
      totalPuzzles,
      activePuzzles,
      totalAttempts,
      avgRating: Math.round(avgRating._avg.rating ?? 0),
      totalLessons,
      totalCategories,
    });
  } catch (error) {
    console.error("Error fetching chess stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chess stats" },
      { status: 500 }
    );
  }
}
