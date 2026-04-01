import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

/**
 * GET /api/internal/chess/puzzles
 * Get chess puzzles for ATS candidate widget
 * Query params:
 *   - difficulty: "beginner" | "intermediate" | "advanced"
 *   - limit: number (default 5, max 20)
 */
export async function GET(req: NextRequest) {
  const auth = verifyInternalApiRequest(req);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty") || "beginner";
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 20);

    // Map difficulty to rating ranges
    const ratingRanges: Record<string, { min: number; max: number }> = {
      beginner: { min: 400, max: 900 },
      intermediate: { min: 900, max: 1400 },
      advanced: { min: 1400, max: 2200 },
    };

    const range = ratingRanges[difficulty] || ratingRanges.beginner;

    const puzzles = await prisma.chessPuzzle.findMany({
      where: {
        isActive: true,
        rating: { gte: range.min, lte: range.max },
      },
      select: {
        id: true,
        lichessId: true,
        fen: true,
        moves: true,
        rating: true,
        themes: true,
      },
      orderBy: { popularity: "desc" },
      take: limit,
    });

    return NextResponse.json({ puzzles });
  } catch (error) {
    console.error("Failed to fetch internal chess puzzles:", error);
    return NextResponse.json(
      { error: "Failed to fetch puzzles" },
      { status: 500 }
    );
  }
}
