import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAndAwardMilestones } from "@/lib/badge-engine";
import { verifyInternalApiRequest } from "@/lib/internal-auth";

/**
 * POST /api/webhooks/stc/lessons
 * Webhook endpoint for lesson completion events from Acme
 *
 * Expected payload:
 * {
 *   event: "lesson_completed",
 *   tutorId: string,        // TutorCruncher ID or email
 *   lessonId: string,       // Acme lesson ID
 *   lessonDate: string,     // ISO date
 *   duration: number,       // Duration in minutes
 *   rating?: number,        // Client rating (1-5)
 *   isTrial?: boolean,      // Was this a trial lesson
 *   converted?: boolean,    // Did trial convert to paid
 *   clientId?: string,      // For retention tracking
 *   lessonCount?: number,   // How many lessons with this client
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifyInternalApiRequest(req);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = await req.json();
    const {
      event,
      tutorId,
      lessonDate,
      duration,
      rating,
      isTrial,
      converted,
    } = payload;

    if (event !== "lesson_completed") {
      return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
    }

    // Find tutor profile by TutorCruncher ID or email
    let tutorProfile = await prisma.tutorProfile.findFirst({
      where: {
        OR: [
          { tutorCruncherId: parseInt(tutorId) || undefined },
          { user: { email: tutorId } },
        ],
      },
      include: { user: true },
    });

    if (!tutorProfile) {
      console.warn(`Tutor not found for ID: ${tutorId}`);
      return NextResponse.json(
        { error: "Tutor not found", tutorId },
        { status: 404 }
      );
    }

    // Calculate hours from duration (minutes)
    const hours = (duration || 60) / 60;

    // Update tutor stats
    const updatedProfile = await prisma.tutorProfile.update({
      where: { id: tutorProfile.id },
      data: {
        totalLessons: { increment: 1 },
        totalHours: { increment: hours },
        lastLessonDate: new Date(lessonDate || Date.now()),
        // Update average rating if provided
        ...(rating && {
          averageRating: tutorProfile.averageRating
            ? // Calculate new weighted average
              ((parseFloat(tutorProfile.averageRating.toString()) * tutorProfile.totalLessons + rating) /
                (tutorProfile.totalLessons + 1))
            : rating,
        }),
      },
    });

    // Check for milestone badges
    const milestonesAwarded = await checkAndAwardMilestones(
      tutorProfile.userId,
      updatedProfile.totalLessons,
      rating === 5,
      isTrial && converted
    );

    // Update streak
    await updateLessonStreak(tutorProfile.id, new Date(lessonDate || Date.now()));

    // Log the sync
    console.log(
      `Lesson synced for ${tutorProfile.user.email}: ` +
        `total=${updatedProfile.totalLessons}, hours=${updatedProfile.totalHours}, ` +
        `milestones=${milestonesAwarded.length}`
    );

    return NextResponse.json({
      success: true,
      tutorId: tutorProfile.id,
      totalLessons: updatedProfile.totalLessons,
      totalHours: updatedProfile.totalHours,
      milestonesAwarded,
    });
  } catch (error) {
    console.error("Error processing lesson webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update the tutor's lesson streak
 */
async function updateLessonStreak(tutorProfileId: string, lessonDate: Date) {
  try {
    const today = new Date(lessonDate);
    today.setHours(0, 0, 0, 0);

    const existingStreak = await prisma.tutorStreak.findUnique({
      where: {
        tutorProfileId_type: {
          tutorProfileId,
          type: "LESSONS_DAILY",
        },
      },
    });

    if (!existingStreak) {
      // Create new streak
      await prisma.tutorStreak.create({
        data: {
          tutorProfileId,
          type: "LESSONS_DAILY",
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        },
      });
      return;
    }

    const lastActivity = existingStreak.lastActivityDate;
    if (!lastActivity) {
      // First activity
      await prisma.tutorStreak.update({
        where: { id: existingStreak.id },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(existingStreak.longestStreak, 1),
          lastActivityDate: today,
        },
      });
      return;
    }

    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Same day, no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day, increment streak
      const newStreak = existingStreak.currentStreak + 1;
      await prisma.tutorStreak.update({
        where: { id: existingStreak.id },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(existingStreak.longestStreak, newStreak),
          lastActivityDate: today,
        },
      });
    } else {
      // Streak broken, reset to 1
      await prisma.tutorStreak.update({
        where: { id: existingStreak.id },
        data: {
          currentStreak: 1,
          lastActivityDate: today,
        },
      });
    }
  } catch (error) {
    console.error("Error updating streak:", error);
  }
}
