import { prisma } from "@/lib/prisma";
import { awardPoints, POINTS_TRIGGERS } from "@/lib/points-engine";
import { awardBadge, awardOnboardingCompleteBadge } from "@/lib/badge-engine";
import { createNotification, notifyBadgeEarned } from "@/lib/notifications";
import { getRecommendationsForUser } from "@/lib/recommendations";

/**
 * Onboarding Gamification Integration
 * Awards points, badges, and sends notifications during the onboarding journey
 */

// Point values for onboarding steps
export const ONBOARDING_POINTS = {
  WELCOME_COMPLETE: 10,
  VIDEO_COMPLETE: 10, // Per video
  QUIZ_PASS: 50,
  PROFILE_COMPLETE: 15,
  W9_COMPLETE: 15,
  TRAINING_SESSION: 25, // Per session
  SHADOW_LESSON: 50, // Per lesson
  ONBOARDING_COMPLETE: 250,
} as const;

// Badge keys for onboarding achievements
export const ONBOARDING_BADGES = {
  FIRST_STEP: "onboarding_first_step", // Completed first step (welcome)
  SPEED_LEARNER: "onboarding_speed_learner", // Completed all videos quickly
  QUIZ_MASTER: "onboarding_quiz_master", // Passed quiz on first attempt
  ALL_IN: "onboarding_all_in", // Completed entire onboarding
} as const;

// Extended points triggers for onboarding
export const ONBOARDING_TRIGGERS = {
  WELCOME_COMPLETE: "onboarding_welcome",
  VIDEO_COMPLETE: "onboarding_video",
  QUIZ_PASS: "onboarding_quiz",
  PROFILE_COMPLETE: "onboarding_profile",
  W9_COMPLETE: "onboarding_w9",
  TRAINING_SESSION: "onboarding_training",
  SHADOW_LESSON: "onboarding_shadow",
  ONBOARDING_COMPLETE: "onboarding_complete",
} as const;

/**
 * Get or create tutor profile for a user
 */
async function ensureTutorProfile(userId: string): Promise<string | null> {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (tutorProfile) {
    return tutorProfile.id;
  }

  // Create tutor profile if it doesn't exist
  try {
    const newProfile = await prisma.tutorProfile.create({
      data: {
        userId,
        status: "PENDING",
      },
    });
    return newProfile.id;
  } catch {
    console.error("Failed to create tutor profile for user:", userId);
    return null;
  }
}

/**
 * Award points for an onboarding step
 * This is a wrapper that handles the case where tutor profile might not exist
 */
async function awardOnboardingPoints(
  userId: string,
  trigger: string,
  metadata?: Record<string, unknown>
): Promise<{ awarded: boolean; points: number }> {
  const tutorProfileId = await ensureTutorProfile(userId);
  if (!tutorProfileId) {
    return { awarded: false, points: 0 };
  }

  const result = await awardPoints(tutorProfileId, trigger, metadata);
  return { awarded: result.awarded, points: result.points };
}

/**
 * Award badge and send notification
 */
async function awardBadgeWithNotification(
  userId: string,
  badgeKey: string,
  badgeTitle: string,
  badgeDescription: string
): Promise<boolean> {
  const awarded = await awardBadge(userId, badgeKey);
  if (awarded) {
    await notifyBadgeEarned(userId, badgeTitle, badgeDescription);
  }
  return awarded;
}

/**
 * Handle welcome step completion
 */
export async function onWelcomeComplete(userId: string, progressId: string) {
  // Award points
  await awardOnboardingPoints(userId, ONBOARDING_TRIGGERS.WELCOME_COMPLETE, {
    progressId,
    step: "welcome",
  });

  // Award "First Step" badge
  await awardBadgeWithNotification(
    userId,
    ONBOARDING_BADGES.FIRST_STEP,
    "First Step",
    "You've begun your journey as a Acme Workforce Team Member!"
  );

  // Send notification about next step
  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Next Step: Orientation Videos",
    message: "Watch the orientation videos to learn about our teaching methods.",
    link: "/onboarding",
  });
}

/**
 * Handle video completion
 */
export async function onVideoComplete(
  userId: string,
  videoId: string,
  videoTitle: string,
  progressId: string
) {
  await awardOnboardingPoints(userId, ONBOARDING_TRIGGERS.VIDEO_COMPLETE, {
    videoId,
    videoTitle,
    progressId,
  });
}

/**
 * Handle all videos completed
 */
export async function onAllVideosComplete(
  userId: string,
  progressId: string,
  startTime: Date
) {
  // Check if completed within 24 hours for "Speed Learner" badge
  const hoursElapsed = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);
  if (hoursElapsed <= 24) {
    await awardBadgeWithNotification(
      userId,
      ONBOARDING_BADGES.SPEED_LEARNER,
      "Speed Learner",
      "Completed all orientation videos within 24 hours!"
    );
  }

  // Send notification about quiz
  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Ready for Quiz!",
    message:
      "You've watched all videos. Take the quiz to continue your onboarding.",
    link: "/onboarding",
  });
}

/**
 * Handle quiz pass
 */
