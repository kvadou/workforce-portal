import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/admin/analytics
 * Get comprehensive analytics data for the admin dashboard
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

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [
      // User counts
      totalUsers,
      activeUsers,
      onboardingUsers,

      // Tutor stats
      tutorStats,
      tutorsByStatus,
      tutorsByTeam,

      // Badge stats
      totalBadgesEarned,
      recentBadges,
      topBadgeEarners,

      // Training stats
      totalCourses,
      totalEnrollments,
      courseCompletions,
      recentEnrollments,

      // Onboarding stats
      onboardingProgress,

      // Recent activity
      recentNotes,
      recentAuditLogs,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      prisma.user.count({
        where: { role: { in: ["TUTOR", "LEAD_TUTOR"] } },
      }),
      prisma.user.count({
        where: { role: "ONBOARDING_TUTOR" },
      }),

      // Tutor stats
      prisma.tutorProfile.aggregate({
        _avg: { averageRating: true, totalLessons: true },
        _sum: { totalLessons: true },
        _count: true,
      }),
      prisma.tutorProfile.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.tutorProfile.groupBy({
        by: ["team"],
        _count: true,
        where: { team: { not: null } },
      }),

      // Badge stats
      prisma.userBadge.count(),
      prisma.userBadge.findMany({
        take: 10,
        orderBy: { earnedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          badge: { select: { id: true, title: true, icon: true } },
        },
      }),
      prisma.userBadge.groupBy({
        by: ["userId"],
        _count: true,
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),

      // Training stats
      prisma.trainingCourse.count({ where: { isPublished: true } }),
      prisma.courseEnrollment.count(),
      prisma.courseEnrollment.count({ where: { status: "COMPLETED" } }),
      prisma.courseEnrollment.findMany({
        where: { createdAt: { gte: oneWeekAgo } },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      }),

      // Onboarding stats
      prisma.onboardingProgress.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Recent activity
      prisma.tutorNote.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          tutorProfile: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.tutorAuditLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          tutorProfile: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      }),
    ]);

    // Get user details for top badge earners
    const topEarnerIds = topBadgeEarners.map((e) => e.userId);
    const topEarnerUsers = await prisma.user.findMany({
      where: { id: { in: topEarnerIds } },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    const userMap = new Map(topEarnerUsers.map((u) => [u.id, u]));

    // Calculate week-over-week changes
    const lastWeekBadges = await prisma.userBadge.count({
      where: { earnedAt: { gte: oneWeekAgo } },
    });
    const lastMonthEnrollments = await prisma.courseEnrollment.count({
      where: { createdAt: { gte: oneMonthAgo } },
    });

    // Format response
    return NextResponse.json({
      overview: {
        totalUsers,
        activeTutors: activeUsers,
        onboardingTutors: onboardingUsers,
        totalLessons: tutorStats._sum.totalLessons || 0,
        averageRating: tutorStats._avg.averageRating?.toFixed(2) || "N/A",
      },
      tutors: {
        total: tutorStats._count,
        byStatus: tutorsByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        byTeam: tutorsByTeam.map((t) => ({
          team: t.team,
          count: t._count,
        })),
      },
      badges: {
        totalEarned: totalBadgesEarned,
        earnedThisWeek: lastWeekBadges,
        recent: recentBadges.map((b) => ({
          id: b.id,
          userId: b.userId,
          userName: b.user.name || b.user.email,
          badgeTitle: b.badge.title,
          badgeIcon: b.badge.icon,
          earnedAt: b.earnedAt,
        })),
        topEarners: topBadgeEarners.map((e) => ({
          userId: e.userId,
          user: userMap.get(e.userId),
          badgeCount: e._count,
        })),
      },
      training: {
        totalCourses,
        totalEnrollments,
        completions: courseCompletions,
        completionRate: totalEnrollments
          ? ((courseCompletions / totalEnrollments) * 100).toFixed(1)
          : "0",
        enrollmentsThisMonth: lastMonthEnrollments,
        recentEnrollments: recentEnrollments.map((e) => ({
          id: e.id,
          userId: e.userId,
          userName: e.user.name || e.user.email,
          courseTitle: e.course.title,
          status: e.status,
          createdAt: e.createdAt,
        })),
      },
      onboarding: {
        byStatus: onboardingProgress.map((p) => ({
          status: p.status,
          count: p._count,
        })),
        total: onboardingProgress.reduce((sum, p) => sum + p._count, 0),
      },
      recentActivity: {
        notes: recentNotes.map((n) => ({
          id: n.id,
          type: n.type,
          tutorName: n.tutorProfile.user.name,
          createdByName: n.createdByName,
          createdAt: n.createdAt,
          content: n.content.substring(0, 100) + (n.content.length > 100 ? "..." : ""),
        })),
        auditLogs: recentAuditLogs.map((l) => ({
          id: l.id,
          action: l.action,
          tutorName: l.tutorProfile.user.name,
          performedByName: l.performedByName,
          field: l.field,
          previousValue: l.previousValue,
          newValue: l.newValue,
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
