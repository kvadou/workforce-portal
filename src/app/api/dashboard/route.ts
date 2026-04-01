import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorPoints, getLeaderboard, getTutorRank } from "@/lib/points-engine";
import { getTutorMetrics, isSTCDatabaseConfigured } from "@/lib/stc-database";

export const dynamic = "force-dynamic";

// GET /api/dashboard - Get dashboard data for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all dashboard data in parallel
    const [
      classes,
      badges,
      tutorProfile,
      courseEnrollments,
      upcomingSessions,
      puzzleStats,
    ] = await Promise.all([
      // User's classes with student count
      prisma.class.findMany({
        where: { instructorId: userId, isActive: true },
        include: {
          _count: { select: { students: true, sessions: true } },
          currentLesson: {
            select: { id: true, title: true, number: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),

      // User's earned badges (most recent first)
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
        take: 6,
      }),

      // Tutor profile with streaks, milestones, and points
      prisma.tutorProfile.findUnique({
        where: { userId },
        include: {
          streaks: true,
          milestones: {
            orderBy: { achievedAt: "desc" },
            take: 5,
          },
          points: true,
        },
      }),

      // Training course enrollments
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
              duration: true,
              _count: { select: { modules: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),

      // Upcoming live sessions (next 7 days)
      prisma.liveSession.findMany({
        where: {
          isActive: true,
          scheduledAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          registrations: {
            where: { userId },
            take: 1,
          },
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),

      // Chess puzzle stats
      prisma.userPuzzleStats.findUnique({
        where: { userId },
      }),
    ]);

    // Calculate stats
    const totalStudents = classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);
    const totalSessions = classes.reduce((sum, c) => sum + (c._count?.sessions || 0), 0);

    // Get streak data
    const loginStreak = tutorProfile?.streaks.find(s => s.type === "LOGIN");
    const lessonStreak = tutorProfile?.streaks.find(s => s.type === "LESSONS_DAILY");

    // Calculate training progress
    const inProgressCourses = courseEnrollments.filter(e => e.status === "IN_PROGRESS");
    const completedCourses = courseEnrollments.filter(e => e.status === "COMPLETED");
    const overallTrainingProgress = courseEnrollments.length > 0
      ? Math.round(courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / courseEnrollments.length)
      : 0;

    // Get points and leaderboard data if tutor profile exists
    let pointsData = null;
    let leaderboardRank = 0;
    let topTutors: Awaited<ReturnType<typeof getLeaderboard>> = [];

    if (tutorProfile) {
      [pointsData, leaderboardRank, topTutors] = await Promise.all([
        getTutorPoints(tutorProfile.id),
        getTutorRank(tutorProfile.id, "monthly"),
        getLeaderboard({ limit: 10, period: "monthly" }),
      ]);
    } else {
      topTutors = await getLeaderboard({ limit: 10, period: "monthly" });
    }

    // Get STC career stats if configured
    let careerStats = {
      lessonsTotal: tutorProfile?.totalLessons || 0,
      lessonsThisMonth: 0,
      hoursTotal: tutorProfile?.totalHours ? Number(tutorProfile.totalHours) : 0,
      averageRating: tutorProfile?.averageRating ? Number(tutorProfile.averageRating) : null,
      fiveStarCount: tutorProfile?.fiveStarCount || 0,
    };

    // If STC database is configured and we have a TutorCruncher ID, fetch live data
    if (isSTCDatabaseConfigured() && tutorProfile?.tutorCruncherId) {
      const stcMetrics = await getTutorMetrics(tutorProfile.tutorCruncherId);
      careerStats = {
        lessonsTotal: stcMetrics.totalLessons,
        lessonsThisMonth: stcMetrics.lessonsThisMonth,
        hoursTotal: stcMetrics.totalHours,
        averageRating: stcMetrics.averageRating || null,
        fiveStarCount: stcMetrics.fiveStarCount,
      };
    }

    // Calculate points available from in-progress courses
    // Estimate based on remaining progress and module points (10 pts per module)
    const coursesWithPoints = inProgressCourses.slice(0, 3).map(e => {
      const remainingProgress = 100 - e.progress;
      const modulesRemaining = Math.ceil((remainingProgress / 100) * e.course._count.modules);
      const pointsAvailable = modulesRemaining * 10 + 50; // +50 for course completion
      const estimatedTimeRemaining = e.course.duration
        ? Math.ceil((remainingProgress / 100) * e.course.duration)
        : null;

      return {
        id: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        thumbnailUrl: e.course.thumbnailUrl,
        progress: e.progress,
        timeRemaining: estimatedTimeRemaining ? `${estimatedTimeRemaining} min` : undefined,
        pointsAvailable,
      };
    });

    // Build response
    const dashboard = {
      // Quick stats
      stats: {
        classCount: classes.length,
        studentCount: totalStudents,
        sessionCount: totalSessions,
        totalLessons: careerStats.lessonsTotal,
        totalHours: careerStats.hoursTotal,
        averageRating: careerStats.averageRating,
        fiveStarCount: careerStats.fiveStarCount,
      },

      // Points & Rank
      points: pointsData || {
        totalPoints: 0,
        monthlyPoints: 0,
        weeklyPoints: 0,
        breakdown: {
          courses: 0,
          lessons: 0,
          streaks: 0,
          achievements: 0,
          quality: 0,
          engagement: 0,
        },
      },
      leaderboardRank,

      // Top tutors leaderboard
      topTutors: topTutors.map(t => ({
        rank: t.rank,
        name: t.name,
        avatarUrl: t.avatarUrl,
        points: t.points,
      })),

      // Career stats from STC
      careerStats,

      // Continue learning (in-progress courses with points)
      inProgressCourses: coursesWithPoints,

      // Upcoming live sessions
      upcomingSessions: upcomingSessions.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        scheduledAt: s.scheduledAt.toISOString(),
        duration: s.duration,
        category: s.category,
        hostName: s.hostName || "TBD",
        isRegistered: s.registrations.length > 0,
        participantCount: s._count.registrations,
        maxParticipants: s.maxParticipants,
        zoomJoinUrl: s.registrations.length > 0 ? s.zoomJoinUrl : null,
      })),

      // Classes (top 5 most recent)
      recentClasses: classes.map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        studentCount: c._count?.students || 0,
        sessionCount: c._count?.sessions || 0,
        currentLesson: c.currentLesson,
      })),

      // Badges
      badges: {
        total: badges.length,
        recent: badges.slice(0, 6).map(ub => ({
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
          lastActivity: loginStreak?.lastActivityDate,
        },
        lesson: {
          current: lessonStreak?.currentStreak || 0,
          longest: lessonStreak?.longestStreak || 0,
          lastActivity: lessonStreak?.lastActivityDate,
        },
      },

      // Training progress
      training: {
        enrolled: courseEnrollments.length,
        inProgress: inProgressCourses.length,
        completed: completedCourses.length,
        overallProgress: overallTrainingProgress,
        courses: courseEnrollments.slice(0, 4).map(e => ({
          id: e.course.id,
          title: e.course.title,
          slug: e.course.slug,
          thumbnailUrl: e.course.thumbnailUrl,
          difficulty: e.course.difficulty,
          moduleCount: e.course._count.modules,
          progress: e.progress,
          status: e.status,
        })),
      },

      // Chess puzzle stats
      puzzleStats: puzzleStats ? {
        puzzleRating: puzzleStats.puzzleRating,
        puzzlesSolved: puzzleStats.puzzlesSolved,
        currentStreak: puzzleStats.currentStreak,
        bestStreak: puzzleStats.bestStreak,
      } : null,

      // Recent milestones
      milestones: tutorProfile?.milestones.map(m => ({
        id: m.id,
        type: m.type,
        value: m.value,
        achievedAt: m.achievedAt,
      })) || [],
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