export async function onQuizPass(
  userId: string,
  progressId: string,
  score: number,
  attempts: number
) {
  await awardOnboardingPoints(userId, ONBOARDING_TRIGGERS.QUIZ_PASS, {
    progressId,
    score,
    attempts,
  });

  // Award "Quiz Master" badge if passed on first attempt with high score
  if (attempts === 1 && score >= 90) {
    await awardBadgeWithNotification(
      userId,
      ONBOARDING_BADGES.QUIZ_MASTER,
      "Quiz Master",
      "Aced the orientation quiz on your first try!"
    );
  }

  // Send notification about profile
  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Quiz Passed! 🎉",
    message: `Great job! You scored ${score}%. Now complete your profile.`,
    link: "/onboarding",
  });
}

/**
 * Handle profile completion
 */
export async function onProfileComplete(userId: string, progressId: string) {
  await awardOnboardingPoints(userId, ONBOARDING_TRIGGERS.PROFILE_COMPLETE, {
    progressId,
    step: "profile",
  });

  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Profile Complete!",
    message: "Your profile is set up. Now complete your W-9 form.",
    link: "/onboarding",
  });
}

/**
 * Handle W-9 completion
 */
export async function onW9Complete(userId: string, progressId: string) {
  await awardOnboardingPoints(userId, ONBOARDING_TRIGGERS.W9_COMPLETE, {
    progressId,
    step: "w9",
  });

  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Tax Form Submitted!",
    message: "Your W-9 is complete. Register for an orientation session!",
    link: "/onboarding",
  });
}

/**
 * Handle orientation session registration
 */
export async function onOrientationRegistered(
  userId: string,
  sessionDate: Date,
  sessionTitle: string
) {
  // Send reminder notification
  await createNotification({
    userId,
    type: "SESSION_REMINDER",
    title: "Orientation Scheduled!",
    message: `You're registered for "${sessionTitle}" on ${sessionDate.toLocaleDateString()}. We'll remind you before it starts!`,
    link: "/onboarding",
    metadata: { sessionDate: sessionDate.toISOString() },
  });
}

/**
 * Handle training session completion
 */
export async function onTrainingSessionComplete(
  userId: string,
  sessionNumber: number,
  totalSessions: number
) {
  await awardOnboardingPoints(userId, ONBOARDING_TRIGGERS.TRAINING_SESSION, {
    sessionNumber,
    totalSessions,
  });

  if (sessionNumber === totalSessions) {
    await createNotification({
      userId,
      type: "SYSTEM",
      title: "Training Complete! 🎓",
      message: "All training sessions complete! Time for shadow lessons.",
      link: "/onboarding",
    });
  } else {
    await createNotification({
      userId,
      type: "SYSTEM",
      title: `Training Session ${sessionNumber} Complete`,
      message: `${totalSessions - sessionNumber} more sessions to go!`,
      link: "/onboarding",
    });
  }
}

/**
 * Handle shadow lesson completion
 */
export async function onShadowLessonComplete(
  userId: string,
  lessonNumber: number,
  totalLessons: number
) {
  await awardOnboardingPoints(userId, ONBOARDING_TRIGGERS.SHADOW_LESSON, {
    lessonNumber,
    totalLessons,
  });

  if (lessonNumber === totalLessons) {
    await createNotification({
      userId,
      type: "SYSTEM",
      title: "Shadow Lessons Complete! 🌟",
      message:
        "You've completed all shadow lessons! Final review is in progress.",
      link: "/onboarding",
    });
  }
}

/**
 * Handle full onboarding completion
 */
export async function onOnboardingComplete(userId: string, progressId: string) {
  // Award completion points
  await awardOnboardingPoints(userId, ONBOARDING_TRIGGERS.ONBOARDING_COMPLETE, {
    progressId,
    completedAt: new Date().toISOString(),
  });

  // Award "All In" badge
  await awardBadgeWithNotification(
    userId,
    ONBOARDING_BADGES.ALL_IN,
    "All In",
    "Congratulations! You've completed the entire onboarding process!"
  );

  // Also award the generic onboarding complete badge
  await awardOnboardingCompleteBadge(userId);

  // Generate onboarding certificate
  await generateOnboardingCertificate(userId, progressId);

  // Send completion notification with recommendations
  const recommendations = await getRecommendationsForUser(userId, 3);
  const recommendationText =
    recommendations.length > 0
      ? ` Check out recommended courses: ${recommendations.map((r) => r.title).join(", ")}`
      : "";

  await createNotification({
    userId,
    type: "SYSTEM",
    title: "Welcome to the Team! 🎉",
    message: `You've completed onboarding! Your certificate is ready.${recommendationText}`,
    link: "/certificates",
  });
}

/**
 * Generate onboarding completion certificate
 */
