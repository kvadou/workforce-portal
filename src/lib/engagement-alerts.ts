import { prisma } from "@/lib/prisma";
import type { AlertType, AlertSeverity } from "@prisma/client";

/**
 * Create an engagement alert
 */
export async function createAlert(
  userId: string,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Check if there's already an active alert of this type for this user
    const existingAlert = await prisma.engagementAlert.findFirst({
      where: {
        userId,
        type,
        status: "ACTIVE",
      },
    });

    if (existingAlert) {
      // Update existing alert instead of creating duplicate
      await prisma.engagementAlert.update({
        where: { id: existingAlert.id },
        data: {
          severity,
          message,
          metadata: metadata as never,
          triggeredAt: new Date(),
        },
      });
      return;
    }

    await prisma.engagementAlert.create({
      data: {
        userId,
        type,
        severity,
        title,
        message,
        metadata: metadata as never,
      },
    });
  } catch (error) {
    console.error("Error creating alert:", error);
  }
}

/**
 * Check for inactive tutors and create alerts
 */
export async function checkInactiveTutors(
  daysThreshold: number = 14
): Promise<number> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  try {
    // Find tutors who haven't logged in recently
    const inactiveTutors = await prisma.user.findMany({
      where: {
        role: { in: ["TUTOR", "LEAD_TUTOR", "ONBOARDING_TUTOR"] },
        updatedAt: { lt: thresholdDate },
      },
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    let alertsCreated = 0;
    for (const tutor of inactiveTutors) {
      const daysSinceActive = Math.floor(
        (Date.now() - tutor.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const severity: AlertSeverity =
        daysSinceActive > 30 ? "HIGH" : daysSinceActive > 21 ? "MEDIUM" : "LOW";

      await createAlert(
        tutor.id,
        "INACTIVE_TUTOR",
        severity,
        "Inactive Tutor",
        `${tutor.name || tutor.email} hasn't been active for ${daysSinceActive} days`,
        { daysSinceActive, lastActive: tutor.updatedAt.toISOString() }
      );
      alertsCreated++;
    }

    return alertsCreated;
  } catch (error) {
    console.error("Error checking inactive tutors:", error);
    return 0;
  }
}

/**
 * Check for expiring certifications and create alerts
 */
export async function checkExpiringCertifications(
  daysThreshold: number = 30
): Promise<number> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  try {
    const expiringCerts = await prisma.tutorCertification.findMany({
      where: {
        status: "COMPLETED",
        expiresAt: {
          not: null,
          lte: thresholdDate,
          gt: new Date(), // Not already expired
        },
      },
      include: {
        tutorProfile: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    let alertsCreated = 0;
    for (const cert of expiringCerts) {
      if (!cert.expiresAt) continue;

      const daysUntilExpiry = Math.floor(
        (cert.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const severity: AlertSeverity =
        daysUntilExpiry <= 7 ? "CRITICAL" : daysUntilExpiry <= 14 ? "HIGH" : "MEDIUM";

      await createAlert(
        cert.tutorProfile.userId,
        "EXPIRING_CERTIFICATION",
        severity,
        "Certification Expiring",
        `${cert.type} certification expires in ${daysUntilExpiry} days`,
        {
          certificationType: cert.type,
          expiresAt: cert.expiresAt.toISOString(),
          daysUntilExpiry,
        }
      );
      alertsCreated++;
    }

    return alertsCreated;
  } catch (error) {
    console.error("Error checking expiring certifications:", error);
    return 0;
  }
}

/**
 * Check for stalled onboarding and create alerts
 */
export async function checkStalledOnboarding(
  daysThreshold: number = 7
): Promise<number> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  try {
    const stalledProgress = await prisma.onboardingProgress.findMany({
      where: {
        status: { notIn: ["COMPLETED", "ACTIVATED"] },
        updatedAt: { lt: thresholdDate },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    let alertsCreated = 0;
    for (const progress of stalledProgress) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - progress.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const severity: AlertSeverity =
        daysSinceUpdate > 14 ? "HIGH" : daysSinceUpdate > 10 ? "MEDIUM" : "LOW";

      await createAlert(
        progress.userId,
        "ONBOARDING_STALLED",
        severity,
        "Onboarding Stalled",
        `Onboarding progress hasn't been updated in ${daysSinceUpdate} days (Current step: ${progress.status})`,
        {
          currentStep: progress.status,
          daysSinceUpdate,
          lastUpdated: progress.updatedAt.toISOString(),
        }
      );
      alertsCreated++;
    }

    return alertsCreated;
  } catch (error) {
    console.error("Error checking stalled onboarding:", error);
    return 0;
  }
}

/**
 * Check for low-rated tutors and create alerts
 */
export async function checkLowRatedTutors(
  ratingThreshold: number = 3.5
): Promise<number> {
  try {
    const lowRatedTutors = await prisma.tutorProfile.findMany({
      where: {
        averageRating: {
          not: null,
          lt: ratingThreshold,
        },
        totalLessons: { gte: 5 }, // Only check tutors with enough lessons
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    let alertsCreated = 0;
    for (const tutor of lowRatedTutors) {
      const rating = tutor.averageRating?.toNumber() || 0;

      const severity: AlertSeverity =
        rating < 2.5 ? "CRITICAL" : rating < 3.0 ? "HIGH" : "MEDIUM";

      await createAlert(
        tutor.userId,
        "LOW_RATING",
        severity,
        "Low Rating Alert",
        `${tutor.user.name || tutor.user.email} has an average rating of ${rating.toFixed(2)} over ${tutor.totalLessons} lessons`,
        {
          averageRating: rating,
          totalLessons: tutor.totalLessons,
        }
      );
      alertsCreated++;
    }

    return alertsCreated;
  } catch (error) {
    console.error("Error checking low-rated tutors:", error);
    return 0;
  }
}

/**
 * Run all engagement checks
 */
export async function runAllEngagementChecks(): Promise<{
  inactiveAlerts: number;
  expiringCertAlerts: number;
  stalledOnboardingAlerts: number;
  lowRatingAlerts: number;
  total: number;
}> {
  const [inactiveAlerts, expiringCertAlerts, stalledOnboardingAlerts, lowRatingAlerts] =
    await Promise.all([
      checkInactiveTutors(),
      checkExpiringCertifications(),
      checkStalledOnboarding(),
      checkLowRatedTutors(),
    ]);

  return {
    inactiveAlerts,
    expiringCertAlerts,
    stalledOnboardingAlerts,
    lowRatingAlerts,
    total: inactiveAlerts + expiringCertAlerts + stalledOnboardingAlerts + lowRatingAlerts,
  };
}
