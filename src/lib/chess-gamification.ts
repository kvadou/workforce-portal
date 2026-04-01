import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points-engine";
import { awardBadge, updateStreak, recordMilestone } from "@/lib/badge-engine";
import { createNotification } from "@/lib/notifications";

/**
 * Chess Gamification - Points, badges, streaks, and ratings for puzzles & lessons
 */

// Simple Elo rating calculation
const K_FACTOR = 32;

function calculateNewRating(
  userRating: number,
  puzzleRating: number,
  solved: boolean
): number {
  const expected = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
  const score = solved ? 1 : 0;
  return Math.round(userRating + K_FACTOR * (score - expected));
}

// Milestone thresholds for puzzles
const PUZZLE_MILESTONES = [10, 50, 100, 500, 1000];
const RATING_MILESTONES = [1400, 1800];
const STREAK_MILESTONES = [7, 30];

/**
 * Ensure user has puzzle stats record
 */
async function ensurePuzzleStats(userId: string) {
  let stats = await prisma.userPuzzleStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    stats = await prisma.userPuzzleStats.create({
      data: { userId, puzzleRating: 1200 },
    });
  }

  return stats;
}

/**
 * Ensure user has a TutorProfile for points (creates one if missing)
 */
async function ensureTutorProfile(userId: string) {
  let profile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    profile = await prisma.tutorProfile.create({
      data: { userId, status: "PENDING" },
    });
  }

  return profile;
}

/**
 * Called when a user completes a puzzle attempt
 */
export async function onPuzzleSolved(
  userId: string,
  puzzleId: string,
  puzzleRating: number,
  solved: boolean,
  timeMs: number,
  usedHint: boolean
) {
  const stats = await ensurePuzzleStats(userId);
  const profile = await ensureTutorProfile(userId);

  // Update rating
  const newRating = calculateNewRating(
    stats.puzzleRating,
    puzzleRating,
    solved
  );

  // Update theme progress
  const puzzle = await prisma.chessPuzzle.findUnique({
    where: { id: puzzleId },
    select: { themes: true },
  });
  const themeProgress: Record<
    string,
    { solved: number; failed: number }
  > = (stats.themeProgress as Record<string, { solved: number; failed: number }>) || {};
  if (puzzle) {
    for (const theme of puzzle.themes) {
      if (!themeProgress[theme]) {
        themeProgress[theme] = { solved: 0, failed: 0 };
      }
      if (solved) {
        themeProgress[theme].solved++;
      } else {
        themeProgress[theme].failed++;
      }
    }
  }

  // Update stats
  const newSolved = solved
    ? stats.puzzlesSolved + 1
    : stats.puzzlesSolved;
  const newFailed = solved
    ? stats.puzzlesFailed
    : stats.puzzlesFailed + 1;

  await prisma.userPuzzleStats.update({
    where: { userId },
    data: {
      puzzleRating: newRating,
      puzzlesSolved: newSolved,
      puzzlesFailed: newFailed,
      totalTimeMs: stats.totalTimeMs + timeMs,
      hintsUsed: usedHint ? stats.hintsUsed + 1 : stats.hintsUsed,
      themeProgress,
      lastPuzzleAt: new Date(),
    },
  });

  if (!solved) return;

  // Award points
  await awardPoints(profile.id, "puzzle_solved", {
    puzzleId,
    puzzleRating,
    timeMs,
  });

  // Update daily puzzle streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const streakResult = await updateStreak(
    profile.id,
    "PUZZLES_DAILY",
    today
  );

  // Check streak milestones
  for (const milestone of STREAK_MILESTONES) {
    if (streakResult.currentStreak === milestone) {
      await awardPoints(profile.id, `puzzle_streak_${milestone}`, {
        streak: milestone,
      });
      await awardBadge(
        userId,
        milestone === 7 ? "chess_streak_7" : "chess_streak_30",
        { streak: milestone }
      );
    }
  }

  // Check puzzle count milestones
  for (const milestone of PUZZLE_MILESTONES) {
    if (newSolved === milestone) {
      await awardPoints(profile.id, `puzzles_solved_${milestone}`, {
        count: milestone,
      });
      await recordMilestone(profile.id, "PUZZLES_SOLVED", milestone, {
        puzzleRating: newRating,
      });

      // Award corresponding badge
      const badgeMap: Record<number, string> = {
        10: "chess_puzzle_novice",
        50: "chess_puzzle_adept",
        100: "chess_puzzle_master",
        500: "chess_puzzle_grandmaster",
      };
      if (badgeMap[milestone]) {
        await awardBadge(userId, badgeMap[milestone], {
          puzzlesSolved: milestone,
        });
      }

      // Send notification
      await createNotification({
        userId,
        type: "PUZZLE_MILESTONE",
        title: `${milestone} Puzzles Solved!`,
        message: `You've solved ${milestone} chess puzzles. Your rating is ${newRating}.`,
        link: "/puzzles",
      });
    }
  }

  // Check rating milestones
  for (const ratingMilestone of RATING_MILESTONES) {
    if (
      newRating >= ratingMilestone &&
      stats.puzzleRating < ratingMilestone
    ) {
      const badgeKey =
        ratingMilestone === 1400
          ? "chess_rating_1400"
          : "chess_rating_1800";
      await awardBadge(userId, badgeKey, { rating: newRating });
      await createNotification({
        userId,
        type: "PUZZLE_MILESTONE",
        title: `Rating ${ratingMilestone} Reached!`,
        message: `Your puzzle rating reached ${ratingMilestone}!`,
        link: "/puzzles",
      });
    }
  }
}

