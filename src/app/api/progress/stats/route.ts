import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// GET /api/progress/stats - Get progress statistics for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const curriculumId = searchParams.get("curriculumId") || searchParams.get("courseId"); // Support both for backward compat

    // Default to session user; only ADMIN can view other users' stats
    const userId = requestedUserId || session.user.id;
    if (requestedUserId && requestedUserId !== session.user.id) {
      if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get total lessons count (optionally filtered by curriculum)
    const lessonWhere = curriculumId
      ? { module: { curriculumId }, status: "PUBLISHED" as const }
      : { status: "PUBLISHED" as const };

    const totalLessons = await prisma.lesson.count({
      where: lessonWhere,
    });

    // Get user's progress
    const progressWhere = curriculumId
      ? { userId, lesson: { module: { curriculumId } } }
      : { userId };

    const [completedCount, inProgressCount, totalTimeSpent] = await Promise.all([
      prisma.lessonProgress.count({
        where: { ...progressWhere, status: "COMPLETED" },
      }),
      prisma.lessonProgress.count({
        where: { ...progressWhere, status: "IN_PROGRESS" },
      }),
      prisma.lessonProgress.aggregate({
        where: progressWhere,
        _sum: { timeSpent: true },
      }),
    ]);

    // Get recent activity
    const recentActivity = await prisma.lessonProgress.findMany({
      where: progressWhere,
      orderBy: { lastViewedAt: "desc" },
      take: 5,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            number: true,
            module: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Calculate streak (consecutive days with activity)
    const activityDates = await prisma.lessonProgress.findMany({
      where: { userId },
      select: { lastViewedAt: true },
      orderBy: { lastViewedAt: "desc" },
    });

    let streak = 0;
    if (activityDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let checkDate = new Date(today);

      for (const activity of activityDates) {
        const activityDate = new Date(activity.lastViewedAt);
        activityDate.setHours(0, 0, 0, 0);

        if (activityDate.getTime() === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (activityDate.getTime() < checkDate.getTime()) {
          break;
        }
      }
    }

    const stats = {
      totalLessons,
      completedLessons: completedCount,
      inProgressLessons: inProgressCount,
      notStartedLessons: totalLessons - completedCount - inProgressCount,
      completionPercentage: totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0,
      totalTimeSpent: totalTimeSpent._sum.timeSpent || 0,
      streak,
      recentActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch progress stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress stats" },
      { status: 500 }
    );
  }
}
