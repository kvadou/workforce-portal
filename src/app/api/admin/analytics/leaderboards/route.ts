import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/admin/analytics/leaderboards
 * Get tutor leaderboards for various metrics
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const [
      // Top by total lessons
      topByLessons,
      // Top by rating
      topByRating,
      // Top badge earners
      topBadgeEarners,
      // Top by streak
      topStreaks,
      // Most training completions
      topTrainingCompletions,
    ] = await Promise.all([
      // Top by lessons
      prisma.tutorProfile.findMany({
        where: { status: "ACTIVE" },
        orderBy: { totalLessons: "desc" },
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),

      // Top by rating
      prisma.tutorProfile.findMany({
        where: { status: "ACTIVE", averageRating: { not: null } },
        orderBy: { averageRating: "desc" },
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      }),

      // Top badge earners
      prisma.userBadge.groupBy({
        by: ["userId"],
        _count: true,
        orderBy: { _count: { userId: "desc" } },
        take: limit,
      }),

      // Top streaks
      prisma.tutorStreak.findMany({
        where: { type: "LESSONS_DAILY" },
        orderBy: { currentStreak: "desc" },
        take: limit,
        include: {
          tutorProfile: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      }),

      // Most training completions
      prisma.courseEnrollment.groupBy({
        by: ["userId"],
        where: { status: "COMPLETED" },
        _count: true,
        orderBy: { _count: { userId: "desc" } },
        take: limit,
      }),
    ]);

    // Get user details for badge and training leaderboards
    const badgeUserIds = topBadgeEarners.map((e) => e.userId);
    const trainingUserIds = topTrainingCompletions.map((e) => e.userId);
    const allUserIds = [...new Set([...badgeUserIds, ...trainingUserIds])];

    const users = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return NextResponse.json({
      topByLessons: topByLessons.map((t, i) => ({
        rank: i + 1,
        tutorId: t.id,
        userId: t.userId,
        name: t.user.name || t.user.email,
        avatarUrl: t.user.avatarUrl,
        totalLessons: t.totalLessons,
        team: t.team,
      })),
      topByRating: topByRating.map((t, i) => ({
        rank: i + 1,
        tutorId: t.id,
        userId: t.userId,
        name: t.user.name || t.user.email,
        avatarUrl: t.user.avatarUrl,
        averageRating: t.averageRating?.toFixed(2),
        totalLessons: t.totalLessons,
      })),
      topBadgeEarners: topBadgeEarners.map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        name: userMap.get(e.userId)?.name || userMap.get(e.userId)?.email || "Unknown",
        avatarUrl: userMap.get(e.userId)?.avatarUrl,
        badgeCount: e._count,
      })),
      topStreaks: topStreaks.map((s, i) => ({
        rank: i + 1,
        tutorId: s.tutorProfileId,
        userId: s.tutorProfile.userId,
        name: s.tutorProfile.user.name || s.tutorProfile.user.email,
        avatarUrl: s.tutorProfile.user.avatarUrl,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
      })),
      topTrainingCompletions: topTrainingCompletions.map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        name: userMap.get(e.userId)?.name || userMap.get(e.userId)?.email || "Unknown",
        avatarUrl: userMap.get(e.userId)?.avatarUrl,
        completedCourses: e._count,
      })),
    });
  } catch (error) {
    console.error("Error fetching leaderboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboards" },
      { status: 500 }
    );
  }
}