/**
 * Get deterministic daily puzzle based on date
 */
export async function getDailyPuzzle(date?: Date) {
  const d = date || new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  // Simple hash for deterministic selection
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  // Get total puzzle count
  const total = await prisma.chessPuzzle.count({
    where: { isActive: true, rating: { gte: 800, lte: 1600 } },
  });

  if (total === 0) return null;

  const offset = hash % total;

  const puzzle = await prisma.chessPuzzle.findFirst({
    where: { isActive: true, rating: { gte: 800, lte: 1600 } },
    skip: offset,
    orderBy: { id: "asc" },
  });

  return puzzle;
}

/**
 * Called when a user completes a chess lesson level
 */
export async function onLessonLevelComplete(
  userId: string,
  lessonId: string,
  levelIndex: number
) {
  const lesson = await prisma.chessLesson.findUnique({
    where: { id: lessonId },
    include: {
      levels: { select: { id: true } },
      category: { select: { slug: true, id: true } },
    },
  });

  if (!lesson) return;

  const totalLevels = lesson.levels.length;
  const completedLevels = levelIndex + 1;

  // Update or create progress
  await prisma.chessLessonProgress.upsert({
    where: {
      userId_lessonId: { userId, lessonId },
    },
    update: {
      completedLevels: Math.max(completedLevels, 0),
      totalLevels,
      isComplete: completedLevels >= totalLevels,
    },
    create: {
      userId,
      lessonId,
      completedLevels,
      totalLevels,
      isComplete: completedLevels >= totalLevels,
    },
  });

  // If lesson just completed
  if (completedLevels >= totalLevels) {
    const profile = await ensureTutorProfile(userId);
    await awardPoints(profile.id, "chess_lesson_complete", {
      lessonId,
      lessonTitle: lesson.title,
    });

    // Check if first lesson ever
    const completedCount = await prisma.chessLessonProgress.count({
      where: { userId, isComplete: true },
    });
    if (completedCount === 1) {
      await awardBadge(userId, "chess_learner", { lessonTitle: lesson.title });
    }

    // Check if entire category is done
    const categoryLessons = await prisma.chessLesson.count({
      where: { categoryId: lesson.category.id },
    });
    const completedInCategory = await prisma.chessLessonProgress.count({
      where: {
        userId,
        isComplete: true,
        lesson: { categoryId: lesson.category.id },
      },
    });

    if (completedInCategory >= categoryLessons) {
      await awardPoints(profile.id, "chess_category_complete", {
        category: lesson.category.slug,
      });

      // Award category badge
      const categoryBadgeMap: Record<string, string> = {
        "chess-pieces": "chess_piece_expert",
        fundamentals: "chess_fundamentals_master",
      };
      const badgeKey = categoryBadgeMap[lesson.category.slug];
      if (badgeKey) {
        await awardBadge(userId, badgeKey, {
          category: lesson.category.slug,
        });
      }
    }
  }
}
