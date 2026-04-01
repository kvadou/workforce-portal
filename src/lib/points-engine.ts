import { prisma } from "@/lib/prisma";
import type { PointsCategory, Prisma } from "@prisma/client";
import { checkPointsMilestone, notifyLeaderboardChange } from "@/lib/notifications";

/**
 * Points Engine - Configurable points calculation system
 * All point values are driven by admin-managed rules in the database
 */

// Cache for points rules to avoid repeated DB queries
let rulesCache: Map<string, PointsRuleData> | null = null;
let rulesCacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface PointsRuleData {
  id: string;
  name: string;
  category: PointsCategory;
  trigger: string;
  points: number;
  threshold: number | null;
  multiplier: number | null;
  isActive: boolean;
}

/**
 * Get all active points rules from database (with caching)
 */
async function getActiveRules(): Promise<Map<string, PointsRuleData>> {
  if (rulesCache && Date.now() < rulesCacheExpiry) {
    return rulesCache;
  }

  const rules = await prisma.pointsRule.findMany({
    where: { isActive: true },
  });

  rulesCache = new Map(rules.map(rule => [rule.trigger, rule]));
  rulesCacheExpiry = Date.now() + CACHE_TTL;

  return rulesCache;
}

/**
 * Invalidate the rules cache (call after admin updates rules)
 */
export function invalidateRulesCache(): void {
  rulesCache = null;
  rulesCacheExpiry = 0;
}

/**
 * Get a specific rule by trigger
 */
async function getRule(trigger: string): Promise<PointsRuleData | undefined> {
  const rules = await getActiveRules();
  return rules.get(trigger);
}

/**
 * Award points to a tutor
 */
