import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasMinRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorPoints, getTutorRank } from "@/lib/points-engine";
import type { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/tutors/[id]/overview
 * Get comprehensive tutor data for the admin detail page.
 * Aggregates profile, badges, streaks, training, chess, classes, and points.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Fetch tutor profile with relations
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            headshotUrl: true,
            hireDate: true,
            role: true,
            bio: true,
            dateOfBirth: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            emergencyContactRelation: true,
            languages: true,
            organization: {
              select: {
                id: true,
                name: true,
                subdomain: true,
              },
            },
          },
        },
        certifications: { orderBy: { createdAt: "desc" } },
        labels: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" }, take: 20 },
        streaks: true,
        milestones: { orderBy: { achievedAt: "desc" }, take: 10 },
      },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "Tutor profile not found" },
        { status: 404 }
      );
    }

    const userId = tutorProfile.userId;

    // Fetch additional data in parallel
    const [
      recentBadges,
      totalBadgeCount,
      courseEnrollments,
      classes,
      puzzleStats,
      chessLessonProgress,
    ] = await Promise.all([
      // Recent badges (top 4)
      prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: {
            select: {
              id: true,
              badgeKey: true,
              title: true,
              description: true,
              icon: true,
              colorScheme: true,
            },
          },
        },
        orderBy: { earnedAt: "desc" },
        take: 4,
      }),

      // Total badge count
      prisma.userBadge.count({ where: { userId } }),

      // Course enrollments with course info
      prisma.courseEnrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
              difficulty: true,
              _count: { select: { modules: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),

      // Active classes with counts
      prisma.class.findMany({
        where: { instructorId: userId, isActive: true },
        include: { _count: { select: { students: true, sessions: true } } },
        orderBy: { updatedAt: "desc" },
      }),

      // Chess puzzle stats
      prisma.userPuzzleStats.findUnique({ where: { userId } }),

      // Chess lesson progress
      prisma.chessLessonProgress.findMany({
        where: { userId },
        include: { lesson: { select: { id: true, title: true } } },
      }),
    ]);

    // Fetch points and rank (depends on tutorProfile existing)
    const [pointsData, leaderboardRank] = await Promise.all([
      getTutorPoints(tutorProfile.id),
      getTutorRank(tutorProfile.id, "monthly"),
    ]);

    // Extract streak data
    const loginStreak = tutorProfile.streaks.find(s => s.type === "LOGIN");
    const lessonStreak = tutorProfile.streaks.find(s => s.type === "LESSONS_DAILY");

    // Calculate training stats
    const inProgressCourses = courseEnrollments.filter(e => e.status === "IN_PROGRESS");
    const completedCourses = courseEnrollments.filter(e => e.status === "COMPLETED");
    const overallTrainingProgress = courseEnrollments.length > 0
      ? Math.round(courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / courseEnrollments.length)
      : 0;

    // Calculate class stats
    const totalStudents = classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);

    // Calculate chess lesson stats
    const lessonsCompleted = chessLessonProgress.filter(p => p.isComplete).length;
    const lessonsTotal = chessLessonProgress.length;

    // Build response - spread tutorProfile then add aggregated data
    const response = {
      ...tutorProfile,
      // Points & rank
      points: {
        total: pointsData?.totalPoints || 0,
        monthly: pointsData?.monthlyPoints || 0,
        rank: leaderboardRank,
      },
      // Badges
      badges: {
        total: totalBadgeCount,
        recent: recentBadges.map(ub => ({
          id: ub.badge.id,
          badgeKey: ub.badge.badgeKey,
          title: ub.badge.title,
          description: ub.badge.description,
          icon: ub.badge.icon,
          colorScheme: ub.badge.colorScheme,
          earnedAt: ub.earnedAt,
        })),
      },
      // Streaks
      streaks: {
        login: {
          current: loginStreak?.currentStreak || 0,
          longest: loginStreak?.longestStreak || 0,
          lastActivity: loginStreak?.lastActivityDate || null,
        },
        lesson: {
          current: lessonStreak?.currentStreak || 0,
          longest: lessonStreak?.longestStreak || 0,
          lastActivity: lessonStreak?.lastActivityDate || null,
        },
      },
      // Chess activity
      chess: {
        puzzleRating: puzzleStats?.puzzleRating || null,
        puzzlesSolved: puzzleStats?.puzzlesSolved || 0,
        puzzleStreak: puzzleStats?.currentStreak || 0,
        lessonsCompleted,
        lessonsTotal,
      },
      // Training
      training: {
        enrolled: courseEnrollments.length,
        inProgress: inProgressCourses.length,
        completed: completedCourses.length,
        overallProgress: overallTrainingProgress,
        courses: courseEnrollments.map(e => ({
          id: e.course.id,
          title: e.course.title,
          slug: e.course.slug,
          thumbnailUrl: e.course.thumbnailUrl,
          difficulty: e.course.difficulty,
          moduleCount: e.course._count.modules,
          progress: e.progress,
          status: e.status,
          completedAt: e.completedAt,
        })),
      },
      // Classes
      classes: {
        active: classes.length,
        totalStudents,
        list: classes.map(c => ({
          id: c.id,
          name: c.name,
          color: c.color,
          studentCount: c._count?.students || 0,
          sessionCount: c._count?.sessions || 0,
        })),
      },
      // Milestones
      milestones: tutorProfile.milestones.map(m => ({
        id: m.id,
        type: m.type,
        value: m.value,
        achievedAt: m.achievedAt,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching tutor overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutor overview" },
      { status: 500 }
    );
  }
}
