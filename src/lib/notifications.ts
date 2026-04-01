import { prisma } from "@/lib/prisma";
import { NotificationType, Prisma } from "@prisma/client";

/**
 * Notification Utility Library
 * Helper functions to create notifications for various events
 */

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a single notification
 */
export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationParams, "userId">
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      metadata: notification.metadata as Prisma.InputJsonValue | undefined,
    })),
  });
}

// ===== Session Reminders =====

/**
 * Send session reminders to registered users
 * Call this from a cron job every 15 minutes
 */
export async function sendSessionReminders() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

  // Find sessions starting in ~1 hour (55-65 min window)
  const oneHourSessions = await prisma.liveSession.findMany({
    where: {
      isActive: true,
      scheduledAt: {
        gte: new Date(now.getTime() + 55 * 60 * 1000),
        lte: new Date(now.getTime() + 65 * 60 * 1000),
      },
    },
    include: {
      registrations: true,
    },
  });

  // Find sessions starting in ~15 min (10-20 min window)
  const fifteenMinSessions = await prisma.liveSession.findMany({
    where: {
      isActive: true,
      scheduledAt: {
        gte: new Date(now.getTime() + 10 * 60 * 1000),
        lte: new Date(now.getTime() + 20 * 60 * 1000),
      },
    },
    include: {
      registrations: true,
    },
  });

  let notificationsSent = 0;

  // Send 1-hour reminders
  for (const session of oneHourSessions) {
    const userIds = session.registrations.map((r) => r.userId);
    if (userIds.length > 0) {
      await createBulkNotifications(userIds, {
        type: "SESSION_REMINDER",
        title: "Session starts in 1 hour",
        message: `"${session.title}" begins in about 1 hour. Don't forget to join!`,
        link: `/live-sessions`,
        metadata: { sessionId: session.id, reminderType: "1hour" },
      });
      notificationsSent += userIds.length;
    }
  }

  // Send 15-minute reminders
  for (const session of fifteenMinSessions) {
    const userIds = session.registrations.map((r) => r.userId);
    if (userIds.length > 0) {
      await createBulkNotifications(userIds, {
        type: "SESSION_REMINDER",
        title: "Session starting soon!",
        message: `"${session.title}" starts in 15 minutes. Get ready to join!`,
        link: `/live-sessions`,
        metadata: { sessionId: session.id, reminderType: "15min" },
      });
      notificationsSent += userIds.length;
    }
  }

  return { notificationsSent };
}

// ===== Points Milestones =====

const POINTS_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];

/**
 * Check and notify user of points milestones
 * Call this after awarding points
 */
export async function checkPointsMilestone(
  userId: string,
  previousTotal: number,
  newTotal: number
) {
  const milestonesReached: number[] = [];

  for (const milestone of POINTS_MILESTONES) {
    if (previousTotal < milestone && newTotal >= milestone) {
      milestonesReached.push(milestone);
    }
  }

  for (const milestone of milestonesReached) {
    await createNotification({
      userId,
      type: "POINTS_MILESTONE",
      title: `${milestone.toLocaleString()} Points! 🎉`,
      message: `Congratulations! You've reached ${milestone.toLocaleString()} total points. Keep up the great work!`,
      link: "/achievements",
      metadata: { milestone, totalPoints: newTotal },
    });
  }

  return milestonesReached;
}

// ===== Leaderboard Changes =====

/**
 * Notify user of leaderboard position change
 */
export async function notifyLeaderboardChange(
  userId: string,
  previousRank: number,
  newRank: number
) {
  // Only notify for improvements or entering top 10
  if (newRank >= previousRank && previousRank !== 0) {
    return null;
  }

  let title: string;
  let message: string;

  if (previousRank === 0 && newRank <= 10) {
    // New entry to top 10
    title = `You're on the leaderboard! 📊`;
    message = `You've entered the top 10 at position #${newRank}. Keep earning points to climb higher!`;
  } else if (newRank === 1) {
    // Reached #1
    title = `You're #1! 🏆`;
    message = `Incredible! You've reached the top of the leaderboard this month!`;
  } else if (newRank <= 3) {
    // Podium position
    title = `Top 3! 🥇🥈🥉`;
    message = `Amazing! You've climbed to position #${newRank} on the leaderboard!`;
  } else {
    // General improvement
    title = `Climbing the ranks! 📈`;
    message = `You've moved up to #${newRank} on the leaderboard (from #${previousRank})!`;
  }

  return createNotification({
    userId,
    type: "LEADERBOARD_CHANGE",
    title,
    message,
    link: "/dashboard",
    metadata: { previousRank, newRank },
  });
}

// ===== New Course Notifications =====

/**
 * Notify all tutors about a new course
 */
export async function notifyNewCourse(
  courseId: string,
  courseTitle: string,
  courseSlug: string,
  isRequired: boolean
) {
  // Get all active tutors
  const tutors = await prisma.user.findMany({
    where: {
      role: { in: ["TUTOR", "LEAD_TUTOR", "ONBOARDING_TUTOR"] },
    },
    select: { id: true },
  });

  const userIds = tutors.map((t) => t.id);

  if (userIds.length === 0) {
    return { notificationsSent: 0 };
  }

  await createBulkNotifications(userIds, {
    type: "ANNOUNCEMENT",
    title: isRequired ? "New Required Course" : "New Course Available",
    message: `"${courseTitle}" is now available${isRequired ? " and required for all tutors" : ""}. Start learning today!`,
    link: `/training/${courseSlug}`,
    metadata: { courseId, isRequired },
  });

  return { notificationsSent: userIds.length };
}

// ===== Badge Earned =====

/**
 * Notify user they earned a badge
 */
export async function notifyBadgeEarned(
  userId: string,
  badgeTitle: string,
  badgeDescription: string
) {
  return createNotification({
    userId,
    type: "BADGE_EARNED",
    title: `New Badge: ${badgeTitle} 🏅`,
    message: badgeDescription,
    link: "/achievements",
    metadata: { badgeTitle },
  });
}

// ===== Course/Path Completion =====

/**
 * Notify user they completed a course
 */
export async function notifyCourseCompleted(
  userId: string,
  courseTitle: string,
  courseSlug: string,
  certificationAwarded?: boolean
) {
  return createNotification({
    userId,
    type: "COURSE_COMPLETED",
    title: `Course Complete! 🎓`,
    message: `Congratulations on completing "${courseTitle}"!${certificationAwarded ? " Your certification has been issued." : ""}`,
    link: `/training/${courseSlug}`,
    metadata: { courseTitle, certificationAwarded },
  });
}

/**
 * Notify user they completed a learning path
 */
export async function notifyPathCompleted(
  userId: string,
  pathTitle: string
) {
  return createNotification({
    userId,
    type: "PATH_COMPLETED",
    title: `Learning Path Complete! 🛤️`,
    message: `Amazing! You've completed the "${pathTitle}" learning path!`,
    link: "/learning-paths",
    metadata: { pathTitle },
  });
}
