import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/puzzles - Get puzzles with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const theme = searchParams.get("theme");
    const ratingMin = searchParams.get("ratingMin")
      ? parseInt(searchParams.get("ratingMin")!)
      : undefined;
    const ratingMax = searchParams.get("ratingMax")
      ? parseInt(searchParams.get("ratingMax")!)
      : undefined;
    const unsolvedOnly = searchParams.get("unsolvedOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };

    if (theme) {
      where.themes = { has: theme };
    }
    if (ratingMin !== undefined || ratingMax !== undefined) {
      where.rating = {
        ...(ratingMin !== undefined ? { gte: ratingMin } : {}),
        ...(ratingMax !== undefined ? { lte: ratingMax } : {}),
      };
    }

    // If unsolvedOnly, exclude puzzles the user has solved
    if (unsolvedOnly) {
      const solvedPuzzleIds = await prisma.puzzleAttempt.findMany({
        where: { userId, solved: true },
        select: { puzzleId: true },
        distinct: ["puzzleId"],
      });
      where.id = { notIn: solvedPuzzleIds.map((a) => a.puzzleId) };
    }

    // Fetch puzzles and total count in parallel
    const [puzzles, total] = await Promise.all([
      prisma.chessPuzzle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: "asc" },
        include: {
          attempts: {
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.chessPuzzle.count({ where }),
    ]);

    // Transform to include user attempt summary
    const data = puzzles.map((puzzle) => {
      const lastAttempt = puzzle.attempts[0] || null;
      return {
        id: puzzle.id,
        lichessId: puzzle.lichessId,
        fen: puzzle.fen,
        moves: puzzle.moves,
        rating: puzzle.rating,
        themes: puzzle.themes,
        openingTags: puzzle.openingTags,
        popularity: puzzle.popularity,
        lastAttempt: lastAttempt
          ? {
              solved: lastAttempt.solved,
              usedHint: lastAttempt.usedHint,
              timeSpentMs: lastAttempt.timeSpentMs,
              createdAt: lastAttempt.createdAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      puzzles: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch puzzles:", error);
    return NextResponse.json(
      { error: "Failed to fetch puzzles" },
      { status: 500 }
    );
  }
}
