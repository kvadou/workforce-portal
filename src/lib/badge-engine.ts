import { prisma } from "@/lib/prisma";
import type { MilestoneType, StreakType, Prisma } from "@prisma/client";

/**
 * Badge Award Engine
 * Handles automatic badge awarding based on user actions and achievements
 */

// Milestone thresholds
const LESSON_MILESTONES = [10, 50, 100, 250, 500, 1000];
const WEEKLY_LESSON_MILESTONES = [10, 15, 20, 25];
const FIVE_STAR_MILESTONES = [5, 10, 25, 50, 100];

/**
 * Award a badge to a user if they don't already have it
 */
export async function awardBadge(
  userId: string,
  badgeKey: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    // Find the badge by key
    const badge = await prisma.onboardingBadge.findUnique({
      where: { badgeKey },
    });

    if (!badge || !badge.isActive) {
      console.log(`Badge ${badgeKey} not found or inactive`);
      return false;
    }

    // Check if user already has this badge
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    });

    if (existing) {
      return false; // Already has badge
    }

    // Award the badge
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    console.log(`Awarded badge ${badgeKey} to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error awarding badge ${badgeKey}:`, error);
    return false;
  }
}

/**
 * Record a milestone achievement for a tutor
 */
export async function recordMilestone(
  tutorProfileId: string,
  type: MilestoneType,
  value: number,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    // Check if milestone already recorded
    const existing = await prisma.tutorMilestone.findUnique({
      where: {
        tutorProfileId_type_value: {
          tutorProfileId,
          type,
          value,
        },
      },
    });

    if (existing) {
      return false;
    }

    // Record the milestone
    await prisma.tutorMilestone.create({
      data: {
        tutorProfileId,
        type,
        value,
        metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    console.log(`Recorded milestone ${type}:${value} for tutor ${tutorProfileId}`);
    return true;
  } catch (error) {
    console.error(`Error recording milestone:`, error);
    return false;
  }
}

/**
 * Update a tutor's streak
 */
export async function updateStreak(
  tutorProfileId: string,
  type: StreakType,
  activityDate: Date = new Date()
): Promise<{ currentStreak: number; longestStreak: number; isNewRecord: boolean }> {
  const today = new Date(activityDate);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    // Get or create streak record
    let streak = await prisma.tutorStreak.findUnique({
      where: {
        tutorProfileId_type: {
          tutorProfileId,
          type,
        },
      },
    });

    if (!streak) {
      // Create new streak
      streak = await prisma.tutorStreak.create({
        data: {
          tutorProfileId,
          type,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        },
      });
      return { currentStreak: 1, longestStreak: 1, isNewRecord: true };
    }

    // Check last activity date
    const lastActivity = streak.lastActivityDate
      ? new Date(streak.lastActivityDate)
      : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);

      // Already logged today
      if (lastActivity.getTime() === today.getTime()) {
        return {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          isNewRecord: false,
        };
      }

      // Yesterday - continue streak
      if (lastActivity.getTime() === yesterday.getTime()) {
        const newCurrent = streak.currentStreak + 1;
        const newLongest = Math.max(newCurrent, streak.longestStreak);
        const isNewRecord = newLongest > streak.longestStreak;

        await prisma.tutorStreak.update({
          where: { id: streak.id },
          data: {
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastActivityDate: today,
          },
        });

        return { currentStreak: newCurrent, longestStreak: newLongest, isNewRecord };
      }
    }

    // More than a day ago - reset streak
    await prisma.tutorStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: 1,
        lastActivityDate: today,
      },
    });

    return {
      currentStreak: 1,
      longestStreak: streak.longestStreak,
      isNewRecord: false,
    };
  } catch (error) {
    console.error(`Error updating streak:`, error);
    return { currentStreak: 0, longestStreak: 0, isNewRecord: false };
  }
}

/**
 * Check and award badges for lesson milestones
 */