export async function awardPoints(
  tutorProfileId: string,
  trigger: string,
  metadata?: Record<string, unknown>
): Promise<{ awarded: boolean; points: number; reason: string }> {
  const rule = await getRule(trigger);

  if (!rule) {
    console.log(`No active rule found for trigger: ${trigger}`);
    return { awarded: false, points: 0, reason: "No rule found" };
  }

  const pointsToAward = rule.multiplier
    ? Math.round(rule.points * rule.multiplier)
    : rule.points;

  try {
    // Get current points before update (for milestone check)
    const currentPoints = await prisma.tutorPoints.findUnique({
      where: { tutorProfileId },
      select: { totalPoints: true },
    });
    const previousTotal = currentPoints?.totalPoints ?? 0;

    // Get current rank before update (for leaderboard check)
    const previousRank = await getTutorRank(tutorProfileId, "monthly");

    // Record in points history
    await prisma.pointsHistory.create({
      data: {
        tutorProfileId,
        points: pointsToAward,
        reason: rule.name,
        category: rule.category,
        ruleId: rule.id,
        metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // Update tutor points totals
    await updateTutorPointsTotals(tutorProfileId, pointsToAward, rule.category);

    // Get new totals
    const newTotal = previousTotal + pointsToAward;

    // Check for points milestones (async, don't wait)
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      select: { userId: true },
    });

    if (tutorProfile) {
      // Check points milestone
      checkPointsMilestone(tutorProfile.userId, previousTotal, newTotal).catch(
        (err) => console.error("Error checking points milestone:", err)
      );

      // Check leaderboard change (only for significant point awards)
      if (pointsToAward >= 20) {
        const newRank = await getTutorRank(tutorProfileId, "monthly");
        if (newRank < previousRank || (previousRank === 0 && newRank <= 10)) {
          notifyLeaderboardChange(tutorProfile.userId, previousRank, newRank).catch(
            (err) => console.error("Error notifying leaderboard change:", err)
          );
        }
      }
    }

    console.log(`Awarded ${pointsToAward} points to tutor ${tutorProfileId} for ${trigger}`);
    return { awarded: true, points: pointsToAward, reason: rule.name };
  } catch (error) {
    console.error(`Error awarding points for ${trigger}:`, error);
    return { awarded: false, points: 0, reason: "Error awarding points" };
  }
}

/**
 * Award points for a tiered achievement (checks thresholds)
 * Returns the highest tier that was newly achieved
 */
export async function awardTieredPoints(
  tutorProfileId: string,
  triggerPrefix: string,
  currentValue: number
): Promise<{ awarded: boolean; totalPoints: number; tiersAwarded: string[] }> {
  const rules = await getActiveRules();
  const tiersAwarded: string[] = [];
  let totalPoints = 0;

  // Find all rules matching the prefix with thresholds
  const matchingRules = Array.from(rules.values())
    .filter(rule => rule.trigger.startsWith(triggerPrefix) && rule.threshold !== null)
    .sort((a, b) => (a.threshold ?? 0) - (b.threshold ?? 0));

  for (const rule of matchingRules) {
    if (currentValue >= (rule.threshold ?? 0)) {
      // Check if already awarded (via history)
      const alreadyAwarded = await prisma.pointsHistory.findFirst({
        where: {
          tutorProfileId,
          ruleId: rule.id,
        },
      });

      if (!alreadyAwarded) {
        const result = await awardPoints(tutorProfileId, rule.trigger, {
          value: currentValue,
          threshold: rule.threshold,
        });
        if (result.awarded) {
          tiersAwarded.push(rule.trigger);
          totalPoints += result.points;
        }
      }
    }
  }

  return { awarded: tiersAwarded.length > 0, totalPoints, tiersAwarded };
}

/**
 * Update the totals in TutorPoints
 */
async function updateTutorPointsTotals(
  tutorProfileId: string,
  pointsToAdd: number,
  category: PointsCategory
): Promise<void> {
  // Ensure TutorPoints record exists
  await prisma.tutorPoints.upsert({
    where: { tutorProfileId },
    create: {
      tutorProfileId,
      totalPoints: pointsToAdd,
      monthlyPoints: pointsToAdd,
      weeklyPoints: pointsToAdd,
      [categoryToField(category)]: pointsToAdd,
    },
    update: {
      totalPoints: { increment: pointsToAdd },
      monthlyPoints: { increment: pointsToAdd },
      weeklyPoints: { increment: pointsToAdd },
      [categoryToField(category)]: { increment: pointsToAdd },
      lastCalculatedAt: new Date(),
    },
  });
}

/**
 * Map category to field name
 */
function categoryToField(category: PointsCategory): string {
  const mapping: Record<PointsCategory, string> = {
    TEACHING: "lessonPoints",
    QUALITY: "qualityPoints",
    LEARNING: "coursePoints",
    ENGAGEMENT: "engagementPoints",
    BUSINESS: "achievementPoints",
  };
  return mapping[category];
}

/**
 * Get tutor's points summary
 */
export async function getTutorPoints(tutorProfileId: string): Promise<{
  totalPoints: number;
  monthlyPoints: number;
  weeklyPoints: number;
  breakdown: {
    courses: number;
    lessons: number;
    streaks: number;
    achievements: number;
    quality: number;
    engagement: number;
  };
} | null> {
  const points = await prisma.tutorPoints.findUnique({
    where: { tutorProfileId },
  });

  if (!points) {
    return null;
  }

  return {
    totalPoints: points.totalPoints,
    monthlyPoints: points.monthlyPoints,
    weeklyPoints: points.weeklyPoints,
    breakdown: {
      courses: points.coursePoints,
      lessons: points.lessonPoints,
      streaks: points.streakPoints,
      achievements: points.achievementPoints,
      quality: points.qualityPoints,
      engagement: points.engagementPoints,
    },
  };
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(options: {
  limit?: number;
  period?: "all" | "monthly" | "weekly";
  team?: string;
}): Promise<{
  rank: number;
  tutorProfileId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  points: number;
  team: string | null;
}[]> {
  const { limit = 10, period = "monthly" } = options;

  const pointsField = period === "all"
    ? "totalPoints"
    : period === "monthly"
      ? "monthlyPoints"
      : "weeklyPoints";

  const leaderboard = await prisma.tutorPoints.findMany({
    where: {
      [pointsField]: { gt: 0 },
      ...(options.team && {
        tutorProfile: {
          team: options.team as any,
        },
      }),
    },
    orderBy: { [pointsField]: "desc" },
    take: limit,
    include: {
      tutorProfile: {
        select: {
          team: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    tutorProfileId: entry.tutorProfileId,
    userId: entry.tutorProfile.user.id,
    name: entry.tutorProfile.user.name || "Unknown",
    avatarUrl: entry.tutorProfile.user.avatarUrl,
    points: entry[pointsField] as number,
    team: entry.tutorProfile.team,
  }));
}

/**
 * Get a tutor's rank on the leaderboard
 */
export async function getTutorRank(
  tutorProfileId: string,
  period: "all" | "monthly" | "weekly" = "monthly"
): Promise<number> {
  const pointsField = period === "all"
    ? "totalPoints"
    : period === "monthly"
      ? "monthlyPoints"
      : "weeklyPoints";

  const tutorPoints = await prisma.tutorPoints.findUnique({
    where: { tutorProfileId },
    select: { [pointsField]: true },
  });

  if (!tutorPoints) {
    return 0;
  }

  const points = tutorPoints[pointsField] as number;

  // Count how many tutors have more points
  const rank = await prisma.tutorPoints.count({
    where: {
      [pointsField]: { gt: points },
    },
  });

  return rank + 1;
}

/**
 * Reset weekly points (should be called via cron job every Monday)
 */
export async function resetWeeklyPoints(): Promise<number> {
  const result = await prisma.tutorPoints.updateMany({
    data: {
      weeklyPoints: 0,
      lastCalculatedAt: new Date(),
    },
  });
  console.log(`Reset weekly points for ${result.count} tutors`);
  return result.count;
}

/**
 * Reset monthly points (should be called via cron job on 1st of each month)
 */
export async function resetMonthlyPoints(): Promise<number> {
  const result = await prisma.tutorPoints.updateMany({
    data: {
      monthlyPoints: 0,
      lastCalculatedAt: new Date(),
    },
  });
  console.log(`Reset monthly points for ${result.count} tutors`);
  return result.count;
}

/**
 * Initialize points record for a tutor (if not exists)
 */
export async function initializeTutorPoints(tutorProfileId: string): Promise<void> {
  await prisma.tutorPoints.upsert({
    where: { tutorProfileId },
    create: { tutorProfileId },
    update: {},
  });
}

/**
 * Points triggers for different activities
 */
export const POINTS_TRIGGERS = {
  // Teaching
  LESSON_TAUGHT: "lesson_taught",
  LESSONS_MONTHLY_40: "lessons_monthly_40",
  LESSONS_MONTHLY_60: "lessons_monthly_60",
  LESSONS_MONTHLY_80: "lessons_monthly_80",

  // Quality
  FIVE_STAR_REVIEW: "five_star_review",
  TRIAL_CONVERSION: "trial_conversion",
  CLIENT_RETENTION: "client_retention",

  // Learning
  MODULE_COMPLETE: "module_complete",
  COURSE_COMPLETE: "course_complete",
  QUIZ_PASSED: "quiz_passed",
  PATH_COMPLETE: "path_complete",

  // Engagement
  LIVE_SESSION_ATTENDED: "live_session_attended",
  LOGIN_STREAK_7: "login_streak_7",
  LOGIN_STREAK_14: "login_streak_14",
  LOGIN_STREAK_30: "login_streak_30",

  // Business
  REFERRAL: "referral",

  // Onboarding
  ONBOARDING_WELCOME: "onboarding_welcome",
  ONBOARDING_VIDEO: "onboarding_video",
  ONBOARDING_QUIZ: "onboarding_quiz",
  ONBOARDING_PROFILE: "onboarding_profile",
  ONBOARDING_W9: "onboarding_w9",
  ONBOARDING_TRAINING: "onboarding_training",
  ONBOARDING_SHADOW: "onboarding_shadow",
  ONBOARDING_COMPLETE: "onboarding_complete",
} as const;

/**
 * Seed default points rules (run once during setup)
 */
export async function seedDefaultPointsRules(): Promise<void> {
  const defaultRules: Omit<PointsRuleData, "id">[] = [
    // Teaching
    { name: "Lesson Taught", category: "TEACHING", trigger: POINTS_TRIGGERS.LESSON_TAUGHT, points: 5, threshold: null, multiplier: null, isActive: true },
    { name: "Monthly Lessons 40+", category: "TEACHING", trigger: POINTS_TRIGGERS.LESSONS_MONTHLY_40, points: 100, threshold: 40, multiplier: null, isActive: true },
    { name: "Monthly Lessons 60+", category: "TEACHING", trigger: POINTS_TRIGGERS.LESSONS_MONTHLY_60, points: 200, threshold: 60, multiplier: null, isActive: true },
    { name: "Monthly Lessons 80+", category: "TEACHING", trigger: POINTS_TRIGGERS.LESSONS_MONTHLY_80, points: 400, threshold: 80, multiplier: null, isActive: true },

    // Quality
    { name: "5-Star Review", category: "QUALITY", trigger: POINTS_TRIGGERS.FIVE_STAR_REVIEW, points: 10, threshold: null, multiplier: null, isActive: true },
    { name: "Trial Conversion", category: "QUALITY", trigger: POINTS_TRIGGERS.TRIAL_CONVERSION, points: 50, threshold: null, multiplier: null, isActive: true },
    { name: "Client Retention", category: "QUALITY", trigger: POINTS_TRIGGERS.CLIENT_RETENTION, points: 25, threshold: null, multiplier: null, isActive: true },

    // Learning
    { name: "Course Module Complete", category: "LEARNING", trigger: POINTS_TRIGGERS.MODULE_COMPLETE, points: 10, threshold: null, multiplier: null, isActive: true },
    { name: "Course Complete", category: "LEARNING", trigger: POINTS_TRIGGERS.COURSE_COMPLETE, points: 50, threshold: null, multiplier: null, isActive: true },
    { name: "Quiz Passed", category: "LEARNING", trigger: POINTS_TRIGGERS.QUIZ_PASSED, points: 20, threshold: null, multiplier: null, isActive: true },
    { name: "Learning Path Complete", category: "LEARNING", trigger: POINTS_TRIGGERS.PATH_COMPLETE, points: 100, threshold: null, multiplier: null, isActive: true },

    // Engagement
    { name: "Live Session Attended", category: "ENGAGEMENT", trigger: POINTS_TRIGGERS.LIVE_SESSION_ATTENDED, points: 30, threshold: null, multiplier: null, isActive: true },
    { name: "7-Day Login Streak", category: "ENGAGEMENT", trigger: POINTS_TRIGGERS.LOGIN_STREAK_7, points: 35, threshold: 7, multiplier: null, isActive: true },
    { name: "14-Day Login Streak", category: "ENGAGEMENT", trigger: POINTS_TRIGGERS.LOGIN_STREAK_14, points: 75, threshold: 14, multiplier: null, isActive: true },
    { name: "30-Day Login Streak", category: "ENGAGEMENT", trigger: POINTS_TRIGGERS.LOGIN_STREAK_30, points: 150, threshold: 30, multiplier: null, isActive: true },

    // Business
    { name: "Referral", category: "BUSINESS", trigger: POINTS_TRIGGERS.REFERRAL, points: 100, threshold: null, multiplier: null, isActive: true },

    // Onboarding
    { name: "Onboarding Welcome", category: "LEARNING", trigger: POINTS_TRIGGERS.ONBOARDING_WELCOME, points: 10, threshold: null, multiplier: null, isActive: true },
    { name: "Onboarding Video", category: "LEARNING", trigger: POINTS_TRIGGERS.ONBOARDING_VIDEO, points: 10, threshold: null, multiplier: null, isActive: true },
    { name: "Onboarding Quiz", category: "LEARNING", trigger: POINTS_TRIGGERS.ONBOARDING_QUIZ, points: 50, threshold: null, multiplier: null, isActive: true },
    { name: "Onboarding Profile", category: "LEARNING", trigger: POINTS_TRIGGERS.ONBOARDING_PROFILE, points: 15, threshold: null, multiplier: null, isActive: true },
    { name: "Onboarding W-9", category: "LEARNING", trigger: POINTS_TRIGGERS.ONBOARDING_W9, points: 15, threshold: null, multiplier: null, isActive: true },
    { name: "Onboarding Training", category: "LEARNING", trigger: POINTS_TRIGGERS.ONBOARDING_TRAINING, points: 25, threshold: null, multiplier: null, isActive: true },
    { name: "Onboarding Shadow", category: "LEARNING", trigger: POINTS_TRIGGERS.ONBOARDING_SHADOW, points: 50, threshold: null, multiplier: null, isActive: true },
    { name: "Onboarding Complete", category: "LEARNING", trigger: POINTS_TRIGGERS.ONBOARDING_COMPLETE, points: 250, threshold: null, multiplier: null, isActive: true },
  ];

  for (const rule of defaultRules) {
    await prisma.pointsRule.upsert({
      where: { trigger: rule.trigger },
      create: rule,
      update: rule,
    });
  }

  console.log(`Seeded ${defaultRules.length} default points rules`);
}
