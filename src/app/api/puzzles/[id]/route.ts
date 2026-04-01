import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const puzzle = await prisma.chessPuzzle.findUnique({
      where: { id },
      include: {
        attempts: {
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!puzzle) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: puzzle.id,
      lichessId: puzzle.lichessId,
      fen: puzzle.fen,
      moves: puzzle.moves,
      rating: puzzle.rating,
      themes: puzzle.themes,
      openingTags: puzzle.openingTags,
      popularity: puzzle.popularity,
      attempts: puzzle.attempts.map((a) => ({
        solved: a.solved,
        usedHint: a.usedHint,
        moveCount: a.moveCount,
        timeSpentMs: a.timeSpentMs,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch puzzle:", error);
    return NextResponse.json({ error: "Failed to fetch puzzle" }, { status: 500 });
  }
}
