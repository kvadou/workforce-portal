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

    const [totalLessons, totalLevels, userProgress] = await Promise.all([
      prisma.chessLesson.count(),
      prisma.chessLessonLevel.count(),
      prisma.chessLessonProgress.findMany({
        where: { userId: session.user.id },
      }),
    ]);

    const completedLessons = userProgress.filter((p) => p.isComplete).length;
    const completedLevels = userProgress.reduce(
      (sum, p) => sum + p.completedLevels,
      0
    );
    const percentage =
      totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

    return NextResponse.json({
      totalLessons,
      completedLessons,
      totalLevels,
      completedLevels,
      percentage,
    });
  } catch (error) {
    console.error("Failed to fetch learn progress:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
