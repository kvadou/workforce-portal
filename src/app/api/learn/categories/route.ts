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

    const categories = await prisma.chessLessonCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          include: {
            levels: { select: { id: true } },
            progress: {
              where: { userId: session.user.id },
              take: 1,
            },
          },
        },
      },
    });

    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
      order: cat.order,
      lessons: cat.lessons.map((lesson) => {
        const progress = lesson.progress[0];
        return {
          id: lesson.id,
          title: lesson.title,
          subtitle: lesson.subtitle,
          iconEmoji: lesson.iconEmoji,
          order: lesson.order,
          totalLevels: lesson.levels.length,
          completedLevels: progress?.completedLevels ?? 0,
          isComplete: progress?.isComplete ?? false,
        };
      }),
      totalLessons: cat.lessons.length,
      completedLessons: cat.lessons.filter((l) => l.progress[0]?.isComplete).length,
    }));

    return NextResponse.json({ categories: data });
  } catch (error) {
    console.error("Failed to fetch lesson categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
