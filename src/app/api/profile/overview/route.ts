import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorPoints, getTutorRank } from "@/lib/points-engine";

export const dynamic = "force-dynamic";

// GET /api/profile/overview - Get comprehensive profile data for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all profile data in parallel
    const [
      tutorProfile,
      recentBadges,
      courseEnrollments,
      classes,
      puzzleStats,
      chessLessonProgress,
    ] = await Promise.all([
      // TutorProfile with certifications, streaks, milestones, points
      prisma.tutorProfile.findUnique({
        where: { userId },
        include: {
          certifications: { orderBy: { earnedAt: "desc" } },
          streaks: true,
          milestones: { orderBy: { achievedAt: "desc" }, take: 5 },
          points: true,
        },
      }),

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

      // All course enrollments with course info
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

      // Active classes
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

    // Get total badge count and points/rank (sequential, depends on parallel results)
    const totalBadgeCount = await prisma.userBadge.count({ where: { userId } });

    let pointsData = null;
    let leaderboardRank = 0;

    if (tutorProfile) {
      [pointsData, leaderboardRank] = await Promise.all([
        getTutorPoints(tutorProfile.id),
        getTutorRank(tutorProfile.id, "monthly"),
      ]);
    }

    // Extract streak data
    const loginStreak = tutorProfile?.streaks.find(s => s.type === "LOGIN");
    const lessonStreak = tutorProfile?.streaks.find(s => s.type === "LESSONS_DAILY");

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

    // Build response
    const profileOverview = {
      // TutorProfile stats
      tutorStatus: tutorProfile?.status || null,
      totalLessons: tutorProfile?.totalLessons || 0,
      totalHours: tutorProfile?.totalHours ? Number(tutorProfile.totalHours) : 0,
      averageRating: tutorProfile?.averageRating ? Number(tutorProfile.averageRating) : null,
      fiveStarCount: tutorProfile?.fiveStarCount || 0,
      trialConversions: tutorProfile?.trialConversions || 0,

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

      // Certifications
      certifications: (tutorProfile?.certifications || []).map(c => ({
        id: c.id,
        type: c.type,
        status: c.status,
        earnedAt: c.earnedAt,
        expiresAt: c.expiresAt,
      })),
      isSchoolCertified: tutorProfile?.isSchoolCertified || false,
      isBqCertified: tutorProfile?.isBqCertified || false,
      isPlaygroupCertified: tutorProfile?.isPlaygroupCertified || false,

      // Chess skills from TutorProfile
      chessSkills: {
        level: tutorProfile?.chessLevel || null,
        rating: tutorProfile?.chessRating || null,
        noctieRating: tutorProfile?.noctieRating || null,
        chessableProgress: tutorProfile?.chessableProgress || null,
        chessableUsername: tutorProfile?.chessableUsername || null,
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
    };

    return NextResponse.json(profileOverview);
  } catch (error) {
    console.error("Failed to fetch profile overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile overview" },
      { status: 500 }
    );
  }
}