export async function checkLessonMilestones(
  userId: string,
  tutorProfileId: string,
  totalLessons: number
): Promise<string[]> {
  const awardedBadges: string[] = [];

  for (const milestone of LESSON_MILESTONES) {
    if (totalLessons >= milestone) {
      const badgeKey = `lessons_${milestone}`;
      const awarded = await awardBadge(userId, badgeKey, { totalLessons });
      if (awarded) {
        awardedBadges.push(badgeKey);
        await recordMilestone(tutorProfileId, "TOTAL_LESSONS", milestone);
      }
    }
  }

  return awardedBadges;
}

/**
 * Check and award badges for weekly lesson consistency
 */
export async function checkWeeklyLessonMilestones(
  userId: string,
  tutorProfileId: string,
  weeklyLessons: number
): Promise<string[]> {
  const awardedBadges: string[] = [];

  for (const milestone of WEEKLY_LESSON_MILESTONES) {
    if (weeklyLessons >= milestone) {
      const badgeKey = `weekly_${milestone}`;
      const awarded = await awardBadge(userId, badgeKey, { weeklyLessons });
      if (awarded) {
        awardedBadges.push(badgeKey);
        await recordMilestone(tutorProfileId, "WEEKLY_LESSONS", milestone);
      }
    }
  }

  return awardedBadges;
}

/**
 * Check and award badges for 5-star ratings
 */
export async function checkRatingMilestones(
  userId: string,
  tutorProfileId: string,
  fiveStarCount: number
): Promise<string[]> {
  const awardedBadges: string[] = [];

  for (const milestone of FIVE_STAR_MILESTONES) {
    if (fiveStarCount >= milestone) {
      const badgeKey = `five_star_${milestone}`;
      const awarded = await awardBadge(userId, badgeKey, { fiveStarCount });
      if (awarded) {
        awardedBadges.push(badgeKey);
        await recordMilestone(tutorProfileId, "FIVE_STAR_RATINGS", milestone);
      }
    }
  }

  return awardedBadges;
}

/**
 * Award badge for completing onboarding step
 */
export async function awardOnboardingStepBadge(
  userId: string,
  stepKey: string
): Promise<boolean> {
  return awardBadge(userId, `onboarding_${stepKey}`, { stepCompleted: stepKey });
}

/**
 * Award badge for completing all onboarding
 */
export async function awardOnboardingCompleteBadge(userId: string): Promise<boolean> {
  return awardBadge(userId, "onboarding_complete", {
    completedAt: new Date().toISOString(),
  });
}

/**
 * Award badge for streak achievements
 */
export async function checkStreakBadges(
  userId: string,
  streakType: StreakType,
  currentStreak: number
): Promise<string[]> {
  const awardedBadges: string[] = [];
  const streakMilestones = [7, 14, 30, 60, 90];

  for (const milestone of streakMilestones) {
    if (currentStreak >= milestone) {
      const badgeKey = `streak_${streakType.toLowerCase()}_${milestone}`;
      const awarded = await awardBadge(userId, badgeKey, {
        streakType,
        streakLength: currentStreak,
      });
      if (awarded) {
        awardedBadges.push(badgeKey);
      }
    }
  }

  return awardedBadges;
}

/**
 * Process a lesson completion event from STC
 * This should be called when STC reports a completed lesson
 */
export async function processLessonCompletion(
  tutorProfileId: string,
  lessonData: {
    lessonDate: Date;
    rating?: number;
    isTrialConversion?: boolean;
  }
): Promise<{
  streakUpdated: boolean;
  badgesAwarded: string[];
  milestonesReached: string[];
}> {
  const result = {
    streakUpdated: false,
    badgesAwarded: [] as string[],
    milestonesReached: [] as string[],
  };

  try {
    // Get tutor profile with user
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: { user: true },
    });

    if (!tutorProfile) {
      console.error(`TutorProfile ${tutorProfileId} not found`);
      return result;
    }

    const userId = tutorProfile.userId;

    // Update daily lesson streak
    const streak = await updateStreak(tutorProfileId, "LESSONS_DAILY", lessonData.lessonDate);
    result.streakUpdated = true;

    // Check streak badges
    const streakBadges = await checkStreakBadges(userId, "LESSONS_DAILY", streak.currentStreak);
    result.badgesAwarded.push(...streakBadges);

    // Check lesson count milestones
    const lessonBadges = await checkLessonMilestones(
      userId,
      tutorProfileId,
      tutorProfile.totalLessons + 1
    );
    result.badgesAwarded.push(...lessonBadges);

    // Track 5-star ratings
    if (lessonData.rating === 5) {
      // Note: In a real implementation, you'd track the count in DB
      // For now, we'll just log it
      console.log("5-star rating received for tutor", tutorProfileId);
    }

    // Track trial conversions
    if (lessonData.isTrialConversion) {
      const conversionBadge = await awardBadge(userId, "trial_conversion", {
        date: lessonData.lessonDate.toISOString(),
      });
      if (conversionBadge) {
        result.badgesAwarded.push("trial_conversion");
      }
    }

    return result;
  } catch (error) {
    console.error("Error processing lesson completion:", error);
    return result;
  }
}

