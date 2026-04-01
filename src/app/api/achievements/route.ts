import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/achievements - Get all achievements data for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all achievement data in parallel
    const [
      allBadges,
      earnedBadges,
      tutorProfile,
    ] = await Promise.all([
      // All available badges
      prisma.onboardingBadge.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),

      // User's earned badges
      prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
        },
        orderBy: { earnedAt: "desc" },
      }),

      // Tutor profile with streaks and milestones
      prisma.tutorProfile.findUnique({
        where: { userId },
        include: {
          streaks: true,
          milestones: {
            orderBy: { achievedAt: "desc" },
          },
        },
      }),
    ]);

    // Create a map of earned badge IDs for quick lookup
    const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badgeId));

    // Categorize badges
    const earned = earnedBadges.map(eb => ({
      id: eb.badge.id,
      badgeKey: eb.badge.badgeKey,
      title: eb.badge.title,
      description: eb.badge.description,
      icon: eb.badge.icon,
      colorScheme: eb.badge.colorScheme,
      unlockType: eb.badge.unlockType,
      earnedAt: eb.earnedAt,
      metadata: eb.metadata,
    }));

    const available = allBadges
      .filter(b => !earnedBadgeIds.has(b.id))
      .map(b => ({
        id: b.id,
        badgeKey: b.badgeKey,
        title: b.title,
        description: b.description,
        icon: b.icon,
        colorScheme: b.colorScheme,
        unlockType: b.unlockType,
        unlockCondition: b.unlockCondition,
      }));

    // Get all streaks
    const streaks = tutorProfile?.streaks.map(s => ({
      type: s.type,
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      lastActivityDate: s.lastActivityDate,
    })) || [];

    // Get all milestones
    const milestones = tutorProfile?.milestones.map(m => ({
      id: m.id,
      type: m.type,
      value: m.value,
      achievedAt: m.achievedAt,
    })) || [];

    // Calculate milestone progress for common milestones
    const stats = {
      totalLessons: tutorProfile?.totalLessons || 0,
      totalHours: tutorProfile?.totalHours ? Number(tutorProfile.totalHours) : 0,
      fiveStarCount: tutorProfile?.fiveStarCount || 0,
      trialConversions: tutorProfile?.trialConversions || 0,
    };

    // Define milestone thresholds for progress tracking
    const milestoneThresholds = {
      LESSONS_TAUGHT: [10, 25, 50, 100, 250, 500, 1000],
      HOURS_WORKED: [10, 25, 50, 100, 250, 500, 1000],
      FIVE_STAR_REVIEWS: [5, 10, 25, 50, 100],
      TRIAL_CONVERSIONS: [5, 10, 25, 50],
    };

    // Calculate next milestone for each category
    const achievedMilestoneValues: Record<string, number[]> = {};
    milestones.forEach(m => {
      if (!achievedMilestoneValues[m.type]) {
        achievedMilestoneValues[m.type] = [];
      }
      achievedMilestoneValues[m.type].push(m.value);
    });

    const milestoneProgress = [
      {
        type: "LESSONS_TAUGHT",
        label: "Lessons Taught",
        current: stats.totalLessons,
        thresholds: milestoneThresholds.LESSONS_TAUGHT,
        achieved: achievedMilestoneValues.LESSONS_TAUGHT || [],
      },
      {
        type: "HOURS_WORKED",
        label: "Hours Worked",
        current: Math.floor(stats.totalHours),
        thresholds: milestoneThresholds.HOURS_WORKED,
        achieved: achievedMilestoneValues.HOURS_WORKED || [],
      },
      {
        type: "FIVE_STAR_REVIEWS",
        label: "5-Star Reviews",
        current: stats.fiveStarCount,
        thresholds: milestoneThresholds.FIVE_STAR_REVIEWS,
        achieved: achievedMilestoneValues.FIVE_STAR_REVIEWS || [],
      },
      {
        type: "TRIAL_CONVERSIONS",
        label: "Trial Conversions",
        current: stats.trialConversions,
        thresholds: milestoneThresholds.TRIAL_CONVERSIONS,
        achieved: achievedMilestoneValues.TRIAL_CONVERSIONS || [],
      },
    ];

    // Build response
    const achievements = {
      badges: {
        earned,
        available,
        totalEarned: earned.length,
        totalAvailable: allBadges.length,
      },
      streaks,
      milestones: {
        achieved: milestones,
        progress: milestoneProgress,
      },
      stats,
    };

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Failed to fetch achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}
