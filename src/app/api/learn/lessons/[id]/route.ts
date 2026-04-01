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

    const lesson = await prisma.chessLesson.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        levels: { orderBy: { order: "asc" } },
        progress: {
          where: { userId: session.user.id },
          take: 1,
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const progress = lesson.progress[0];

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      subtitle: lesson.subtitle,
      iconEmoji: lesson.iconEmoji,
      category: lesson.category,
      levels: lesson.levels.map((lvl) => ({
        id: lvl.id,
        order: lvl.order,
        fen: lvl.fen,
        goal: lvl.goal,
        goalType: lvl.goalType,
        targetSquares: lvl.targetSquares,
        playerColor: lvl.playerColor,
        hintText: lvl.hintText,
      })),
      progress: {
        completedLevels: progress?.completedLevels ?? 0,
        totalLevels: lesson.levels.length,
        isComplete: progress?.isComplete ?? false,
      },
    });
  } catch (error) {
    console.error("Failed to fetch lesson:", error);
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
  }
}