/**
 * Check and award milestones after a lesson completion
 * Called by STC webhook when a lesson is completed
 */
export async function checkAndAwardMilestones(
  userId: string,
  totalLessons: number,
  hasNewFiveStar: boolean,
  hasTrialConversion: boolean
): Promise<string[]> {
  const awardedMilestones: string[] = [];

  try {
    // Get tutor profile for milestone tracking
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      console.warn(`No tutor profile found for user ${userId}`);
      return awardedMilestones;
    }

    // Check lesson count milestones
    const lessonBadges = await checkLessonMilestones(userId, tutorProfile.id, totalLessons);
    awardedMilestones.push(...lessonBadges);

    // Track and award 5-star rating badges
    if (hasNewFiveStar) {
      // Increment 5-star count and check milestones
      const fiveStarCount = (tutorProfile.fiveStarCount || 0) + 1;

      // Update the count in database
      await prisma.tutorProfile.update({
        where: { id: tutorProfile.id },
        data: { fiveStarCount },
      });

      const ratingBadges = await checkRatingMilestones(userId, tutorProfile.id, fiveStarCount);
      awardedMilestones.push(...ratingBadges);
    }

    // Track and award trial conversion badges
    if (hasTrialConversion) {
      // Increment trial conversion count and check milestones
      const trialConversions = (tutorProfile.trialConversions || 0) + 1;

      // Update the count in database
      await prisma.tutorProfile.update({
        where: { id: tutorProfile.id },
        data: { trialConversions },
      });

      // Check trial conversion milestones
      const conversionBadges = await checkTrialConversionMilestones(
        userId,
        tutorProfile.id,
        trialConversions
      );
      awardedMilestones.push(...conversionBadges);
    }

    return awardedMilestones;
  } catch (error) {
    console.error("Error checking milestones:", error);
    return awardedMilestones;
  }
}

// Trial conversion milestones
const TRIAL_CONVERSION_MILESTONES = [1, 5, 10, 25, 50, 100];

/**
 * Check and award badges for trial conversions
 */
export async function checkTrialConversionMilestones(
  userId: string,
  tutorProfileId: string,
  conversionCount: number
): Promise<string[]> {
  const awardedBadges: string[] = [];

  for (const milestone of TRIAL_CONVERSION_MILESTONES) {
    if (conversionCount >= milestone) {
      const badgeKey = `trial_conversion_${milestone}`;
      const awarded = await awardBadge(userId, badgeKey, { conversionCount });
      if (awarded) {
        awardedBadges.push(badgeKey);
        await recordMilestone(tutorProfileId, "TRIAL_CONVERSIONS", milestone);
      }
    }
  }

  return awardedBadges;
}

/**
 * Get all badges earned by a user
 */
export async function getUserBadges(userId: string) {
  return prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true,
    },
    orderBy: { earnedAt: "desc" },
  });
}

/**
 * Get all milestones achieved by a tutor
 */
export async function getTutorMilestones(tutorProfileId: string) {
  return prisma.tutorMilestone.findMany({
    where: { tutorProfileId },
    orderBy: { achievedAt: "desc" },
  });
}

/**
 * Get all streaks for a tutor
 */
export async function getTutorStreaks(tutorProfileId: string) {
  return prisma.tutorStreak.findMany({
    where: { tutorProfileId },
  });
}