export async function generateOnboardingCertificate(
  userId: string,
  progressId: string
): Promise<string | null> {
  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!user) return null;

    // Generate unique certificate number
    const certificateNumber = `ONB-${Date.now()}-${userId.slice(-6).toUpperCase()}`;

    // Check if certificate already exists
    const existing = await prisma.onboardingCertificate.findUnique({
      where: { progressId },
    });

    if (existing) {
      return existing.certificateNumber;
    }

    // Create certificate record
    const certificate = await prisma.onboardingCertificate.create({
      data: {
        userId,
        progressId,
        certificateNumber,
        tutorName: user.name || "Unknown",
      },
    });

    return certificate.certificateNumber;
  } catch (error) {
    console.error("Error generating onboarding certificate:", error);
    return null;
  }
}

/**
 * Create "Complete Onboarding" goal for new user
 */
export async function createOnboardingGoal(userId: string): Promise<boolean> {
  try {
    // Check if goal already exists
    const existingGoal = await prisma.tutorGoal.findFirst({
      where: {
        userId,
        category: "LEARNING",
        name: { contains: "onboarding" },
      },
    });

    if (existingGoal) {
      return false;
    }

    // Get onboarding goal template if it exists
    const template = await prisma.goalTemplate.findFirst({
      where: {
        name: { contains: "Onboarding" },
        isActive: true,
      },
    });

    // Create the goal
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days to complete

    await prisma.tutorGoal.create({
      data: {
        userId,
        templateId: template?.id,
        name: "Complete Onboarding",
        description:
          "Finish all onboarding steps to become a certified Acme Workforce Team Member",
        category: "LEARNING",
        targetValue: 8, // 8 steps total
        currentValue: 0,
        startDate: new Date(),
        endDate,
        status: "IN_PROGRESS",
      },
    });

    return true;
  } catch (error) {
    console.error("Error creating onboarding goal:", error);
    return false;
  }
}

/**
 * Update onboarding goal progress
 */
export async function updateOnboardingGoalProgress(
  userId: string,
  stepsCompleted: number
): Promise<void> {
  try {
    const goal = await prisma.tutorGoal.findFirst({
      where: {
        userId,
        category: "LEARNING",
        name: { contains: "Onboarding" },
        status: "IN_PROGRESS",
      },
    });

    if (!goal) return;

    const isComplete = stepsCompleted >= goal.targetValue;

    await prisma.tutorGoal.update({
      where: { id: goal.id },
      data: {
        currentValue: stepsCompleted,
        status: isComplete ? "COMPLETED" : "IN_PROGRESS",
        completedAt: isComplete ? new Date() : undefined,
      },
    });
  } catch (error) {
    console.error("Error updating onboarding goal:", error);
  }
}

/**
 * Calculate completed steps from progress record
 */
export function calculateCompletedSteps(progress: {
  welcomeCompletedAt: Date | null;
  videosCompletedAt: Date | null;
  quizPassedAt: Date | null;
  profileCompletedAt: Date | null;
  w9CompletedAt: Date | null;
  orientationAttendedAt: Date | null;
  trainingCompletedAt: Date | null;
  shadowCompletedAt: Date | null;
}): number {
  let steps = 0;
  if (progress.welcomeCompletedAt) steps++;
  if (progress.videosCompletedAt) steps++;
  if (progress.quizPassedAt) steps++;
  if (progress.profileCompletedAt) steps++;
  if (progress.w9CompletedAt) steps++;
  if (progress.orientationAttendedAt) steps++;
  if (progress.trainingCompletedAt) steps++;
  if (progress.shadowCompletedAt) steps++;
  return steps;
}

/**
 * Send orientation reminder notification
 * Call this from a cron job
 */
export async function sendOrientationReminders(): Promise<number> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  let remindersSent = 0;

  // Find orientation sessions starting tomorrow
  const tomorrowSessions = await prisma.orientationSession.findMany({
    where: {
      isActive: true,
      scheduledAt: {
        gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      participants: {
        select: { userId: true },
      },
    },
  });

  for (const session of tomorrowSessions) {
    for (const participant of session.participants) {
      await createNotification({
        userId: participant.userId,
        type: "SESSION_REMINDER",
        title: "Orientation Tomorrow!",
        message: `Reminder: Your orientation session "${session.title}" is tomorrow at ${session.scheduledAt.toLocaleTimeString()}.`,
        link: "/onboarding",
        metadata: { sessionId: session.id, reminderType: "24hour" },
      });
      remindersSent++;
    }
  }

  // Find orientation sessions starting in ~1 hour
  const soonSessions = await prisma.orientationSession.findMany({
    where: {
      isActive: true,
      scheduledAt: {
        gte: new Date(now.getTime() + 55 * 60 * 1000),
        lte: new Date(now.getTime() + 65 * 60 * 1000),
      },
    },
    include: {
      participants: {
        select: { userId: true },
      },
    },
  });

  for (const session of soonSessions) {
    for (const participant of session.participants) {
      await createNotification({
        userId: participant.userId,
        type: "SESSION_REMINDER",
        title: "Orientation Starting Soon!",
        message: `Your orientation session "${session.title}" starts in 1 hour. Get ready!`,
        link: "/onboarding",
        metadata: { sessionId: session.id, reminderType: "1hour" },
      });
      remindersSent++;
    }
  }

  return remindersSent;
}
